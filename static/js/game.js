const socket = io();

let playerHand = [];
let playerField = [];
let opponentField = [];

function updateGameBoard() {
    updateHand();
    updateField('player-field', playerField);
    updateField('opponent-field', opponentField);
}

function updateHand() {
    const handElement = document.getElementById('player-hand');
    handElement.innerHTML = '';
    playerHand.forEach(card => {
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
    `;
    return cardElement;
}

function drawCard() {
    fetch('/api/draw_card')
        .then(response => response.json())
        .then(card => {
            playerHand.push(card);
            updateGameBoard();
        });
}

function playCard(cardId) {
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
                const cardIndex = playerHand.findIndex(card => card.id === cardId);
                const playedCard = playerHand.splice(cardIndex, 1)[0];
                playerField.push(playedCard);
                updateGameBoard();
            }
        });
}

function endTurn() {
    fetch('/api/end_turn')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Implement AI turn logic here
                console.log('Turn ended');
            }
        });
}

// Event listeners
document.getElementById('draw-button').addEventListener('click', drawCard);
document.getElementById('end-turn-button').addEventListener('click', endTurn);

// Initialize game board
updateGameBoard();

// Socket event handlers
socket.on('update_game_state', (data) => {
    playerHand = data.player_hand;
    playerField = data.player_field;
    opponentField = data.opponent_field;
    updateGameBoard();
});
