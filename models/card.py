class Card:
    def __init__(self, id, name, attack, defense, type):
        self.id = id
        self.name = name
        self.attack = attack
        self.defense = defense
        self.type = type

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'attack': self.attack,
            'defense': self.defense,
            'type': self.type
        }
