const socket = io();

let gameState = {
    playerHand: [],
    playerField: [],
    opponentField: [],
    currentTurn: 'player',
    playerDeckCount: 30,
    opponentDeckCount: 30,
    playerDiscardPileCount: 0,
    opponentDiscardPileCount: 0,
    playerHealth: 30,
    opponentHealth: 30,
    gameOver: false,
    roundNumber: 1
};

const ai = new AI(gameState);

let selectedCard = null;

function clearFieldsWithDelay() {
    setTimeout(() => {
        fetch('/api/clear_fields')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    gameState = data.new_state;
                    updateGameBoard();
                }
            })
            .catch(error => {
                console.error('Error clearing fields:', error);
                showError('Failed to clear fields. Please try again.');
            });
    }, 2000);
}

function updateGameBoard() {
    console.log('Updating game board with state:', gameState);
    updateHand();
    updateField('player-field', gameState.playerField);
    updateField('opponent-field', gameState.opponentField);
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
    if (Array.isArray(gameState.playerHand)) {
        gameState.playerHand = gameState.playerHand.filter((card, index, self) =>
            index === self.findIndex((t) => t.id === card.id)
        );
        gameState.playerHand.forEach(card => {
            const cardElement = createCardElement(card);
            cardElement.onclick = (event) => selectCard(event, card.id);
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
    playerDeckCount.textContent = gameState.playerDeckCount;
    opponentDeckCount.textContent = gameState.opponentDeckCount;
}

function updateDiscardPile() {
    const playerDiscardPileCount = document.getElementById('player-discard-pile-count');
    const opponentDiscardPileCount = document.getElementById('opponent-discard-pile-count');
    playerDiscardPileCount.textContent = gameState.playerDiscardPileCount;
    opponentDiscardPileCount.textContent = gameState.opponentDiscardPileCount;
}

function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turn-indicator');
    turnIndicator.textContent = gameState.currentTurn === 'player' ? 'Your Turn' : 'Opponent\'s Turn';
    console.log('Turn indicator updated:', turnIndicator.textContent);
    
    // Add animation for turn transition
    turnIndicator.style.animation = 'none';
    turnIndicator.offsetHeight; // Trigger reflow
    turnIndicator.style.animation = 'fadeInOut 0.5s ease-in-out';
}

function updateHealth() {
    const playerHealth = document.getElementById('player-health');
    const opponentHealth = document.getElementById('opponent-health');
    animateValue(playerHealth, parseInt(playerHealth.textContent), gameState.playerHealth, 500);
    animateValue(opponentHealth, parseInt(opponentHealth.textContent), gameState.opponentHealth, 500);
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
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
        gameOverMessage.textContent = gameState.playerHealth <= 0 ? 'Game Over: You Lose!' : 'Game Over: You Win!';
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
    
    console.log('Sending POST request to /api/draw_card');
    fetch('/api/draw_card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player: 'player' }),
    })
        .then(response => {
            console.log('Received response:', response);
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
            if (!gameState.playerHand.some(c => c.id === card.id)) {
                gameState.playerHand.push(card);
                gameState.playerDeckCount--;
                updateGameBoard();
                
                // Add animation for card draw
                const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                if (cardElement) {
                    cardElement.classList.add('card-drawn');
                    setTimeout(() => {
                        cardElement.classList.remove('card-drawn');
                    }, 500);
                }
            } else {
                console.warn('Duplicate card detected, not adding to hand:', card);
            }
        })
        .catch(error => {
            console.error('Error drawing card:', error);
            showError('Failed to draw card. Please try again.');
        });
}

function playCard() {
    console.log('Attempting to play card');
    if (gameState.currentTurn !== 'player') {
        showError("It's not your turn!");
        return;
    }
    
    if (!selectedCard) {
        showError("Please select a card to play");
        return;
    }
    
    const cardId = parseInt(selectedCard.getAttribute('data-card-id'));
    console.log('Selected card ID:', cardId);
    
    fetch('/api/play_card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card_id: cardId, player: 'player' }),
    })
        .then(response => {
            console.log('Play card response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to play card');
            }
            return response.json();
        })
        .then(data => {
            console.log('Play card response data:', data);
            if (data.success) {
                console.log('Card played successfully. Updating game state.');
                const cardIndex = gameState.playerHand.findIndex(card => card.id === cardId);
                if (cardIndex !== -1) {
                    const playedCard = gameState.playerHand.splice(cardIndex, 1)[0];
                    if (!Array.isArray(gameState.playerField)) {
                        gameState.playerField = [];
                    }
                    gameState.playerField.push(playedCard);
                    selectedCard.classList.remove('selected-card');
                    selectedCard = null;
                    
                    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
                    if (cardElement) {
                        cardElement.classList.add('card-played');
                        setTimeout(() => {
                            cardElement.classList.remove('card-played');
                        }, 500);
                    }
                    updateGameBoard();
                } else {
                    console.error('Card not found in player hand:', cardId);
                }
            } else {
                console.error('Failed to play card:', data.error);
                showError(data.error || 'Failed to play card. Please try again.');
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
        .then(response => response.json())
        .then(data => {
            console.log('Turn ended successfully:', data);
            if (data.success) {
                gameState = data.new_state;
                updateGameBoard();
                console.log('Turn changed to opponent, triggering AI turn');
                setTimeout(() => {
                    ai.playTurn();
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Error ending turn:', error);
            showError('Failed to end turn. Please try again.');
        });
}

function resetGame() {
    console.log('Resetting game');
    fetch('/api/reset_game')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to reset game');
            }
            return response.json();
        })
        .then(data => {
            console.log('Game reset successfully:', data);
            if (data.success) {
                gameState = data.new_state;
                selectedCard = null;
                updateGameBoard();
                document.getElementById('game-over-overlay').style.display = 'none';
                document.getElementById('draw-button').disabled = false;
                document.getElementById('play-button').disabled = false;
                document.getElementById('end-turn-button').disabled = false;
            }
        })
        .catch(error => {
            console.error('Error resetting game:', error);
            showError('Failed to reset game. Please try again.');
        });
}

function fetchGameState() {
    console.log('Fetching game state');
    fetch('/api/game_state')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch game state');
            }
            return response.json();
        })
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

