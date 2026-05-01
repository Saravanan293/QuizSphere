import json
import random
import google.generativeai as genai
from flask import current_app


def generate_quiz_from_text(text, difficulty='medium', num_questions=5):
    """Generate quiz questions using Gemini AI, with fallback to mock."""
    api_key = current_app.config.get('GEMINI_API_KEY', '')
    
    if api_key and api_key != 'your-gemini-api-key-from-aistudio.google.com':
        try:
            return _generate_with_gemini(text, difficulty, num_questions, api_key)
        except Exception as e:
            return _generate_mock_questions(text, difficulty, num_questions)
    else:
        return _generate_mock_questions(text, difficulty, num_questions)


def _generate_with_gemini(text, difficulty, num_questions, api_key):
    """Use Google Gemini to generate quiz questions."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    difficulty_instructions = {
        'easy': 'Create simple, straightforward questions that test basic recall and understanding. The wrong options should be clearly different from the correct answer.',
        'medium': 'Create moderate difficulty questions that test comprehension and application. The wrong options should be plausible but distinguishable.',
        'hard': 'Create challenging questions that test deep analysis, critical thinking, and nuanced understanding. The wrong options should be very plausible and close to the correct answer.'
    }

    prompt = f"""You are a quiz generator. Based on the following text content, generate exactly {num_questions} multiple choice questions.

Difficulty level: {difficulty.upper()}
{difficulty_instructions.get(difficulty, difficulty_instructions['medium'])}

TEXT CONTENT:
{text}

CRITICAL RULES FOR OPTIONS:
- Options MUST be short, specific names, single words, or brief phrases (e.g., "Vijay", "Algorithm", "1994", "Mitochondria").
- NEVER use repetitive prefixes like "It relates to", "It is", or "He is".
- All options must belong to the same category (e.g., if the answer is a person, all wrong options must be other people or names).

RESPOND WITH ONLY A VALID JSON ARRAY. No markdown, no code blocks, no explanation.
Each object must have exactly these fields:
- "question": the question text (string)
- "options": array of exactly 4 answer options (strings)
- "correct_answer": the correct option text, must exactly match one of the options (string)

Example format:
[{{"question":"What is X?","options":["A","B","C","D"],"correct_answer":"B"}}]
"""

    response = model.generate_content(prompt)
    response_text = response.text.strip()

    # Clean response - remove markdown code blocks if present
    if response_text.startswith('```'):
        lines = response_text.split('\n')
        lines = [l for l in lines if not l.strip().startswith('```')]
        response_text = '\n'.join(lines)

    questions = json.loads(response_text)

    # Validate
    validated = []
    for q in questions[:num_questions]:
        if all(k in q for k in ['question', 'options', 'correct_answer']):
            if len(q['options']) == 4 and q['correct_answer'] in q['options']:
                validated.append({
                    'question': q['question'],
                    'options': q['options'],
                    'correct_answer': q['correct_answer']
                })

    if not validated:
        raise ValueError("No valid questions generated")

    return validated


def _generate_mock_questions(text, difficulty, num_questions):
    """Generate mock questions when no API key is available."""
    words = text.split()
    sentences = text.replace('\n', ' ').split('.')
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

    if not sentences:
        sentences = ["The document contains important information about the topic."]

    questions = []
    used_sentences = set()

    for i in range(num_questions):
        idx = i % len(sentences)
        while idx in used_sentences and len(used_sentences) < len(sentences):
            idx = (idx + 1) % len(sentences)
        used_sentences.add(idx)

        sentence = sentences[idx]
        # Extract key words for options
        sentence_words = [w.strip('.,!?;:()[]"\'') for w in sentence.split() if len(w.strip('.,!?;:()[]"\'')) > 3]

        if len(sentence_words) < 2:
            sentence_words = ['concept', 'principle', 'method', 'theory', 'process', 'system']

        keyword = random.choice(sentence_words[:5]) if sentence_words else 'concept'

        # Build question based on difficulty
        if difficulty == 'easy':
            q_text = f"What is the main term discussed in this excerpt: \"{sentence[:60]}...\"?"
        elif difficulty == 'hard':
            q_text = f"Which concept best matches the following description: \"{sentence[:60]}...\"?"
        else:
            q_text = f"Identify the key concept related to: \"{sentence[:60]}...\"?"

        correct = keyword.capitalize()
        
        # Try to find other words from the text for wrong options to make it look real
        all_words = list(set([w.strip('.,!?;:()[]"\'').capitalize() for w in words if len(w.strip('.,!?;:()[]"\'')) > 3 and w.lower() != keyword.lower()]))
        
        if len(all_words) >= 3:
            wrong_words = random.sample(all_words, k=3)
        else:
            default_wrong = ['Analysis', 'Framework', 'Structure', 'Methodology', 'Implementation', 'Paradigm', 'Architecture', 'Protocol', 'Algorithm', 'Specification', 'Database', 'Network', 'Function']
            wrong_words = random.sample(default_wrong, k=3)
            
        options = [correct] + wrong_words
        random.shuffle(options)

        questions.append({
            'question': q_text,
            'options': options,
            'correct_answer': correct
        })

    return questions


def generate_kahoot_questions_from_text(text, difficulty='medium', num_questions=10):
    """Generate Kahoot-style questions (shorter, more fun)."""
    api_key = current_app.config.get('GEMINI_API_KEY', '')

    if api_key and api_key != 'your-gemini-api-key-from-aistudio.google.com':
        try:
            return _generate_kahoot_with_gemini(text, difficulty, num_questions, api_key)
        except Exception as e:
            print(f"Gemini Kahoot error: {e}. Using mock.")
            return _generate_mock_questions(text, difficulty, num_questions)
    else:
        return _generate_mock_questions(text, difficulty, num_questions)


def _generate_kahoot_with_gemini(text, difficulty, num_questions, api_key):
    """Generate Kahoot-style questions with Gemini."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = f"""Generate {num_questions} fun, engaging Kahoot-style quiz questions based on this text. 
Difficulty level: {difficulty.upper()}
Questions should be concise (max 100 characters), with short answer options (max 40 characters each).
Mix of easy, medium, and hard questions.

TEXT: {text}

CRITICAL RULES FOR OPTIONS:
- Options MUST be short, specific names, single words, or brief phrases (e.g., "Vijay", "Algorithm", "1994", "Mitochondria").
- NEVER use repetitive prefixes like "It relates to", "It is", or "He is".
- All options must belong to the same category (e.g., if the answer is a person, all wrong options must be other people or names).

RESPOND WITH ONLY A VALID JSON ARRAY:
[{{"question":"Short question?","options":["A","B","C","D"],"correct_answer":"B","time_limit":20}}]

time_limit should be 10, 15, or 20 seconds based on difficulty.
"""

    response = model.generate_content(prompt)
    response_text = response.text.strip()

    if response_text.startswith('```'):
        lines = response_text.split('\n')
        lines = [l for l in lines if not l.strip().startswith('```')]
        response_text = '\n'.join(lines)

    questions = json.loads(response_text)
    validated = []
    for q in questions[:num_questions]:
        if all(k in q for k in ['question', 'options', 'correct_answer']):
            if len(q['options']) == 4 and q['correct_answer'] in q['options']:
                validated.append({
                    'question': q['question'],
                    'options': q['options'],
                    'correct_answer': q['correct_answer'],
                    'time_limit': q.get('time_limit', 20)
                })

    if not validated:
        raise ValueError("No valid Kahoot questions generated")

    return validated
