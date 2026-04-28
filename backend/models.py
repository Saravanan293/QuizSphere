from datetime import datetime
from extensions import db
from flask_login import UserMixin
import json

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    avatar_color = db.Column(db.String(20), default='#7C3AED')

    quiz_sessions = db.relationship('QuizSession', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'avatar_color': self.avatar_color
        }


class QuizSession(db.Model):
    __tablename__ = 'quiz_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pdf_filename = db.Column(db.String(256), nullable=True)
    difficulty = db.Column(db.String(20), nullable=False)
    question_count = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=0)
    time_taken = db.Column(db.Integer, default=0)  # seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    questions = db.relationship('QuizQuestion', backref='session', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'pdf_filename': self.pdf_filename,
            'difficulty': self.difficulty,
            'question_count': self.question_count,
            'score': self.score,
            'total_questions': self.total_questions,
            'time_taken': self.time_taken,
            'accuracy': round((self.score / self.total_questions * 100) if self.total_questions > 0 else 0, 1),
            'created_at': self.created_at.isoformat(),
            'questions': [q.to_dict() for q in self.questions]
        }


class QuizQuestion(db.Model):
    __tablename__ = 'quiz_questions'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('quiz_sessions.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=False)  # JSON
    correct_answer = db.Column(db.String(512), nullable=False)
    user_answer = db.Column(db.String(512), nullable=True)
    is_correct = db.Column(db.Boolean, default=False)
    time_spent = db.Column(db.Integer, default=0)  # seconds

    def to_dict(self):
        return {
            'id': self.id,
            'question_text': self.question_text,
            'options': json.loads(self.options) if self.options else [],
            'correct_answer': self.correct_answer,
            'user_answer': self.user_answer,
            'is_correct': self.is_correct,
            'time_spent': self.time_spent
        }