window.onload = function() {
    console.log('Window loaded, initializing game...');
    const drawButton = document.getElementById('draw-button');
    const playButton = document.getElementById('play-button');
    const endTurnButton = document.getElementById('end-turn-button');
    const resetButton = document.getElementById('reset-button');
    const playAgainButton = document.getElementById('play-again-button');
    
    if (drawButton && playButton && endTurnButton && resetButton && playAgainButton) {
        drawButton.addEventListener('click', drawCard);
        playButton.addEventListener('click', playCard);
        endTurnButton.addEventListener('click', endTurn);
        resetButton.addEventListener('click', resetGame);
        playAgainButton.addEventListener('click', resetGame);
        console.log('Event listeners attached to buttons');
    } else {
        console.error('Failed to find game buttons');
    }

    fetchGameState();
};

socket.on('update_game_state', (newState) => {
    console.log('Received updated game state:', newState);
    gameState = newState;
    updateGameBoard();
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    showError('Connection error. Please refresh the page.');
});

socket.on('connect_timeout', (timeout) => {
    console.error('Socket connection timeout:', timeout);
    showError('Connection timeout. Please refresh the page.');
});

socket.on('clear_fields_countdown', () => {
    console.log('Starting countdown to clear fields');
    setTimeout(() => {
        fetch('/api/clear_fields')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    gameState = data.new_state;
                    updateGameBoard();
                }
            })
            .catch(error => {
                console.error('Error clearing fields:', error);
                showError('Failed to clear fields. Please try again.');
            });
    }, 2000);
});
