const socket = io();

let gameState = {
    playerHand: [],
    playerField: [],
    opponentField: [],
    currentTurn: 'player',
    playerDeckCount: 30,
    opponentDeckCount: 30
};

const ai = new AI(gameState);

function updateGameBoard() {
    console.log('Updating game board with state:', gameState);
    updateHand();
    updateField('player-field', gameState.playerField);
    updateField('opponent-field', gameState.opponentField);
    updateDeckCounts();
    updateTurnIndicator();
}

function updateHand() {
    const handElement = document.getElementById('player-hand');
    handElement.innerHTML = '';
    if (Array.isArray(gameState.playerHand)) {
        gameState.playerHand.forEach(card => {
            const cardElement = createCardElement(card);
            cardElement.onclick = () => playCard(card.id);
            handElement.appendChild(cardElement);
        });
    } else {
        console.error('gameState.playerHand is not an array:', gameState.playerHand);
    }
}

function updateField(fieldId, fieldCards) {
    const fieldElement = document.getElementById(fieldId);
    fieldElement.innerHTML = '';
    if (Array.isArray(fieldCards)) {
        fieldCards.forEach(card => {
            const cardElement = createCardElement(card);
            fieldElement.appendChild(cardElement);
        });
    } else {
        console.error(`${fieldId} is not an array:`, fieldCards);
    }
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-stats">
            <span>ATK: ${card.attack}</span>
            <span>DEF: ${card.defense}</span>
        </div>
        <div class="card-type">${card.type}</div>
    `;
    return cardElement;
}

function updateDeckCounts() {
    const playerDeckCount = document.getElementById('player-deck-count');
    const opponentDeckCount = document.getElementById('opponent-deck-count');
    playerDeckCount.textContent = gameState.playerDeckCount;
    opponentDeckCount.textContent = gameState.opponentDeckCount;
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turn-indicator');
    turnIndicator.textContent = gameState.currentTurn === 'player' ? 'Your Turn' : 'Opponent\'s Turn';
}

function showError(message) {
    console.error('Game error:', message);
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }, 5000);
}

function drawCard() {
    console.log('Attempting to draw a card');
    if (gameState.currentTurn !== 'player') {
        showError("It's not your turn!");
        return;
    }
    
    fetch('/api/draw_card')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to draw card');
            }
            return response.json();
        })
        .then(card => {
            console.log('Card drawn:', card);
            if (!Array.isArray(gameState.playerHand)) {
                gameState.playerHand = [];
            }
            gameState.playerHand.push(card);
            gameState.playerDeckCount--;
            updateGameBoard();
        })
        .catch(error => {
            console.error('Error drawing card:', error);
            showError('Failed to draw card. Please try again.');
        });
}

function playCard(cardId) {
    console.log('Attempting to play card:', cardId);
    if (gameState.currentTurn !== 'player') {
        showError("It's not your turn!");
        return;
    }
    
    fetch('/api/play_card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card_id: cardId }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to play card');
            }
            return response.json();
        })
        .then(data => {
            console.log('Card played successfully:', data);
            if (data.success) {
                const cardIndex = gameState.playerHand.findIndex(card => card.id === cardId);
                const playedCard = gameState.playerHand.splice(cardIndex, 1)[0];
                if (!Array.isArray(gameState.playerField)) {
                    gameState.playerField = [];
                }
                gameState.playerField.push(playedCard);
                updateGameBoard();
            }
        })
        .catch(error => {
            console.error('Error playing card:', error);
            showError('Failed to play card. Please try again.');
        });
}

function endTurn() {
    console.log('Attempting to end turn');
    if (gameState.currentTurn !== 'player') {
        showError("It's not your turn!");
        return;
    }
    
    fetch('/api/end_turn')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to end turn');
            }
            return response.json();
        })
        .then(data => {
            console.log('Turn ended successfully:', data);
            if (data.success) {
                gameState.currentTurn = 'opponent';
                updateGameBoard();
                setTimeout(() => {
                    ai.playTurn();
                    fetchGameState();
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Error ending turn:', error);
            showError('Failed to end turn. Please try again.');
        });
}

function fetchGameState() {
    console.log('Fetching game state');
    const timeoutDuration = 10000; // 10 seconds timeout
    
    const fetchPromise = fetch('/api/game_state')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch game state');
            }
            return response.json();
        });
    
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch game state timeout')), timeoutDuration)
    );
    
    Promise.race([fetchPromise, timeoutPromise])
        .then(newState => {
            console.log('New game state received:', newState);
            gameState = newState;
            updateGameBoard();
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Error fetching game state:', error);
            showError('Failed to update game state. Please refresh the page.');
            hideLoadingIndicator();
        });
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const gameBoard = document.querySelector('.game-board');
    
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    if (gameBoard) {
        gameBoard.style.display = 'flex';
    }
}

// Event listeners
window.onload = function() {
    console.log('Window loaded, initializing game...');
    const drawButton = document.getElementById('draw-button');
    const endTurnButton = document.getElementById('end-turn-button');
    
    if (drawButton && endTurnButton) {
        drawButton.addEventListener('click', drawCard);
        endTurnButton.addEventListener('click', endTurn);
        console.log('Event listeners attached to buttons');
    } else {
        console.error('Failed to find draw or end turn buttons');
    }

    // Fetch initial game state
    fetchGameState();
};

// Socket event handlers
socket.on('update_game_state', (newState) => {
    console.log('Received updated game state:', newState);
    gameState = newState;
    updateGameBoard();
});

// Error handling for socket connection
socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    showError('Connection error. Please refresh the page.');
});

socket.on('connect_timeout', (timeout) => {
    console.error('Socket connection timeout:', timeout);
    showError('Connection timeout. Please refresh the page.');
});
