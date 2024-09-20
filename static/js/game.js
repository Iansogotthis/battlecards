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
    gameState.playerHand.forEach(card => {
        const cardElement = createCardElement(card);
        cardElement.onclick = () => playCard(card.id);
        handElement.appendChild(cardElement);
    });
}

function updateField(fieldId, fieldCards) {
    const fieldElement = document.getElementById(fieldId);
    fieldElement.innerHTML = '';
    fieldCards.forEach(card => {
        const cardElement = createCardElement(card);
        fieldElement.appendChild(cardElement);
    });
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
    document.getElementById('player-deck-count').textContent = gameState.playerDeckCount;
    document.getElementById('opponent-deck-count').textContent = gameState.opponentDeckCount;
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turn-indicator');
    turnIndicator.textContent = gameState.currentTurn === 'player' ? 'Your Turn' : 'Opponent\'s Turn';
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    setTimeout(() => {
        errorElement.textContent = '';
    }, 3000);
}

function drawCard() {
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
            if (data.success) {
                const cardIndex = gameState.playerHand.findIndex(card => card.id === cardId);
                const playedCard = gameState.playerHand.splice(cardIndex, 1)[0];
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
            if (data.success) {
                gameState.currentTurn = 'opponent';
                updateGameBoard();
                setTimeout(() => {
                    ai.playTurn();
                    fetch('/api/game_state')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to fetch game state');
                            }
                            return response.json();
                        })
                        .then(newState => {
                            gameState = newState;
                            updateGameBoard();
                        })
                        .catch(error => {
                            console.error('Error fetching game state:', error);
                            showError('Failed to update game state. Please refresh the page.');
                        });
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Error ending turn:', error);
            showError('Failed to end turn. Please try again.');
        });
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
    fetch('/api/game_state')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch initial game state');
            }
            return response.json();
        })
        .then(initialState => {
            gameState = initialState;
            console.log('Initial game state:', gameState);
            updateGameBoard();
        })
        .catch(error => {
            console.error('Error fetching initial game state:', error);
            showError('Failed to initialize game. Please refresh the page.');
        });
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
