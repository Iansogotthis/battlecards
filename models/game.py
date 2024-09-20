import random
from models.card import Card
import logging

logger = logging.getLogger(__name__)

class Game:
    def __init__(self):
        self.reset_game()

    def reset_game(self):
        self.player_hand = []
        self.player_field = []
        self.opponent_hand = []
        self.opponent_field = []
        self.player_deck = self.create_deck()
        self.opponent_deck = self.create_deck()
        self.current_turn = 'player'
        logger.info("Game reset. Starting with player's turn.")

    def create_deck(self):
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
        logger.info(f"{player} is drawing a card")
        if player == 'player':
            if self.player_deck:
                card = self.player_deck.pop()
                self.player_hand.append(card)
                self.remove_duplicates(self.player_hand)
                logger.info(f"Player drew card: {card.to_dict()}")
                logger.debug(f"Player hand after drawing: {[c.to_dict() for c in self.player_hand]}")
                return card.to_dict()
        elif player == 'opponent':
            if self.opponent_deck:
                card = self.opponent_deck.pop()
                self.opponent_hand.append(card)
                self.remove_duplicates(self.opponent_hand)
                logger.info(f"Opponent drew card: {card.to_dict()}")
                logger.debug(f"Opponent hand after drawing: {[c.to_dict() for c in self.opponent_hand]}")
                return card.to_dict()
        logger.warning(f"No cards left in the {player}'s deck")
        return None

    def remove_duplicates(self, hand):
        seen = set()
        hand[:] = [card for card in hand if card.id not in seen and not seen.add(card.id)]

    def play_card(self, card_id, player):
        logger.info(f"{player} is playing card with id: {card_id}")
        if player == 'player':
            card = next((card for card in self.player_hand if card.id == card_id), None)
            if card:
                self.player_hand = [c for c in self.player_hand if c.id != card_id]
                self.player_field.append(card)
                logger.info(f"Player played card: {card.to_dict()}")
                logger.debug(f"Player field after playing: {[c.to_dict() for c in self.player_field]}")
                return True
        elif player == 'opponent':
            card = next((card for card in self.opponent_hand if card.id == card_id), None)
            if card:
                self.opponent_hand = [c for c in self.opponent_hand if c.id != card_id]
                self.opponent_field.append(card)
                logger.info(f"Opponent played card: {card.to_dict()}")
                logger.debug(f"Opponent field after playing: {[c.to_dict() for c in self.opponent_field]}")
                return True
        logger.warning(f"Failed to play card with id {card_id} for {player}")
        return False

    def end_turn(self):
        logger.info(f"Ending turn for {self.current_turn}")
        self.current_turn = 'opponent' if self.current_turn == 'player' else 'player'
        logger.info(f"New turn: {self.current_turn}")
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
