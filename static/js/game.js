const socket = io();

let gameState = {
    players: [],
    playerHands: {},
    playerFields: {},
    currentTurn: null,
    playerDeckCounts: {},
    playerDiscardPileCounts: {},
    playerHealth: {},
    gameOver: false,
    roundNumber: 1
};

let playerId = null;
let gameId = null;
let selectedCard = null;

function createGame() {
    socket.emit('create_game');
}

function joinGame(gameIdToJoin) {
    socket.emit('join_game', { game_id: gameIdToJoin });
}

function updateGameBoard() {
    console.log('Updating game board with state:', gameState);
    updateHand();
    updateFields();
    updateDeckCounts();
    updateDiscardPile();
    updateTurnIndicator();
    updateHealth();
    updateRoundIndicator();
    checkGameOver();
}

function updateHand() {
    const handElement = document.getElementById('player-hand');
    handElement.innerHTML = '';
    if (Array.isArray(gameState.playerHands[playerId])) {
        gameState.playerHands[playerId].forEach(card => {
            const cardElement = createCardElement(card);
            cardElement.onclick = (event) => selectCard(event, card.id);
            handElement.appendChild(cardElement);
        });
    }
}

function updateFields() {
    const playerFieldElement = document.getElementById('player-field');
    const opponentFieldElement = document.getElementById('opponent-field');
    playerFieldElement.innerHTML = '';
    opponentFieldElement.innerHTML = '';

    const opponentId = gameState.players.find(id => id !== playerId);

    if (Array.isArray(gameState.playerFields[playerId])) {
        gameState.playerFields[playerId].forEach(card => {
            playerFieldElement.appendChild(createCardElement(card));
        });
    }

    if (Array.isArray(gameState.playerFields[opponentId])) {
        gameState.playerFields[opponentId].forEach(card => {
            opponentFieldElement.appendChild(createCardElement(card));
        });
    }
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.setAttribute('data-card-id', card.id);
    cardElement.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-stats">
            <span>ATK: ${card.attack}</span>
            <span>DEF: ${card.defense}</span>
        </div>
        <div class="card-type">${card.type}</div>
        <div class="card-effect">Effect: ${card.effect}</div>
    `;
    return cardElement;
}

function selectCard(event, cardId) {
    event.stopPropagation();
    const clickedCard = event.currentTarget;
    
    if (selectedCard) {
        selectedCard.classList.remove('selected-card');
    }
    
    if (selectedCard === clickedCard) {
        selectedCard = null;
    } else {
        clickedCard.classList.add('selected-card');
        selectedCard = clickedCard;
    }
}

function updateDeckCounts() {
    const playerDeckCount = document.getElementById('player-deck-count');
    const opponentDeckCount = document.getElementById('opponent-deck-count');
    playerDeckCount.textContent = gameState.playerDeckCounts[playerId];
    const opponentId = gameState.players.find(id => id !== playerId);
    opponentDeckCount.textContent = gameState.playerDeckCounts[opponentId];
}

function updateDiscardPile() {
    const playerDiscardPileCount = document.getElementById('player-discard-pile-count');
    const opponentDiscardPileCount = document.getElementById('opponent-discard-pile-count');
    playerDiscardPileCount.textContent = gameState.playerDiscardPileCounts[playerId];
    const opponentId = gameState.players.find(id => id !== playerId);
    opponentDiscardPileCount.textContent = gameState.playerDiscardPileCounts[opponentId];
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turn-indicator');
    turnIndicator.textContent = gameState.currentTurn === playerId ? 'Your Turn' : 'Opponent\'s Turn';
    turnIndicator.style.animation = 'none';
    turnIndicator.offsetHeight; // Trigger reflow
    turnIndicator.style.animation = 'fadeInOut 0.5s ease-in-out';
}

function updateHealth() {
    const playerHealth = document.getElementById('player-health');
    const opponentHealth = document.getElementById('opponent-health');
    playerHealth.textContent = gameState.playerHealth[playerId];
    const opponentId = gameState.players.find(id => id !== playerId);
    opponentHealth.textContent = gameState.playerHealth[opponentId];
}

function updateRoundIndicator() {
    const roundIndicator = document.getElementById('round-indicator');
    roundIndicator.textContent = `Round: ${gameState.roundNumber}`;
}

function checkGameOver() {
    if (gameState.gameOver) {
        const gameOverMessage = document.getElementById('game-over-message');
        const gameOverOverlay = document.getElementById('game-over-overlay');
        const playAgainButton = document.getElementById('play-again-button');
        gameOverMessage.textContent = gameState.playerHealth[playerId] <= 0 ? 'Game Over: You Lose!' : 'Game Over: You Win!';
        gameOverOverlay.style.display = 'flex';
        playAgainButton.style.display = 'block';
        disableGameControls();
    }
}

function disableGameControls() {
    document.getElementById('draw-button').disabled = true;
    document.getElementById('play-button').disabled = true;
    document.getElementById('end-turn-button').disabled = true;
}

function drawCard() {
    if (gameState.currentTurn !== playerId) {
        showError("It's not your turn!");
        return;
    }
    
    socket.emit('draw_card', { game_id: gameId, player_id: playerId });
}

function playCard() {
    if (gameState.currentTurn !== playerId) {
        showError("It's not your turn!");
        return;
    }
    
    if (!selectedCard) {
        showError("Please select a card to play");
        return;
    }
    
    const cardId = parseInt(selectedCard.getAttribute('data-card-id'));
    socket.emit('play_card', { game_id: gameId, player_id: playerId, card_id: cardId });
}

function endTurn() {
    if (gameState.currentTurn !== playerId) {
        showError("It's not your turn!");
        return;
    }
    
    socket.emit('end_turn', { game_id: gameId, player_id: playerId });
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

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('game_created', (data) => {
    gameId = data.game_id;
    console.log('Game created with ID:', gameId);
    // Display the game ID for the second player to join
    document.getElementById('game-id-display').textContent = `Game ID: ${gameId}`;
});

socket.on('game_joined', (data) => {
    playerId = data.player_id;
    gameState = data.game_state;
    console.log('Joined game. Player ID:', playerId);
    updateGameBoard();
});

socket.on('game_start', (data) => {
    gameState = data.game_state;
    console.log('Game started');
    updateGameBoard();
});

socket.on('card_drawn', (data) => {
    gameState = data.game_state;
    updateGameBoard();
});

socket.on('card_played', (data) => {
    gameState = data.game_state;
    updateGameBoard();
});

socket.on('turn_ended', (data) => {
    gameState = data.game_state;
    updateGameBoard();
});

socket.on('error', (data) => {
    showError(data.message);
});

window.onload = function() {
    const createGameButton = document.getElementById('create-game-button');
    const joinGameButton = document.getElementById('join-game-button');
    const gameIdInput = document.getElementById('game-id-input');
    const drawButton = document.getElementById('draw-button');
    const playButton = document.getElementById('play-button');
    const endTurnButton = document.getElementById('end-turn-button');
    
    createGameButton.addEventListener('click', createGame);
    joinGameButton.addEventListener('click', () => joinGame(gameIdInput.value));
    drawButton.addEventListener('click', drawCard);
    playButton.addEventListener('click', playCard);
    endTurnButton.addEventListener('click', endTurn);
};
