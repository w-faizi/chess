let chessApp;

function initializeApp() {
    try {
        if (typeof Chess === 'undefined' || typeof Chessboard === 'undefined') {
            throw new Error('Chess libraries not loaded');
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
        
        setTimeout(() => this.init(), 100);
    }
    
    init() {
        this.initializeUI();
        this.setupEventListeners();
        this.initializeBoard();
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

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        document.getElementById('fetch-games').addEventListener('click', () => {
            this.fetchGamesByUsername();
        });

        document.getElementById('first-move').addEventListener('click', () => this.goToMove(0));
        document.getElementById('prev-move').addEventListener('click', () => this.previousMove());
        document.getElementById('next-move').addEventListener('click', () => this.nextMove());
        document.getElementById('last-move').addEventListener('click', () => this.goToMove(this.moves.length - 1));
    }

    initializeBoard() {
        const config = {
            draggable: false,
            position: 'start',
            showNotation: true
        };

        this.board = Chessboard('chess-board', config);
    }

    async handleFileUpload(file) {
        if (!file.name.endsWith('.pgn')) {
            this.showError('Please upload a valid PGN file');
            return;
        }

        // For demo, load a sample game
        this.loadSampleGame();
    }

    loadSampleGame() {
        const sampleGame = {
            white: 'Player1',
            black: 'Player2',
            result: '1-0',
            date: '2024.01.01',
            event: 'Sample Game',
            pgn: `[Event "Sample Game"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 1-0`
        };

        this.chess.loadPgn(sampleGame.pgn);
        this.extractMoves();
        this.displayGameInfo(sampleGame);
        this.displayMovesList();
        this.goToMove(0);
        
        document.getElementById('analysis-section').style.display = 'flex';
    }

    fetchGamesByUsername() {
        const username = document.getElementById('username-input').value.trim();
        if (!username) {
            this.showError('Please enter a username');
            return;
        }

        // Load sample game for demo
        this.loadSampleGame();
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
    }

    displayGameInfo(game) {
        const gameHeader = document.getElementById('game-header');
        gameHeader.innerHTML = `
            <h2>${game.white} vs ${game.black}</h2>
            <div>${game.event} • ${game.date} • ${game.result}</div>
        `;
    }

    displayMovesList() {
        const movesList = document.getElementById('moves-list');
        movesList.innerHTML = '';

        this.moves.forEach((move, index) => {
            if (index === 0) return;

            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            moveItem.textContent = `${Math.ceil(index/2)}. ${move.san}`;
            moveItem.addEventListener('click', () => this.goToMove(index));
            movesList.appendChild(moveItem);
        });
    }

    goToMove(moveIndex) {
        if (moveIndex < 0 || moveIndex >= this.moves.length) return;

        this.currentMoveIndex = moveIndex;
        const move = this.moves[moveIndex];
        
        this.board.position(move.fen);
        
        document.querySelectorAll('.move-item').forEach((item, index) => {
            item.classList.toggle('current', index === moveIndex - 1);
        });

        this.updateControlButtons();
    }

    updateControlButtons() {
        document.getElementById('first-move').disabled = this.currentMoveIndex <= 0;
        document.getElementById('prev-move').disabled = this.currentMoveIndex <= 0;
        document.getElementById('next-move').disabled = this.currentMoveIndex >= this.moves.length - 1;
        document.getElementById('last-move').disabled = this.currentMoveIndex >= this.moves.length - 1;
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
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.querySelector('.input-section').appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}
