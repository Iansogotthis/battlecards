import random
from models.card import Card
import logging

logger = logging.getLogger(__name__)

class Game:
    def __init__(self):
        self.player_hand = []
        self.player_field = []
        self.opponent_hand = []
        self.opponent_field = []
        self.player_deck = self.create_deck()
        self.opponent_deck = self.create_deck()
        self.current_turn = 'player'  # Ensure the game starts with the player's turn
        logger.info("Game initialized. Starting with player's turn.")

    def create_deck(self):
        # Create a sample deck of 30 cards
        deck = []
        for i in range(30):
            card = Card(
                id=i,
                name=f"Card {i}",
                attack=random.randint(1, 10),
                defense=random.randint(1, 10),
                type=random.choice(['Fire', 'Water', 'Earth', 'Air'])
            )
            deck.append(card)
        random.shuffle(deck)
        return deck

    def draw_card(self, player):
        """Draw a card from the player's or opponent's deck"""
        logger.info(f"{player} is drawing a card")
        if player == 'player':
            if self.player_deck:
                card = self.player_deck.pop()
                self.player_hand.append(card)
                logger.info(f"Player drew card: {card.to_dict()}")
                logger.debug(f"Player hand after drawing: {[c.to_dict() for c in self.player_hand]}")
                return card
        elif player == 'opponent':
            if self.opponent_deck:
                card = self.opponent_deck.pop()
                self.opponent_hand.append(card)
                logger.info(f"Opponent drew card: {card.to_dict()}")
                logger.debug(f"Opponent hand after drawing: {[c.to_dict() for c in self.opponent_hand]}")
                return card
        logger.warning(f"No cards left in the {player}'s deck")
        return None

    def play_card(self, card_id, player):
        """Play a card from the player's or opponent's hand to their field"""
        logger.info(f"{player} is playing card with id: {card_id}")
        if player == 'player':
            card = next((card for card in self.player_hand if card.id == card_id), None)
            if card:
                self.player_hand.remove(card)
                self.player_field.append(card)
                logger.info(f"Player played card: {card.to_dict()}")
                logger.debug(f"Player field after playing: {[c.to_dict() for c in self.player_field]}")
                return True
        elif player == 'opponent':
            card = next((card for card in self.opponent_hand if card.id == card_id), None)
            if card:
                self.opponent_hand.remove(card)
                self.opponent_field.append(card)
                logger.info(f"Opponent played card: {card.to_dict()}")
                logger.debug(f"Opponent field after playing: {[c.to_dict() for c in self.opponent_field]}")
                return True
        logger.warning(f"Failed to play card with id {card_id} for {player}")
        return False

    def end_turn(self):
        """End the current turn and switch to the other player"""
        logger.info(f"Ending turn for {self.current_turn}")
        self.current_turn = 'opponent' if self.current_turn == 'player' else 'player'
        logger.info(f"New turn: {self.current_turn}")
        # Draw a card for the player whose turn is starting
        self.draw_card(self.current_turn)
        logger.debug(f"Game state after turn change: {self.get_game_state()}")

    def get_game_state(self):
        return {
            'playerHand': [card.to_dict() for card in self.player_hand],
            'playerField': [card.to_dict() for card in self.player_field],
            'opponentField': [card.to_dict() for card in self.opponent_field],
            'currentTurn': self.current_turn,
            'playerDeckCount': len(self.player_deck),
            'opponentDeckCount': len(self.opponent_deck),
        }
