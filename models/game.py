import random
from models.card import Card
import logging

logger = logging.getLogger(__name__)

class Game:
    def __init__(self):
        self.reset_game()

    def reset_game(self):
        self.players = []
        self.player_hands = {}
        self.player_fields = {}
        self.player_decks = {}
        self.player_discard_piles = {}
        self.player_health = {}
        self.current_turn = None
        self.round_number = 1
        self.game_over = False
        logger.info("Game reset.")

    def add_player(self, player_id):
        if len(self.players) < 2:
            self.players.append(player_id)
            self.player_hands[player_id] = []
            self.player_fields[player_id] = []
            self.player_decks[player_id] = self.create_deck()
            self.player_discard_piles[player_id] = []
            self.player_health[player_id] = 30
            if len(self.players) == 1:
                self.current_turn = player_id
            logger.info(f"Player {player_id} added to the game.")
            return True
        return False

    def create_deck(self):
        deck = []
        effects = ['heal', 'damage_boost', 'defense_boost', 'pierce']
        for i in range(30):
            card = Card(
                id=i,
                name=f"Card {i}",
                attack=random.randint(1, 10),
                defense=random.randint(1, 10),
                type=random.choice(['Fire', 'Water', 'Earth', 'Air']),
                effect=random.choice(effects)
            )
            deck.append(card)
        random.shuffle(deck)
        return deck

    def draw_card(self, player_id):
        if player_id in self.players and self.player_decks[player_id]:
            card = self.player_decks[player_id].pop()
            self.player_hands[player_id].append(card)
            logger.info(f"Player {player_id} drew card: {card.to_dict()}")
            return card
        logger.warning(f"No cards left in the {player_id}'s deck")
        return None

    def play_card(self, player_id, card_id):
        if player_id in self.players and player_id == self.current_turn:
            hand = self.player_hands[player_id]
            field = self.player_fields[player_id]
            card = next((card for card in hand if card.id == card_id), None)
            if card:
                hand.remove(card)
                field.append(card)
                logger.info(f"Player {player_id} played card: {card.to_dict()}")
                self.apply_card_effect(player_id, card)
                self.discard_card(player_id, card)
                return True
            logger.warning(f"Card with id {card_id} not found in player {player_id}'s hand")
        return False

    def apply_card_effect(self, player_id, card):
        opponent_id = self.get_opponent(player_id)
        if card.effect == 'heal':
            self.player_health[player_id] = min(30, self.player_health[player_id] + 2)
        elif card.effect == 'damage_boost':
            damage = card.attack + 2
            self.player_health[opponent_id] = max(0, self.player_health[opponent_id] - damage)
        elif card.effect == 'defense_boost':
            for field_card in self.player_fields[player_id]:
                field_card.defense += 1
        elif card.effect == 'pierce':
            damage = max(1, card.attack - 2)
            self.player_health[opponent_id] = max(0, self.player_health[opponent_id] - damage)
        
        if self.player_health[opponent_id] <= 0:
            self.game_over = True
        logger.info(f"Applied card effect: {card.effect} for player {player_id}")

    def discard_card(self, player_id, card):
        self.player_discard_piles[player_id].append(card)
        logger.info(f"Card discarded to player {player_id}'s pile: {card.to_dict()}")

    def end_turn(self, player_id):
        if player_id == self.current_turn:
            self.current_turn = self.get_opponent(player_id)
            self.round_number += 1
            logger.info(f"Turn ended. New turn: {self.current_turn}, Round: {self.round_number}")

    def get_opponent(self, player_id):
        return next(player for player in self.players if player != player_id)

    def get_game_state(self):
        return {
            'players': self.players,
            'playerHands': {player: [card.to_dict() for card in hand] for player, hand in self.player_hands.items()},
            'playerFields': {player: [card.to_dict() for card in field] for player, field in self.player_fields.items()},
            'currentTurn': self.current_turn,
            'playerDeckCounts': {player: len(deck) for player, deck in self.player_decks.items()},
            'playerDiscardPileCounts': {player: len(pile) for player, pile in self.player_discard_piles.items()},
            'playerHealth': self.player_health,
            'gameOver': self.game_over,
            'roundNumber': self.round_number,
        }

    def clear_fields(self):
        for player in self.players:
            self.player_fields[player].clear()
        logger.info("Fields cleared")
