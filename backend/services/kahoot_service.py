import random
import string
import time


class KahootRoom:
    """Represents a single Kahoot game room."""

    def __init__(self, host_sid, host_username, questions):
        self.pin = self._generate_pin()
        self.host_sid = host_sid
        self.host_username = host_username
        self.questions = questions  # list of {question, options, correct_answer, time_limit}
        self.players = {}  # sid -> {nickname, score, answers: []}
        self.current_question_index = -1
        self.state = 'lobby'  # lobby, playing, question_active, showing_results, finished
        self.question_start_time = None
        self.created_at = time.time()

    def _generate_pin(self):
        return ''.join(random.choices(string.digits, k=6))

    def add_player(self, sid, nickname):
        self.players[sid] = {
            'nickname': nickname,
            'score': 0,
            'answers': [],
            'streak': 0
        }

    def remove_player(self, sid):
        if sid in self.players:
            del self.players[sid]

    def get_current_question(self):
        if 0 <= self.current_question_index < len(self.questions):
            q = self.questions[self.current_question_index]
            return {
                'index': self.current_question_index,
                'question': q['question'],
                'options': q['options'],
                'time_limit': q.get('time_limit', 20),
                'total_questions': len(self.questions)
            }
        return None

    def next_question(self):
        self.current_question_index += 1
        if self.current_question_index >= len(self.questions):
            self.state = 'finished'
            return None
        self.state = 'question_active'
        self.question_start_time = time.time()
        return self.get_current_question()

    def submit_answer(self, sid, answer):
        if sid not in self.players:
            return None
        if self.state != 'question_active':
            return None

        q = self.questions[self.current_question_index]
        elapsed = time.time() - self.question_start_time
        time_limit = q.get('time_limit', 20)

        is_correct = answer == q['correct_answer']

        # Kahoot scoring: faster = more points, max 1000
        points = 0
        if is_correct:
            time_factor = max(0, 1 - (elapsed / time_limit))
            points = int(500 + (500 * time_factor))
            self.players[sid]['streak'] += 1
            # Streak bonus
            if self.players[sid]['streak'] >= 3:
                points += 100
        else:
            self.players[sid]['streak'] = 0

        self.players[sid]['score'] += points
        self.players[sid]['answers'].append({
            'question_index': self.current_question_index,
            'answer': answer,
            'is_correct': is_correct,
            'points': points,
            'time': round(elapsed, 1)
        })

        return {
            'is_correct': is_correct,
            'points': points,
            'total_score': self.players[sid]['score'],
            'streak': self.players[sid]['streak']
        }

    def get_leaderboard(self):
        board = []
        for sid, data in self.players.items():
            board.append({
                'nickname': data['nickname'],
                'score': data['score'],
                'streak': data['streak']
            })
        board.sort(key=lambda x: x['score'], reverse=True)
        return board

    def get_question_results(self):
        q = self.questions[self.current_question_index]
        answer_counts = {opt: 0 for opt in q['options']}
        total_answered = 0
        correct_count = 0

        for sid, data in self.players.items():
            for ans in data['answers']:
                if ans['question_index'] == self.current_question_index:
                    total_answered += 1
                    if ans['answer'] in answer_counts:
                        answer_counts[ans['answer']] += 1
                    if ans['is_correct']:
                        correct_count += 1

        return {
            'correct_answer': q['correct_answer'],
            'answer_counts': answer_counts,
            'total_answered': total_answered,
            'correct_count': correct_count,
            'total_players': len(self.players)
        }

    def get_player_list(self):
        return [{'nickname': p['nickname'], 'score': p['score']}
                for p in self.players.values()]


class KahootRoomManager:
    """Manages all active Kahoot rooms."""

    def __init__(self):
        self.rooms = {}  # pin -> KahootRoom
        self.sid_to_pin = {}  # sid -> pin (for disconnect handling)

    def create_room(self, host_sid, host_username, questions):
        room = KahootRoom(host_sid, host_username, questions)
        # Ensure unique PIN
        while room.pin in self.rooms:
            room.pin = room._generate_pin()
        self.rooms[room.pin] = room
        self.sid_to_pin[host_sid] = room.pin
        return room

    def get_room(self, pin):
        return self.rooms.get(pin)

    def get_room_by_sid(self, sid):
        pin = self.sid_to_pin.get(sid)
        if pin:
            return self.rooms.get(pin)
        return None

    def join_room(self, pin, sid, nickname):
        room = self.rooms.get(pin)
        if not room:
            return None, "Room not found"
        if room.state != 'lobby':
            return None, "Game already in progress"
        # Check duplicate nickname
        for p in room.players.values():
            if p['nickname'].lower() == nickname.lower():
                return None, "Nickname already taken"
        room.add_player(sid, nickname)
        self.sid_to_pin[sid] = pin
        return room, None

    def handle_disconnect(self, sid):
        pin = self.sid_to_pin.get(sid)
        if not pin:
            return None, None
        room = self.rooms.get(pin)
        if not room:
            return None, None

        is_host = room.host_sid == sid

        if is_host:
            # Host disconnected - close room
            del self.rooms[pin]
            # Clean up all player mappings
            for player_sid in list(room.players.keys()):
                self.sid_to_pin.pop(player_sid, None)
            self.sid_to_pin.pop(sid, None)
            return pin, 'host_left'
        else:
            room.remove_player(sid)
            self.sid_to_pin.pop(sid, None)
            return pin, 'player_left'

    def close_room(self, pin):
        room = self.rooms.get(pin)
        if room:
            for sid in list(room.players.keys()):
                self.sid_to_pin.pop(sid, None)
            self.sid_to_pin.pop(room.host_sid, None)
            del self.rooms[pin]


# Global singleton
room_manager = KahootRoomManager()
