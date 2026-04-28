from flask_socketio import emit, join_room, leave_room
from services.kahoot_service import room_manager


def register_kahoot_events(socketio):
    """Register all Kahoot SocketIO event handlers."""

    @socketio.on('connect')
    def handle_connect():
        print(f"Client connected")

    @socketio.on('disconnect')
    def handle_disconnect():
        from flask import request
        sid = request.sid
        pin, reason = room_manager.handle_disconnect(sid)
        if pin and reason == 'host_left':
            emit('game_cancelled', {'reason': 'Host disconnected'}, room=pin)
        elif pin and reason == 'player_left':
            room = room_manager.get_room(pin)
            if room:
                emit('player_list_updated', {'players': room.get_player_list()}, room=pin)

    @socketio.on('create_room')
    def handle_create_room(data):
        from flask import request
        sid = request.sid
        questions = data.get('questions', [])
        host_username = data.get('username', 'Host')

        if not questions or len(questions) < 1:
            emit('error', {'message': 'At least 1 question is required'})
            return

        room = room_manager.create_room(sid, host_username, questions)
        join_room(room.pin)

        emit('room_created', {
            'pin': room.pin,
            'total_questions': len(questions)
        })

    @socketio.on('join_room_request')
    def handle_join_room(data):
        from flask import request
        sid = request.sid
        pin = data.get('pin', '').strip()
        nickname = data.get('nickname', '').strip()

        if not pin or not nickname:
            emit('error', {'message': 'PIN and nickname are required'})
            return

        room, error = room_manager.join_room(pin, sid, nickname)
        if error:
            emit('error', {'message': error})
            return

        join_room(pin)

        emit('joined_room', {
            'pin': pin,
            'nickname': nickname,
            'player_count': len(room.players)
        })

        # Notify all in room
        emit('player_list_updated', {
            'players': room.get_player_list()
        }, room=pin)

    @socketio.on('start_game')
    def handle_start_game(data):
        from flask import request
        sid = request.sid
        pin = data.get('pin')
        room = room_manager.get_room(pin)

        if not room or room.host_sid != sid:
            emit('error', {'message': 'Only the host can start the game'})
            return

        if len(room.players) < 1:
            emit('error', {'message': 'Need at least 1 player to start'})
            return

        room.state = 'playing'
        question = room.next_question()

        if question:
            emit('game_started', {}, room=pin)
            emit('new_question', question, room=pin)

    @socketio.on('next_question')
    def handle_next_question(data):
        from flask import request
        sid = request.sid
        pin = data.get('pin')
        room = room_manager.get_room(pin)

        if not room or room.host_sid != sid:
            return

        question = room.next_question()
        if question:
            emit('new_question', question, room=pin)
        else:
            # Game over
            emit('game_over', {
                'leaderboard': room.get_leaderboard()
            }, room=pin)

    @socketio.on('submit_answer')
    def handle_submit_answer(data):
        from flask import request
        sid = request.sid
        pin = data.get('pin')
        answer = data.get('answer')
        room = room_manager.get_room(pin)

        if not room:
            return

        result = room.submit_answer(sid, answer)
        if result:
            # Send result to the player who answered
            emit('answer_result', result)

            # Notify host about answer count
            answered_count = sum(
                1 for p in room.players.values()
                if any(a['question_index'] == room.current_question_index for a in p['answers'])
            )
            emit('answer_count_updated', {
                'answered': answered_count,
                'total': len(room.players)
            }, room=pin)

    @socketio.on('show_results')
    def handle_show_results(data):
        from flask import request
        sid = request.sid
        pin = data.get('pin')
        room = room_manager.get_room(pin)

        if not room or room.host_sid != sid:
            return

        room.state = 'showing_results'
        results = room.get_question_results()
        leaderboard = room.get_leaderboard()

        emit('question_results', {
            'results': results,
            'leaderboard': leaderboard
        }, room=pin)

    @socketio.on('end_game')
    def handle_end_game(data):
        from flask import request
        sid = request.sid
        pin = data.get('pin')
        room = room_manager.get_room(pin)

        if not room or room.host_sid != sid:
            return

        emit('game_over', {
            'leaderboard': room.get_leaderboard()
        }, room=pin)

        room_manager.close_room(pin)
