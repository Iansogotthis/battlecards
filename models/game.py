import random
from models.card import Card

class Game:
    def __init__(self):
        self.player_hand = []
        self.player_field = []
        self.opponent_hand = []
        self.opponent_field = []
        self.deck = self.create_deck()

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

    def draw_card(self):
        if len(self.deck) > 0:
            return self.deck.pop()
        return None

    def play_card(self, card_id):
        card = next((card for card in self.player_hand if card.id == card_id), None)
        if card:
            self.player_hand.remove(card)
            self.player_field.append(card)
            return True
        return False

    def end_turn(self):
        # Implement turn-ending logic here
        pass

    def get_game_state(self):
        return {
            'player_hand': [card.to_dict() for card in self.player_hand],
            'player_field': [card.to_dict() for card in self.player_field],
            'opponent_field': [card.to_dict() for card in self.opponent_field],
        }
