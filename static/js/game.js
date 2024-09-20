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

function drawCard() {
    if (gameState.currentTurn !== 'player') return;
    
    fetch('/api/draw_card')
        .then(response => response.json())
        .then(card => {
            gameState.playerHand.push(card);
            gameState.playerDeckCount--;
            updateGameBoard();
        })
        .catch(error => console.error('Error drawing card:', error));
}

function playCard(cardId) {
    if (gameState.currentTurn !== 'player') return;
    
    fetch('/api/play_card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card_id: cardId }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const cardIndex = gameState.playerHand.findIndex(card => card.id === cardId);
                const playedCard = gameState.playerHand.splice(cardIndex, 1)[0];
                gameState.playerField.push(playedCard);
                updateGameBoard();
            }
        })
        .catch(error => console.error('Error playing card:', error));
}

function endTurn() {
    if (gameState.currentTurn !== 'player') return;
    
    fetch('/api/end_turn')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                gameState.currentTurn = 'opponent';
                updateGameBoard();
                setTimeout(() => {
                    ai.playTurn();
                    fetch('/api/game_state')
                        .then(response => response.json())
                        .then(newState => {
                            gameState = newState;
                            updateGameBoard();
                        })
                        .catch(error => console.error('Error fetching game state:', error));
                }, 1000);
            }
        })
        .catch(error => console.error('Error ending turn:', error));
}

// Event listeners
document.getElementById('draw-button').addEventListener('click', drawCard);
document.getElementById('end-turn-button').addEventListener('click', endTurn);

// Initialize game board
updateGameBoard();

// Socket event handlers
socket.on('update_game_state', (newState) => {
    gameState = newState;
    updateGameBoard();
});
