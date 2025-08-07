// Global variables
let board = null;
let game = null;
let gameHistory = [];
let currentMove = 0;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing chess analyzer...');
    
    // Initialize board
    try {
        board = Chessboard('chess-board', {
            draggable: false,
            position: 'start'
        });
        console.log('Board initialized');
    } catch (error) {
        console.error('Board initialization failed:', error);
    }
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('App ready!');
}

function setupEventListeners() {
    // Tab switching
    document.getElementById('upload-tab-btn').addEventListener('click', function() {
        switchTab('upload');
    });
    
    document.getElementById('username-tab-btn').addEventListener('click', function() {
        switchTab('username');
    });
    
    // File upload
    document.getElementById('upload-area').addEventListener('click', function() {
        document.getElementById('pgn-file').click();
    });
    
    document.getElementById('pgn-file').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Fetch games button
    document.getElementById('fetch-games-btn').addEventListener('click', function() {
        fetchGames();
    });
    
    // Board controls
    document.getElementById('first-btn').addEventListener('click', () => goToMove(0));
    document.getElementById('prev-btn').addEventListener('click', () => goToMove(currentMove - 1));
    document.getElementById('next-btn').addEventListener('click', () => goToMove(currentMove + 1));
    document.getElementById('last-btn').addEventListener('click', () => goToMove(gameHistory.length - 1));
    
    console.log('Event listeners setup complete');
}

function switchTab(tabName) {
    // Update tab buttons
    document.getElementById('upload-tab-btn').classList.toggle('active', tabName === 'upload');
    document.getElementById('username-tab-btn').classList.toggle('active', tabName === 'username');
    
    // Update tab content
    document.getElementById('upload-tab').classList.toggle('active', tabName === 'upload');
    document.getElementById('username-tab').classList.toggle('active', tabName === 'username');
}

function handleFileUpload(file) {
    console.log('File uploaded:', file.name);
    
    if (!file.name.endsWith('.pgn')) {
        showMessage('Please select a PGN file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            loadGameFromPGN(e.target.result);
            showMessage('PGN loaded successfully!', 'success');
        } catch (error) {
            showMessage('Error loading PGN: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function fetchGames() {
    const username = document.getElementById('username-input').value.trim();
    const platform = document.getElementById('platform-select').value;
    
    console.log('Fetching games for:', username, 'on', platform);
    
    if (!username) {
        showMessage('Please enter a username', 'error');
        return;
    }
    
    showMessage('Fetching games...', 'loading');
    
    // Create sample games for demonstration
    setTimeout(() => {
        const sampleGames = [
            {
                id: 1,
                white: username,
                black: 'Opponent1',
                result: '1-0',
                date: '2024.08.07',
                event: `${platform} Game`,
                pgn: `[Event "${platform} Game"]
[White "${username}"]
[Black "Opponent1"]
[Result "1-0"]
[Date "2024.08.07"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 1-0`
            },
            {
                id: 2,
                white: 'Opponent2',
                black: username,
                result: '0-1',
                date: '2024.08.06',
                event: `${platform} Game`,
                pgn: `[Event "${platform} Game"]
[White "Opponent2"]
[Black "${username}"]
[Result "0-1"]
[Date "2024.08.06"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 0-1`
            },
            {
                id: 3,
                white: username,
                black: 'Opponent3',
                result: '1/2-1/2',
                date: '2024.08.05',
                event: `${platform} Game`,
                pgn: `[Event "${platform} Game"]
[White "${username}"]
[Black "Opponent3"]
[Result "1/2-1/2"]
[Date "2024.08.05"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 1/2-1/2`
            }
        ];
        
        displayGamesList(sampleGames);
        showMessage(`Found ${sampleGames.length} games`, 'success');
    }, 1500);
}

function displayGamesList(games) {
    const gamesContainer = document.getElementById('games-container');
    const gamesList = document.getElementById('games-list');
    
    gamesContainer.innerHTML = '';
    
    games.forEach(gameData => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-item';
        gameDiv.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 5px;">
                ${gameData.white} vs ${gameData.black}
            </div>
            <div style="font-size: 0.9em; color: #666;">
                ${gameData.event} • ${gameData.date} • ${gameData.result}
            </div>
        `;
        
        gameDiv.addEventListener('click', function() {
            document.querySelectorAll('.game-item').forEach(item => {
                item.classList.remove('selected');
            });
            gameDiv.classList.add('selected');
            loadGameFromPGN(gameData.pgn);
            showGameInfo(gameData);
        });
        
        gamesContainer.appendChild(gameDiv);
    });
    
    gamesList.style.display = 'block';
}

function loadGameFromPGN(pgnString) {
    try {
        console.log('Loading PGN:', pgnString);
        
        game = new Chess();
        
        if (!game.load_pgn(pgnString)) {
            throw new Error('Invalid PGN format');
        }
        
        // Extract game history
        gameHistory = [];
        game.reset();
        
        // Add starting position
        gameHistory.push({
            fen: game.fen(),
            move: 'Starting position'
        });
        
        // Load moves one by one
        const moves = game.history();
        game.reset();
        
        moves.forEach(move => {
            game.move(move);
            gameHistory.push({
                fen: game.fen(),
                move: move
            });
        });
        
        console.log('Game loaded with', gameHistory.length, 'positions');
        
        // Display moves list
        displayMovesList();
        
        // Go to starting position
        goToMove(0);
        
        // Show analysis section
        document.getElementById('analysis-section').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading game:', error);
        showMessage('Error loading game: ' + error.message, 'error');
    }
}

function displayMovesList() {
    const movesList = document.getElementById('moves-list');
    movesList.innerHTML = '';
    
    gameHistory.forEach((position, index) => {
        if (index === 0) return; // Skip starting position
        
        const moveDiv = document.createElement('div');
        moveDiv.className = 'move-item';
        
        const moveNumber = Math.ceil(index / 2);
        const isWhite = (index - 1) % 2 === 0;
        
        moveDiv.textContent = isWhite ? `${moveNumber}. ${position.move}` : position.move;
        moveDiv.addEventListener('click', () => goToMove(index));
        
        movesList.appendChild(moveDiv);
    });
}

function showGameInfo(gameData) {
    const gameHeader = document.getElementById('game-header');
    gameHeader.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h2>${gameData.white} vs ${gameData.black}</h2>
            <span style="font-weight: 600;">${gameData.result}</span>
        </div>
        <div style="color: #666;">
            ${gameData.event} • ${gameData.date}
        </div>
    `;
}

function goToMove(moveIndex) {
    if (moveIndex < 0 || moveIndex >= gameHistory.length) return;
    
    currentMove = moveIndex;
    const position = gameHistory[moveIndex];
    
    // Update board
    board.position(position.fen);
    
    // Highlight current move
    document.querySelectorAll('.move-item').forEach((item, index) => {
        item.classList.toggle('current', index === moveIndex - 1);
    });
    
    // Update evaluation (simple mock)
    updateEvaluation();
    
    console.log('Moved to position', moveIndex);
}

function updateEvaluation() {
    const evalValue = (Math.random() - 0.5) * 4; // Random evaluation for demo
    const evalText = document.getElementById('eval-text');
    const evalFill = document.getElementById('eval-fill');
    
    evalText.textContent = evalValue > 0 ? `+${evalValue.toFixed(1)}` : evalValue.toFixed(1);
    
    const percentage = Math.max(0, Math.min(100, (evalValue + 5) * 10));
    evalFill.style.width = `${percentage}%`;
}

function showMessage(message, type) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.innerHTML = `<div class="${type}">${message}</div>`;
    
    if (type !== 'loading') {
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    }
}
