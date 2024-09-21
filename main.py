from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from models.card import Card
from models.game import Game
from utils.db import init_db, get_db_connection
import logging
import traceback
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with a real secret key in production
socketio = SocketIO(app, cors_allowed_origins="*")

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

init_db()

games = {}  # Dictionary to store active games

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game_page():
    return render_template('game.html')

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

@socketio.on('create_game')
def handle_create_game():
    game_id = str(uuid.uuid4())
    game = Game()
    games[game_id] = game
    join_room(game_id)
    emit('game_created', {'game_id': game_id})

@socketio.on('join_game')
def handle_join_game(data):
    game_id = data['game_id']
    if game_id in games:
        game = games[game_id]
        if len(game.players) < 2:
            player_id = str(uuid.uuid4())
            game.add_player(player_id)
            join_room(game_id)
            emit('game_joined', {'player_id': player_id, 'game_state': game.get_game_state()}, room=game_id)
            if len(game.players) == 2:
                emit('game_start', {'game_state': game.get_game_state()}, room=game_id)
        else:
            emit('error', {'message': 'Game is full'})
    else:
        emit('error', {'message': 'Game not found'})

@socketio.on('draw_card')
def handle_draw_card(data):
    game_id = data['game_id']
    player_id = data['player_id']
    if game_id in games:
        game = games[game_id]
        card = game.draw_card(player_id)
        if card:
            emit('card_drawn', {'card': card.to_dict(), 'game_state': game.get_game_state()}, room=game_id)
        else:
            emit('error', {'message': 'No cards left in the deck'}, room=game_id)
    else:
        emit('error', {'message': 'Game not found'})

@socketio.on('play_card')
def handle_play_card(data):
    game_id = data['game_id']
    player_id = data['player_id']
    card_id = data['card_id']
    if game_id in games:
        game = games[game_id]
        success = game.play_card(player_id, card_id)
        if success:
            emit('card_played', {'game_state': game.get_game_state()}, room=game_id)
        else:
            emit('error', {'message': 'Failed to play card'}, room=game_id)
    else:
        emit('error', {'message': 'Game not found'})

@socketio.on('end_turn')
def handle_end_turn(data):
    game_id = data['game_id']
    player_id = data['player_id']
    if game_id in games:
        game = games[game_id]
        game.end_turn(player_id)
        emit('turn_ended', {'game_state': game.get_game_state()}, room=game_id)
    else:
        emit('error', {'message': 'Game not found'})

if __name__ == '__main__':
    logger.info("Starting the Flask application with SocketIO")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
