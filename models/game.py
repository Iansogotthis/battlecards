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
        self.discard_pile = []
        self.player_health = 30
        self.opponent_health = 30
        self.round_number = 1
        self.game_over = False
        logger.info("Game reset. Starting with player's turn.")

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
            opponent_field = self.opponent_field
            opponent_health = self.opponent_health
        elif player == 'opponent':
            hand = self.opponent_hand
            field = self.opponent_field
            opponent_field = self.player_field
            opponent_health = self.player_health
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
            
            self.apply_card_effect(card, player)
            
            if self.player_health <= 0 or self.opponent_health <= 0:
                self.game_over = True
                logger.info("Game over condition reached")
            
            return True
        else:
            logger.warning(f"Card with id {card_id} not found in {player}'s hand")
            logger.debug(f"{player.capitalize()} hand: {[c.to_dict() for c in hand]}")
            return False

    def apply_card_effect(self, card, player):
        logger.info(f"Applying card effect: {card.effect} for {player}")
        if player == 'player':
            target_health = self.opponent_health
            player_health = self.player_health
        else:
            target_health = self.player_health
            player_health = self.opponent_health

        if card.effect == 'heal':
            player_health = min(30, player_health + 2)
            logger.info(f"{player.capitalize()} healed. New health: {player_health}")
        elif card.effect == 'damage_boost':
            damage = card.attack + 2
            target_health = max(0, target_health - damage)
            logger.info(f"{player.capitalize()} dealt boosted damage: {damage}. Target health: {target_health}")
        elif card.effect == 'defense_boost':
            for field_card in (self.player_field if player == 'player' else self.opponent_field):
                field_card.defense += 1
            logger.info(f"{player.capitalize()} boosted defense of all field cards")
        elif card.effect == 'pierce':
            damage = max(1, card.attack - 2)
            target_health = max(0, target_health - damage)
            logger.info(f"{player.capitalize()} dealt pierce damage: {damage}. Target health: {target_health}")

        if player == 'player':
            self.opponent_health = target_health
            self.player_health = player_health
        else:
            self.player_health = target_health
            self.opponent_health = player_health

    def end_turn(self):
        logger.info(f"Ending turn for {self.current_turn}")
        self.current_turn = 'opponent' if self.current_turn == 'player' else 'player'
        if self.current_turn == 'player':
            self.round_number += 1
            logger.info(f"New round: {self.round_number}")
        
        if self.game_over:
            logger.info("Game over detected during end turn")
        
        logger.info(f"New turn: {self.current_turn}")
        logger.debug(f"Game state after turn change: {self.get_game_state()}")

    def discard_card(self, card):
        self.discard_pile.append(card)
        logger.info(f"Card discarded: {card.to_dict()}")
        logger.debug(f"Discard pile size: {len(self.discard_pile)}")

    def get_game_state(self):
        return {
            'playerHand': [card.to_dict() for card in self.player_hand],
            'playerField': [card.to_dict() for card in self.player_field],
            'opponentField': [card.to_dict() for card in self.opponent_field],
            'currentTurn': self.current_turn,
            'playerDeckCount': len(self.player_deck),
            'opponentDeckCount': len(self.opponent_deck),
            'discardPileCount': len(self.discard_pile),
            'playerHealth': self.player_health,
            'opponentHealth': self.opponent_health,
            'gameOver': self.game_over,
            'roundNumber': self.round_number,
        }