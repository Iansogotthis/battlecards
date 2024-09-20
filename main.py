from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO
from models.card import Card
from models.game import Game
from utils.db import init_db, get_db_connection
import logging

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with a real secret key in production
socketio = SocketIO(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize the database
init_db()

# Create a game instance
game = Game()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game_page():
    return render_template('game.html')

@app.route('/api/draw_card')
def draw_card():
    try:
        logger.info("Player attempting to draw a card")
        card = game.draw_card('player')
        if card:
            new_state = game.get_game_state()
            socketio.emit('update_game_state', new_state)
            logger.info(f"Player drew card: {card.to_dict()}")
            logger.debug(f"New game state after drawing: {new_state}")
            return jsonify(card.to_dict()), 200
        logger.warning("No cards left in the deck")
        return jsonify({'error': 'No cards left in the deck'}), 400
    except Exception as e:
        logger.error(f"Error drawing card: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/play_card', methods=['POST'])
def play_card():
    try:
        card_id = request.json.get('card_id')
        if card_id is None:
            logger.warning("Missing card_id in request")
            return jsonify({'error': 'Missing card_id in request'}), 400
        
        success = game.play_card(card_id, 'player')
        if success:
            new_state = game.get_game_state()
            socketio.emit('update_game_state', new_state)
            logger.info(f"Player played card: {card_id}")
            logger.debug(f"New game state after playing card: {new_state}")
            return jsonify({'success': True}), 200
        logger.warning(f"Failed to play card: {card_id}")
        return jsonify({'error': 'Failed to play card'}), 400
    except Exception as e:
        logger.error(f"Error playing card: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/end_turn')
def end_turn():
    try:
        game.end_turn()
        new_state = game.get_game_state()
        socketio.emit('update_game_state', new_state)
        logger.info("Player ended turn")
        logger.debug(f"New game state after ending turn: {new_state}")
        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error ending turn: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/game_state')
def get_game_state():
    try:
        state = game.get_game_state()
        logger.debug(f"Current game state: {state}")
        return jsonify(state), 200
    except Exception as e:
        logger.error(f"Error getting game state: {str(e)}")
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    socketio.emit('update_game_state', game.get_game_state())

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

if __name__ == '__main__':
    logger.info("Starting the Flask application")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
