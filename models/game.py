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
        self.discard_pile = []  # Initialize the discard pile
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
            hand = self.player_hand
            field = self.player_field
        elif player == 'opponent':
            hand = self.opponent_hand
            field = self.opponent_field
        else:
            logger.error(f"Invalid player: {player}")
            return False

        card = next((card for card in hand if card.id == card_id), None)
        if card:
            logger.info(f"Found card in {player}'s hand: {card.to_dict()}")
            hand.remove(card)
            field.append(card)
            logger.info(f"{player.capitalize()} played card: {card.to_dict()}")
            logger.debug(f"{player.capitalize()} field after playing: {[c.to_dict() for c in field]}")
            return True
        else:
            logger.warning(f"Card with id {card_id} not found in {player}'s hand")
            logger.debug(f"{player.capitalize()} hand: {[c.to_dict() for c in hand]}")
            return False

    def discard_card(self, card):
        self.discard_pile.append(card)
        logger.info(f"Card discarded: {card.to_dict()}")
        logger.debug(f"Discard pile size: {len(self.discard_pile)}")

    def clear_fields(self):
        for card in self.player_field + self.opponent_field:
            self.discard_card(card)
        self.player_field.clear()
        self.opponent_field.clear()

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
            'discardPileCount': len(self.discard_pile),
        }
