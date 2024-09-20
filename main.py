from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO
from models.card import Card
from models.game import Game
from utils.db import init_db, get_db_connection

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with a real secret key in production
socketio = SocketIO(app)

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
    card = game.draw_card()
    return jsonify(card.to_dict())

@app.route('/api/play_card', methods=['POST'])
def play_card():
    card_id = request.json['card_id']
    success = game.play_card(card_id)
    return jsonify({'success': success})

@app.route('/api/end_turn')
def end_turn():
    game.end_turn()
    return jsonify({'success': True})

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
