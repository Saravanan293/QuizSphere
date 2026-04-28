import os
import json
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from services.pdf_service import extract_text_from_pdf, cleanup_file
from services.ai_service import generate_kahoot_questions_from_text

kahoot_bp = Blueprint('kahoot', __name__)


@kahoot_bp.route('/generate-from-pdf', methods=['POST'])
@login_required
def generate_kahoot_from_pdf():
    """Generate Kahoot questions from uploaded PDF."""
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file uploaded'}), 400

    file = request.files['pdf']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    difficulty = request.form.get('difficulty', 'medium')
    num_questions = int(request.form.get('num_questions', 10))

    filename = secure_filename(file.filename)
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    try:
        text = extract_text_from_pdf(filepath)
        questions = generate_kahoot_questions_from_text(text, difficulty, num_questions)

        return jsonify({
            'questions': questions,
            'source': filename
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cleanup_file(filepath)


@kahoot_bp.route('/validate-questions', methods=['POST'])
@login_required
def validate_manual_questions():
    """Validate manually created questions."""
    data = request.get_json()
    questions = data.get('questions', [])

    if not questions or len(questions) < 1:
        return jsonify({'error': 'At least 1 question is required'}), 400

    validated = []
    for i, q in enumerate(questions):
        if not q.get('question') or not q.get('options') or not q.get('correct_answer'):
            return jsonify({'error': f'Question {i+1} is incomplete'}), 400
        if len(q['options']) != 4:
            return jsonify({'error': f'Question {i+1} must have exactly 4 options'}), 400
        if q['correct_answer'] not in q['options']:
            return jsonify({'error': f'Question {i+1}: correct answer must be one of the options'}), 400

        validated.append({
            'question': q['question'],
            'options': q['options'],
            'correct_answer': q['correct_answer'],
            'time_limit': q.get('time_limit', 20)
        })

    return jsonify({'questions': validated, 'valid': True}), 200
