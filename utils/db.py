import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ['PGHOST'],
        database=os.environ['PGDATABASE'],
        user=os.environ['PGUSER'],
        password=os.environ['PGPASSWORD'],
        port=os.environ['PGPORT']
    )
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create cards table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS cards (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            attack INTEGER NOT NULL,
            defense INTEGER NOT NULL,
            type VARCHAR(50) NOT NULL
        )
    ''')
    
    # Create game_states table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS game_states (
            id SERIAL PRIMARY KEY,
            player_hand JSON,
            player_field JSON,
            opponent_hand JSON,
            opponent_field JSON,
            deck JSON
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()

def get_all_cards():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM cards')
    cards = cur.fetchall()
    cur.close()
    conn.close()
    return cards

def save_game_state(game_state):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO game_states (player_hand, player_field, opponent_hand, opponent_field, deck)
        VALUES (%s, %s, %s, %s, %s)
    ''', (
        game_state['player_hand'],
        game_state['player_field'],
        game_state['opponent_hand'],
        game_state['opponent_field'],
        game_state['deck']
    ))
    conn.commit()
    cur.close()
    conn.close()

def load_game_state(game_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM game_states WHERE id = %s', (game_id,))
    game_state = cur.fetchone()
    cur.close()
    conn.close()
    return game_state
