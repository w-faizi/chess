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
        
        // Wait for DOM to be ready
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
        // File upload
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

        // FIXED: Username fetch button
        const fetchBtn = document.getElementById('fetch-games');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', (e) => {
                console.log('Fetch Games button clicked!');
                e.preventDefault();
                this.fetchGamesByUsername();
            });
        } else {
            console.error('Fetch games button not found!');
        }

        // Board controls
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

        // Keyboard shortcuts
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

        console.log('Loading sample game from file upload...');
        this.loadSampleGame('File Upload');
    }

    fetchGamesByUsername() {
        const username = document.getElementById('username-input');
        const platform = document.getElementById('platform-select');
        
        if (!username || !platform) {
            console.error('Username input or platform select not found');
            return;
        }
        
        const usernameValue = username.value.trim();
        const platformValue = platform.value;
        
        console.log(`Fetching games for: ${usernameValue} on ${platformValue}`);

        if (!usernameValue) {
            this.showError('Please enter a username');
            return;
        }

        // Show loading message
        this.showLoading('Fetching games...');

        // Simulate API call with timeout
        setTimeout(() => {
            console.log('Loading sample games...');
            this.hideLoading();
            this.loadMultipleGames(usernameValue, platformValue);
        }, 1500);
    }

    loadMultipleGames(username, platform) {
        const sampleGames = [
            {
                id: 1,
                white: username,
                black: 'ChessBot2000',
                result: '1-0',
                date: '2024.08.07',
                event: `${platform} Game`,
                pgn: `[Event "${platform} Game"]
[White "${username}"]
[Black "ChessBot2000"]
[Result "1-0"]
[Date "2024.08.07"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 1-0`
            },
            {
                id: 2,
                white: 'GrandmasterAI',
                black: username,
                result: '0-1',
                date: '2024.08.06',
                event: `${platform} Game`,
                pgn: `[Event "${platform} Game"]
[White "GrandmasterAI"]
[Black "${username}"]
[Result "0-1"]
[Date "2024.08.06"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 0-1`
            },
            {
                id: 3,
                white: username,
                black: 'TacticalTiger',
                result: '1/2-1/2',
                date: '2024.08.05',
                event: `${platform} Game`,
                pgn: `[Event "${platform} Game"]
[White "${username}"]
[Black "TacticalTiger"]
[Result "1/2-1/2"]
[Date "2024.08.05"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. f3 b5 8. Qd2 Bb7 9. O-O-O Nbd7 1/2-1/2`
            }
        ];

        this.displayGamesList(sampleGames);
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
                console.log(`Loading game: ${game.white} vs ${game.black}`);
                document.querySelectorAll('.game-item').forEach(item => {
                    item.classList.remove('selected');
                });
                gameItem.classList.add('selected');
                this.loadGame(game);
            });

            gamesContainer.appendChild(gameItem);
        });

        gamesList.style.display = 'block';
        console.log(`Displayed ${games.length} games`);
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

    loadSampleGame(source = 'Demo') {
        const sampleGame = {
            white: 'Player1',
            black: 'Player2',
            result: '1-0',
            date: '2024.08.07',
            event: source,
            pgn: `[Event "${source}"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]
[Date "2024.08.07"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 exd4 11. cxd4 Nd5 1-0`
        };

        this.loadGame(sampleGame);
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
        
        // Remove existing error
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
        }, 5000);
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
