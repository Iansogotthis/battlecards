class AI {
    constructor() {
        this.hand = [];
        this.field = [];
    }

    drawCard(card) {
        this.hand.push(card);
    }

    playTurn() {
        // Simple AI logic: play the strongest card in hand
        if (this.hand.length > 0) {
            const strongestCard = this.hand.reduce((prev, current) => 
                (prev.attack > current.attack) ? prev : current
            );
            const cardIndex = this.hand.findIndex(card => card.id === strongestCard.id);
            const playedCard = this.hand.splice(cardIndex, 1)[0];
            this.field.push(playedCard);
            return playedCard;
        }
        return null;
    }
}

// Export the AI class if using modules
// export default AI;
