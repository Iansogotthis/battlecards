import random
from models.card import Card

class Game:
    def __init__(self):
        self.player_hand = []
        self.player_field = []
        self.opponent_hand = []
        self.opponent_field = []
        self.player_deck = self.create_deck()
        self.opponent_deck = self.create_deck()
        self.current_turn = 'player'

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
        if player == 'player':
            if len(self.player_deck) > 0:
                card = self.player_deck.pop()
                self.player_hand.append(card)
                return card
        elif player == 'opponent':
            if len(self.opponent_deck) > 0:
                card = self.opponent_deck.pop()
                self.opponent_hand.append(card)
                return card
        return None

    def play_card(self, card_id, player):
        """Play a card from the player's or opponent's hand to their field"""
        if player == 'player':
            card = next((card for card in self.player_hand if card.id == card_id), None)
            if card:
                self.player_hand.remove(card)
                self.player_field.append(card)
                return True
        elif player == 'opponent':
            card = next((card for card in self.opponent_hand if card.id == card_id), None)
            if card:
                self.opponent_hand.remove(card)
                self.opponent_field.append(card)
                return True
        return False

    def end_turn(self):
        """End the current turn and switch to the other player"""
        self.current_turn = 'opponent' if self.current_turn == 'player' else 'player'
        # Draw a card for the player whose turn is starting
        self.draw_card(self.current_turn)

    def get_game_state(self):
        return {
            'player_hand': [card.to_dict() for card in self.player_hand],
            'player_field': [card.to_dict() for card in self.player_field],
            'opponent_field': [card.to_dict() for card in self.opponent_field],
            'current_turn': self.current_turn,
            'player_deck_count': len(self.player_deck),
            'opponent_deck_count': len(self.opponent_deck),
        }
