class AI {
    constructor(game) {
        this.game = game;
    }

    playTurn() {
        // Draw a card
        this.game.drawCard('opponent');

        // Play the best card possible
        const playableCard = this.chooseBestCard();
        if (playableCard) {
            this.game.playCard(playableCard.id, 'opponent');
        }

        // End the turn
        this.game.endTurn();
    }

    chooseBestCard() {
        if (this.game.opponent_hand.length === 0) {
            return null;
        }

        // Simple strategy: Play the card with the highest attack value
        return this.game.opponent_hand.reduce((bestCard, currentCard) => 
            currentCard.attack > bestCard.attack ? currentCard : bestCard
        );
    }
}

// Export the AI class if using modules
// export default AI;
