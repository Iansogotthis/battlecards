from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO
from models.card import Card
from models.game import Game
from utils.db import init_db, get_db_connection
import logging
import traceback

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with a real secret key in production
socketio = SocketIO(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

init_db()

game = Game()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game_page():
    return render_template('game.html')

@app.route('/api/draw_card', methods=['POST'])
def draw_card():
    try:
        logger.info("Received draw_card request")
        player = request.json.get('player', 'player')
        logger.info(f"Player attempting to draw a card: {player}")
        
        if game.current_turn != player:
            logger.warning(f"Attempted to draw card out of turn. Current turn: {game.current_turn}")
            return jsonify({'error': "It's not your turn!"}), 400
        
        logger.debug(f"Player hand before drawing: {[c.to_dict() for c in game.player_hand]}")
        card = game.draw_card(player)
        if card:
            new_state = game.get_game_state()
            logger.info(f"{player.capitalize()} drew card: {card}")
            logger.debug(f"Player hand after drawing: {[c.to_dict() for c in game.player_hand]}")
            logger.debug(f"New game state after drawing: {new_state}")
            
            # Check for duplicates in the player's hand
            player_hand = new_state['playerHand']
            unique_cards = {card['id']: card for card in player_hand}
            new_state['playerHand'] = list(unique_cards.values())
            
            socketio.emit('update_game_state', new_state)
            return jsonify(card), 200
        logger.warning(f"No cards left in the {player}'s deck")
        return jsonify({'error': f'No cards left in the {player}\'s deck'}), 400
    except Exception as e:
        logger.error(f"Error drawing card: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/play_card', methods=['POST'])
def play_card():
    try:
        logger.info("Received play_card request")
        card_id = request.json.get('card_id')
        player = request.json.get('player', 'player')
        logger.info(f"Attempting to play card: {card_id} for player: {player}")
        
        if card_id is None:
            logger.warning("Missing card_id in request")
            return jsonify({'error': 'Missing card_id in request'}), 400
        
        if game.current_turn != player:
            logger.warning(f"Attempted to play card out of turn. Current turn: {game.current_turn}")
            return jsonify({'error': "It's not your turn!"}), 400
        
        success = game.play_card(card_id, player)
        if success:
            new_state = game.get_game_state()
            socketio.emit('update_game_state', new_state)
            logger.info(f"{player.capitalize()} played card: {card_id}")
            logger.debug(f"New game state after playing card: {new_state}")
            return jsonify({'success': True}), 200
        logger.warning(f"Failed to play card: {card_id}")
        return jsonify({'error': 'Failed to play card'}), 400
    except Exception as e:
        logger.error(f"Error playing card: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/end_turn')
def end_turn():
    try:
        logger.info(f"Ending turn. Current turn before change: {game.current_turn}")
        game.end_turn()
        new_state = game.get_game_state()
        logger.info(f"Turn ended. New turn: {new_state['currentTurn']}")
        socketio.emit('update_game_state', new_state)
        logger.debug(f"New game state after ending turn: {new_state}")
        return jsonify({'success': True, 'new_state': new_state}), 200
    except Exception as e:
        logger.error(f"Error ending turn: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/game_state')
def get_game_state():
    try:
        state = game.get_game_state()
        logger.info(f"Sending game state to client: {state}")
        return jsonify(state), 200
    except Exception as e:
        logger.error(f"Error getting game state: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset_game')
def reset_game():
    try:
        game.reset_game()
        new_state = game.get_game_state()
        socketio.emit('update_game_state', new_state)
        logger.info("Game reset successfully")
        return jsonify({'success': True, 'new_state': new_state}), 200
    except Exception as e:
        logger.error(f"Error resetting game: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear_fields')
def clear_fields():
    try:
        game.clear_fields()
        new_state = game.get_game_state()
        socketio.emit('update_game_state', new_state)
        return jsonify({'success': True, 'new_state': new_state}), 200
    except Exception as e:
        logger.error(f"Error clearing fields: {str(e)}")
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
