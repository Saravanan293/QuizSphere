import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaCloudUploadAlt, FaFilePdf, FaCog, FaPlay, FaArrowRight, FaCheckCircle, FaHome } from 'react-icons/fa';

const QuizGenerator = () => {
  // --- STATE ---
  const [file, setFile] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  
  // Quiz Active State
  const [questions, setQuestions] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  // --- HANDLERS ---
  const onFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else {
      toast.error("Please select a PDF file");
    }
  };

  const handleGenerate = async () => {
    if (!file) return toast.error("Select a PDF first");
    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('difficulty', difficulty);
    formData.append('num_questions', numQuestions);

    try {
      const res = await axios.post('/api/quiz/generate', formData);
      setQuestions(res.data.questions);
      toast.success("Quiz is Ready!");
    } catch (err) {
      toast.error("AI failed to read PDF. Try a smaller one.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (opt) => {
    const qId = questions[currentIdx].id;
    setAnswers({ ...answers, [qId]: opt });
  };

  const nextQ = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Calculate Score
      let s = 0;
      questions.forEach(q => {
        // Since we don't have correct_answer in the generation response for security,
        // we'll just simulate the finish or redirect to results.
        // For simplicity in this "Light" version, we'll just show a "Done" screen.
      });
      setFinished(true);
    }
  };

  // --- VIEWS ---

  // 1. Finished View
  if (finished) {
    return (
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
          <FaCheckCircle size={80} color="var(--success)" style={{ marginBottom: '2rem' }} />
          <h1 style={{ fontSize: '3rem' }}>Quiz Finished!</h1>
          <p style={{ margin: '1rem 0', opacity: 0.7 }}>Review your answers below to learn more.</p>
        </div>

        <div className="flex flex-col gap-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="glass-card" style={{ padding: '1.5rem', textAlign: 'left' }}>
              <h3 style={{ marginBottom: '1rem' }}>{idx + 1}. {q.question}</h3>
              <div className="flex flex-col gap-2">
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)' }}>
                  <strong>Correct Answer:</strong> {q.correct_answer}
                </div>
                {answers[q.id] !== q.correct_answer && (
                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                    <strong>Your Answer:</strong> {answers[q.id]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ padding: '1rem 4rem' }}>
            <FaHome /> Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // 2. Quiz Active View
  if (questions) {
    const q = questions[currentIdx];
    return (
      <div className="container" style={{ maxWidth: '700px' }}>
        <div style={{ marginBottom: '1rem' }}>Question {currentIdx + 1} of {questions.length}</div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>{q.question}</h2>
          <div className="flex flex-col gap-3">
            {q.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(opt)}
                className="btn btn-outline"
                style={{ 
                  justifyContent: 'flex-start',
                  background: answers[q.id] === opt ? 'var(--primary)' : 'transparent',
                  color: answers[q.id] === opt ? 'white' : 'inherit'
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button onClick={nextQ} disabled={!answers[q.id]} className="btn btn-primary" style={{ padding: '1rem 3rem' }}>
            {currentIdx === questions.length - 1 ? 'Finish' : 'Next'} <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  // 3. Main Upload View
  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>Generate Your Quiz</h1>
      
      <div className="flex flex-col gap-6">
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FaFilePdf size={64} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
          <input type="file" onChange={onFileChange} accept=".pdf" style={{ marginBottom: '1rem' }} />
          {file && <p style={{ color: 'var(--success)' }}>✓ {file.name} selected</p>}
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="flex flex-col gap-2">
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label>Questions</label>
              <select value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)}>
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !file} className="btn btn-primary" style={{ padding: '1.5rem' }}>
          {loading ? 'AI is thinking...' : 'Generate and Start Quiz'}
        </button>
      </div>
    </div>
  );
};

export default QuizGenerator;
