class AI {
    constructor(gameState) {
        this.gameState = gameState;
    }

    playTurn() {
        console.log('AI is playing its turn');
        this.drawCard()
            .then(() => this.playBestCard())
            .then(() => this.endTurn())
            .catch(error => console.error('Error during AI turn:', error));
    }

    drawCard() {
        console.log('AI is attempting to draw a card');
        return fetch('/api/draw_card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player: 'opponent' }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to draw card');
                }
                return response.json();
            })
            .then(card => {
                console.log('AI drew card:', card);
                if (!this.gameState.opponentHand) {
                    this.gameState.opponentHand = [];
                }
                this.gameState.opponentHand.push(card);
                this.gameState.opponentDeckCount--;
            })
            .catch(error => console.error('Error in AI drawing card:', error));
    }

    playBestCard() {
        console.log('AI is choosing the best card to play');
        if (this.gameState.opponentHand && this.gameState.opponentHand.length > 0) {
            const bestCard = this.gameState.opponentHand.reduce((best, current) => 
                current.attack > best.attack ? current : best
            );

            console.log('AI is playing card:', bestCard);
            return fetch('/api/play_card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ card_id: bestCard.id, player: 'opponent' }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to play card');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        const cardIndex = this.gameState.opponentHand.findIndex(card => card.id === bestCard.id);
                        this.gameState.opponentHand.splice(cardIndex, 1);
                        if (!this.gameState.opponentField) {
                            this.gameState.opponentField = [];
                        }
                        this.gameState.opponentField.push(bestCard);
                    }
                })
                .catch(error => console.error('Error in AI playing card:', error));
        } else {
            console.log('AI has no cards to play');
            return Promise.resolve();
        }
    }

    endTurn() {
        console.log('AI is ending its turn');
        return fetch('/api/end_turn')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to end turn');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log('AI turn ended successfully');
                    this.gameState.currentTurn = 'player';
                    // Trigger an update of the game state after AI's turn
                    return this.updateGameState();
                }
            })
            .catch(error => console.error('Error in AI ending turn:', error));
    }

    updateGameState() {
        return fetch('/api/game_state')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch game state');
                }
                return response.json();
            })
            .then(newState => {
                console.log('New game state after AI turn:', newState);
                Object.assign(this.gameState, newState);
                // Emit a custom event to notify that the game state has been updated
                const event = new CustomEvent('aiTurnEnded', { detail: newState });
                document.dispatchEvent(event);
            })
            .catch(error => console.error('Error updating game state after AI turn:', error));
    }
}

// Export the AI class if using modules
// export default AI;
