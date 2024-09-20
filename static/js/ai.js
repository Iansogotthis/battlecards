class AI {
    constructor(game) {
        this.game = game;
    }

    playTurn() {
        console.log('AI is playing its turn');
        // Draw a card
        this.drawCard();

        // Play the best card possible
        this.playBestCard();

        // End the turn
        this.endTurn();
    }

    drawCard() {
        console.log('AI is attempting to draw a card');
        fetch('/api/draw_card')
            .then(response => response.json())
            .then(card => {
                console.log('AI drew card:', card);
                if (!this.game.opponentHand) {
                    this.game.opponentHand = [];
                }
                this.game.opponentHand.push(card);
                this.game.opponentDeckCount--;
            })
            .catch(error => console.error('Error in AI drawing card:', error));
    }

    playBestCard() {
        console.log('AI is choosing the best card to play');
        if (this.game.opponentHand && this.game.opponentHand.length > 0) {
            // Simple strategy: Play the card with the highest attack value
            const bestCard = this.game.opponentHand.reduce((best, current) => 
                current.attack > best.attack ? current : best
            );

            console.log('AI is playing card:', bestCard);
            fetch('/api/play_card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ card_id: bestCard.id }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const cardIndex = this.game.opponentHand.findIndex(card => card.id === bestCard.id);
                        this.game.opponentHand.splice(cardIndex, 1);
                        if (!this.game.opponentField) {
                            this.game.opponentField = [];
                        }
                        this.game.opponentField.push(bestCard);
                    }
                })
                .catch(error => console.error('Error in AI playing card:', error));
        } else {
            console.log('AI has no cards to play');
        }
    }

    endTurn() {
        console.log('AI is ending its turn');
        fetch('/api/end_turn')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('AI turn ended successfully');
                    this.game.currentTurn = 'player';
                    // Trigger an update of the game state after AI's turn
                    this.updateGameState();
                }
            })
            .catch(error => console.error('Error in AI ending turn:', error));
    }

    updateGameState() {
        fetch('/api/game_state')
            .then(response => response.json())
            .then(newState => {
                console.log('New game state after AI turn:', newState);
                Object.assign(this.game, newState);
                // Emit a custom event to notify that the game state has been updated
                const event = new CustomEvent('aiTurnEnded', { detail: newState });
                document.dispatchEvent(event);
            })
            .catch(error => console.error('Error updating game state after AI turn:', error));
    }
}

// Export the AI class if using modules
// export default AI;
