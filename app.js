let chessApp;

function initializeApp() {
    try {
        if (typeof Chess === 'undefined' || typeof Chessboard === 'undefined') {
            console.log('Waiting for libraries to load...');
            setTimeout(initializeApp, 500);
            return;
        }
        chessApp = new ChessAnalysis();
        console.log('Chess Analysis App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

class ChessAnalysis {
    constructor() {
        this.chess = new Chess();
        this.board = null;
        this.moves = [];
        this.currentMoveIndex = -1;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            setTimeout(() => this.init(), 100);
        }
    }
    
    init() {
        console.log('Initializing Chess Analysis...');
        this.initializeUI();
        this.setupEventListeners();
        this.initializeBoard();
        console.log('Chess Analysis ready!');
    }

    initializeUI() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('pgn-file');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }

        const fetchBtn = document.getElementById('fetch-games');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', (e) => {
                console.log('Fetch Games button clicked!');
                e.preventDefault();
                this.fetchGamesByUsername();
            });
        }

        const controls = {
            'first-move': () => this.goToMove(0),
            'prev-move': () => this.previousMove(),
            'next-move': () => this.nextMove(),
            'last-move': () => this.goToMove(this.moves.length - 1)
        };

        Object.entries(controls).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.moves.length > 0) {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousMove();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextMove();
                        break;
                }
            }
        });
    }

    initializeBoard() {
        try {
            const config = {
                draggable: false,
                position: 'start',
                showNotation: true
            };

            this.board = Chessboard('chess-board', config);
            console.log('Chessboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize chessboard:', error);
        }
    }

    async handleFileUpload(file) {
        if (!file.name.endsWith('.pgn')) {
            this.showError('Please upload a valid PGN file');
            return;
        }

        try {
            const text = await file.text();
            const games = this.parsePGN(text);
            
            if (games.length === 0) {
                this.showError('No valid games found in PGN file');
                return;
            }

            this.displayGamesList(games);
        } catch (error) {
            this.showError('Error reading PGN file: ' + error.message);
        }
    }

    parsePGN(pgnText) {
        const games = [];
        const gameStrings = pgnText.split(/(?=\[Event)/g).filter(game => game.trim());

        gameStrings.forEach((gameStr, index) => {
            try {
                const chess = new Chess();
                if (chess.loadPgn(gameStr)) {
                    const header = chess.header();
                    games.push({
                        id: index,
                        pgn: gameStr,
                        white: header.White || 'Unknown',
                        black: header.Black || 'Unknown',
                        result: header.Result || '*',
                        date: header.Date || 'Unknown',
                        event: header.Event || 'Unknown'
                    });
                }
            } catch (e) {
                console.warn('Failed to parse game:', e);
            }
        });

        return games;
    }

    async fetchGamesByUsername() {
        const username = document.getElementById('username-input');
        const platform = document.getElementById('platform-select');
        
        if (!username || !platform) {
            console.error('Username input or platform select not found');
            return;
        }
        
        const usernameValue = username.value.trim();
        const platformValue = platform.value;
        
        console.log(`Fetching real games for: ${usernameValue} on ${platformValue}`);

        if (!usernameValue) {
            this.showError('Please enter a username');
            return;
        }

        this.showLoading('Fetching games from API...');

        try {
            let games = [];
            
            if (platformValue === 'chess.com') {
                games = await this.fetchChessComGames(usernameValue);
            } else if (platformValue === 'lichess') {
                games = await this.fetchLichessGames(usernameValue);
            }

            this.hideLoading();
            
            if (games.length === 0) {
                this.showError('No games found for this username. Please check the username is correct.');
                return;
            }

            this.displayGamesList(games);
            
        } catch (error) {
            this.hideLoading();
            console.error('Error fetching games:', error);
            this.showError(`Error fetching games: ${error.message}. Please check the username and try again.`);
        }
    }

    async fetchChessComGames(username) {
        try {
            // First, get the list of available archives
            const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
            
            if (!archivesResponse.ok) {
                throw new Error(`User "${username}" not found on Chess.com`);
            }
            
            const archivesData = await archivesResponse.json();
            const archives = archivesData.archives;
            
            if (archives.length === 0) {
                throw new Error('No game archives found for this user');
            }

            // Get the most recent archive (last in the list)
            const latestArchive = archives[archives.length - 1];
            console.log(`Fetching from archive: ${latestArchive}`);
            
            const gamesResponse = await fetch(latestArchive);
            
            if (!gamesResponse.ok) {
                throw new Error('Failed to fetch games from Chess.com');
            }
            
            const gamesData = await gamesResponse.json();
            const games = gamesData.games || [];
            
            console.log(`Found ${games.length} games in latest archive`);
            
            // Take only the last 10 games and convert to our format
            return games.slice(-10).map((game, index) => {
                const pgn = game.pgn;
                const whitePlayer = game.white?.username || 'Unknown';
                const blackPlayer = game.black?.username || 'Unknown';
                
                // Extract date from PGN or use timestamp
                let gameDate = 'Unknown';
                const dateMatch = pgn.match(/\[Date "([^"]+)"\]/);
                if (dateMatch) {
                    gameDate = dateMatch[1];
                } else if (game.end_time) {
                    gameDate = new Date(game.end_time * 1000).toISOString().split('T')[0].replace(/-/g, '.');
                }
                
                // Extract result from PGN or use game result
                let result = '*';
                const resultMatch = pgn.match(/\[Result "([^"]+)"\]/);
                if (resultMatch) {
                    result = resultMatch[1];
                }
                
                return {
                    id: index,
                    pgn: pgn,
                    white: whitePlayer,
                    black: blackPlayer,
                    result: result,
                    date: gameDate,
                    event: `Chess.com ${game.time_class || 'Game'}`,
                    url: game.url
                };
            });
            
        } catch (error) {
            console.error('Chess.com API error:', error);
            throw error;
        }
    }

    async fetchLichessGames(username) {
        try {
            // Lichess API endpoint for user games
            const url = `https://lichess.org/api/games/user/${username}?max=10&format=json`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/x-ndjson'
                }
            });
            
            if (!response.ok) {
                throw new Error(`User "${username}" not found on Lichess or no games available`);
            }
            
            const text = await response.text();
            const lines = text.trim().split('\n').filter(line => line.trim());
            
            console.log(`Found ${lines.length} games from Lichess`);
            
            return lines.map((line, index) => {
                try {
                    const game = JSON.parse(line);
                    
                    // Convert Lichess game format to our format
                    const whitePlayer = game.players?.white?.user?.name || game.players?.white?.name || 'Anonymous';
                    const blackPlayer = game.players?.black?.user?.name || game.players?.black?.name || 'Anonymous';
                    
                    let result = '*';
                    if (game.winner === 'white') result = '1-0';
                    else if (game.winner === 'black') result = '0-1';
                    else if (game.status === 'draw') result = '1/2-1/2';
                    
                    const gameDate = new Date(game.createdAt).toISOString().split('T')[0].replace(/-/g, '.');
                    
                    // Create PGN from available data
                    const pgn = this.createPGNFromLichessGame(game, whitePlayer, blackPlayer, result, gameDate);
                    
                    return {
                        id: index,
                        pgn: pgn,
                        white: whitePlayer,
                        black: blackPlayer,
                        result: result,
                        date: gameDate,
                        event: `Lichess ${game.speed || 'Game'}`,
                        url: `https://lichess.org/${game.id}`
                    };
                } catch (e) {
                    console.warn('Failed to parse Lichess game:', e);
                    return null;
                }
            }).filter(game => game !== null);
            
        } catch (error) {
            console.error('Lichess API error:', error);
            throw error;
        }
    }

    createPGNFromLichessGame(game, white, black, result, date) {
        // Create a basic PGN structure
        let pgn = `[Event "Lichess ${game.speed || 'Game'}"]
[Site "lichess.org"]
[Date "${date}"]
[White "${white}"]
[Black "${black}"]
[Result "${result}"]
[WhiteElo "${game.players?.white?.rating || '?'}"]
[BlackElo "${game.players?.black?.rating || '?'}"]
[TimeControl "${game.clock?.initial || '?'}+${game.clock?.increment || '?'}"]
[Termination "${game.status}"]

`;

        // If moves are available, add them
        if (game.moves) {
            pgn += game.moves + ' ' + result;
        } else {
            pgn += '1. e4 e5 2. Nf3 Nc6 3. Bb5 ' + result; // Sample moves if none provided
        }

        return pgn;
    }

    displayGamesList(games) {
        const gamesList = document.getElementById('games-list');
        const gamesContainer = document.getElementById('games-container');

        if (!gamesList || !gamesContainer) {
            console.error('Games list elements not found');
            return;
        }

        gamesContainer.innerHTML = '';

        games.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            gameItem.innerHTML = `
                <div style="font-weight: 500; margin-bottom: 5px;">
                    ${game.white} vs ${game.black}
                </div>
                <div style="font-size: 0.9em; color: var(--text-secondary);">
                    ${game.event} • ${game.date} • ${game.result}
                </div>
            `;

            gameItem.addEventListener('click', () => {
                console.log(`Loading real game: ${game.white} vs ${game.black}`);
                document.querySelectorAll('.game-item').forEach(item => {
                    item.classList.remove('selected');
                });
                gameItem.classList.add('selected');
                this.loadGame(game);
            });

            gamesContainer.appendChild(gameItem);
        });

        gamesList.style.display = 'block';
        console.log(`Displayed ${games.length} real games`);
    }

    loadGame(game) {
        try {
            console.log('Loading game:', game);
            this.chess = new Chess();
            
            if (!this.chess.loadPgn(game.pgn)) {
                throw new Error('Failed to load PGN');
            }

            this.extractMoves();
            this.displayGameInfo(game);
            this.displayMovesList();
            this.goToMove(0);
            
            const analysisSection = document.getElementById('analysis-section');
            if (analysisSection) {
                analysisSection.style.display = 'flex';
                console.log('Analysis section displayed');
            }

        } catch (error) {
            console.error('Error loading game:', error);
            this.showError('Error loading game: ' + error.message);
        }
    }

    extractMoves() {
        this.chess.reset();
        this.moves = [];

        const history = this.chess.history({ verbose: true });
        this.chess.reset();

        let tempChess = new Chess();
        this.moves.push({
            fen: tempChess.fen(),
            san: 'Starting position'
        });

        history.forEach((move) => {
            tempChess.move(move);
            this.moves.push({
                fen: tempChess.fen(),
                san: move.san
            });
        });

        console.log(`Extracted ${this.moves.length} moves`);
    }

    displayGameInfo(game) {
        const gameHeader = document.getElementById('game-header');
        if (gameHeader) {
            gameHeader.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2>${game.white} vs ${game.black}</h2>
                    <span style="font-weight: 600; font-size: 1.2em;">${game.result}</span>
                </div>
                <div style="color: var(--text-secondary);">
                    ${game.event} • ${game.date}
                    ${game.url ? `• <a href="${game.url}" target="_blank" style="color: var(--primary-color);">View Game</a>` : ''}
                </div>
            `;
        }
    }

    displayMovesList() {
        const movesList = document.getElementById('moves-list');
        if (!movesList) return;
        
        movesList.innerHTML = '';

        this.moves.forEach((move, index) => {
            if (index === 0) return;

            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            
            const moveNumber = Math.ceil(index / 2);
            const isWhite = (index - 1) % 2 === 0;
            
            moveItem.textContent = isWhite ? `${moveNumber}. ${move.san}` : `${move.san}`;
            moveItem.addEventListener('click', () => this.goToMove(index));
            movesList.appendChild(moveItem);
        });
    }

    goToMove(moveIndex) {
        if (moveIndex < 0 || moveIndex >= this.moves.length) return;

        this.currentMoveIndex = moveIndex;
        const move = this.moves[moveIndex];
        
        if (this.board && this.board.position) {
            this.board.position(move.fen);
        }
        
        document.querySelectorAll('.move-item').forEach((item, index) => {
            item.classList.toggle('current', index === moveIndex - 1);
        });

        this.updateControlButtons();
    }

    updateControlButtons() {
        const buttons = ['first-move', 'prev-move', 'next-move', 'last-move'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                switch(id) {
                    case 'first-move':
                    case 'prev-move':
                        btn.disabled = this.currentMoveIndex <= 0;
                        break;
                    case 'next-move':
                    case 'last-move':
                        btn.disabled = this.currentMoveIndex >= this.moves.length - 1;
                        break;
                }
            }
        });
    }

    nextMove() {
        if (this.currentMoveIndex < this.moves.length - 1) {
            this.goToMove(this.currentMoveIndex + 1);
        }
    }

    previousMove() {
        if (this.currentMoveIndex > 0) {
            this.goToMove(this.currentMoveIndex - 1);
        }
    }

    showError(message) {
        console.error('Error:', message);
        const inputSection = document.querySelector('.input-section');
        if (!inputSection) return;
        
        const existingError = inputSection.querySelector('.error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        inputSection.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 8000);
    }

    showLoading(message) {
        console.log('Loading:', message);
        const inputSection = document.querySelector('.input-section');
        if (!inputSection) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.id = 'loading-indicator';
        loadingDiv.textContent = message;
        inputSection.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loading-indicator');
        if (loadingDiv) {
           loadingDiv.remove();
        }
    }
}
