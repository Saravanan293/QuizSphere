import os
import json
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, QuizSession, QuizQuestion
from services.pdf_service import extract_text_from_pdf, cleanup_file
from services.ai_service import generate_quiz_from_text

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.route('/generate', methods=['POST'])
@login_required
def generate_quiz():
    """Upload PDF and generate quiz questions."""
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file uploaded'}), 400

    file = request.files['pdf']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    difficulty = request.form.get('difficulty', 'medium')
    num_questions = int(request.form.get('num_questions', 5))

    if difficulty not in ['easy', 'medium', 'hard']:
        difficulty = 'medium'
    if num_questions not in [3, 5, 10, 15, 20]:
        num_questions = 5

    # Save uploaded file
    filename = secure_filename(file.filename)
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    try:
        # Extract text from PDF
        text = extract_text_from_pdf(filepath)

        # Generate quiz questions
        questions = generate_quiz_from_text(text, difficulty, num_questions)

        # Create quiz session
        session = QuizSession(
            user_id=current_user.id,
            pdf_filename=filename,
            difficulty=difficulty,
            question_count=len(questions),
            total_questions=len(questions)
        )
        db.session.add(session)
        db.session.flush()

        # Save questions
        for q in questions:
            quiz_q = QuizQuestion(
                session_id=session.id,
                question_text=q['question'],
                options=json.dumps(q['options']),
                correct_answer=q['correct_answer']
            )
            db.session.add(quiz_q)

        db.session.commit()

        return jsonify({
            'session_id': session.id,
            'questions': [{
                'id': qq.id,
                'question': qq.question_text,
                'options': json.loads(qq.options),
                'correct_answer': qq.correct_answer
            } for qq in session.questions],
            'difficulty': difficulty,
            'total_questions': len(questions)
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to generate quiz: {str(e)}'}), 500
    finally:
        cleanup_file(filepath)


@quiz_bp.route('/submit', methods=['POST'])
@login_required
def submit_quiz():
    """Submit quiz answers and get results."""
    data = request.get_json()
    session_id = data.get('session_id')
    answers = data.get('answers', {})  # {question_id: answer}
    time_taken = data.get('time_taken', 0)

    session = QuizSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'error': 'Quiz session not found'}), 404

    score = 0
    for question in session.questions:
        user_answer = answers.get(str(question.id), '')
        question.user_answer = user_answer
        question.is_correct = user_answer == question.correct_answer
        if question.is_correct:
            score += 1

    session.score = score
    session.time_taken = time_taken
    db.session.commit()

    return jsonify({
        'session': session.to_dict(),
        'message': 'Quiz submitted successfully'
    }), 200


@quiz_bp.route('/session/<int:session_id>', methods=['GET'])
@login_required
def get_session(session_id):
    """Get a specific quiz session with review data."""
    session = QuizSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    return jsonify({'session': session.to_dict()}), 200


@quiz_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    """Get user's quiz history."""
    sessions = QuizSession.query.filter_by(user_id=current_user.id)\
        .order_by(QuizSession.created_at.desc()).all()

    return jsonify({
        'sessions': [{
            'id': s.id,
            'pdf_filename': s.pdf_filename,
            'difficulty': s.difficulty,
            'score': s.score,
            'total_questions': s.total_questions,
            'accuracy': round((s.score / s.total_questions * 100) if s.total_questions > 0 else 0, 1),
            'time_taken': s.time_taken,
            'created_at': s.created_at.isoformat()
        } for s in sessions],
        'total_quizzes': len(sessions),
        'avg_score': round(sum(s.score for s in sessions) / len(sessions), 1) if sessions else 0
    }), 200
