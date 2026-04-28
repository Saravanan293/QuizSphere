import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilePdf, FaEdit, FaPlus, FaTrash, FaCheckCircle, FaPlay } from 'react-icons/fa';

const KahootCreate = () => {
  const [mode, setMode] = useState(null); // 'pdf' or 'manual'
  const [file, setFile] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correct_answer: '', time_limit: 20 }]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const handlePdfUpload = async () => {
    if (!file) return toast.error("Please select a PDF");
    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('difficulty', difficulty);
    formData.append('num_questions', numQuestions);

    try {
      const res = await axios.post('/api/kahoot/generate-from-pdf', formData);
      startRoom(res.data.questions);
    } catch (err) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const startRoom = (finalQuestions) => {
    if (!socket) return;
    socket.emit('create_room', { questions: finalQuestions, username: user.username });
    
    socket.once('room_created', (data) => {
      navigate(`/kahoot/host/${data.pin}`, { state: { questions: finalQuestions } });
    });
  };

  const handleManualSubmit = async () => {
    // Basic validation
    for (const q of questions) {
      if (!q.question || q.options.some(o => !o) || !q.correct_answer) {
        return toast.error("Please fill in all question fields");
      }
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/kahoot/validate-questions', { questions });
      startRoom(res.data.questions);
    } catch (err) {
      toast.error(err.response?.data?.error || "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => setQuestions([...questions, { question: '', options: ['', '', '', ''], correct_answer: '', time_limit: 20 }]);
  const removeQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));
  const updateQuestion = (idx, field, val) => {
    const newQs = [...questions];
    newQs[idx][field] = val;
    setQuestions(newQs);
  };
  const updateOption = (qIdx, oIdx, val) => {
    const newQs = [...questions];
    newQs[qIdx].options[oIdx] = val;
    setQuestions(newQs);
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Host a Kahoot</h1>
        <p style={{ color: 'var(--text-muted)' }}>Choose how you want to create your quiz</p>
      </header>

      {!mode ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setMode('pdf')} className="glass-card" style={{ padding: '3rem', cursor: 'pointer', textAlign: 'center' }}>
            <FaFilePdf size={64} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
            <h2>Upload PDF</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>AI will generate questions from your document</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setMode('manual')} className="glass-card" style={{ padding: '3rem', cursor: 'pointer', textAlign: 'center' }}>
            <FaEdit size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
            <h2>Create Manually</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Type your own questions and answers</p>
          </motion.div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => setMode(null)} className="btn btn-outline" style={{ marginBottom: '2rem' }}>← Back</button>
          
          {mode === 'pdf' ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <FaFilePdf size={80} color="var(--error)" style={{ marginBottom: '2rem' }} />
              <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf" style={{ marginBottom: '2rem' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
                <div className="flex flex-col gap-3">
                  <label style={{ fontWeight: 600 }}>Difficulty Level</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['easy', 'medium', 'hard'].map(level => (
                      <button 
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`btn ${difficulty === level ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, textTransform: 'capitalize', padding: '0.5rem' }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label style={{ fontWeight: 600 }}>Question Count</label>
                  <select 
                    value={numQuestions} 
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem' }}
                  >
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} Questions</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handlePdfUpload} disabled={loading} className="btn btn-primary" style={{ padding: '1rem 3rem', width: '100%' }}>
                {loading ? 'Generating...' : 'Generate Kahoot'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="glass-card" style={{ padding: '2rem' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--primary)' }}>Question {qIdx + 1}</h3>
                    {questions.length > 1 && <button onClick={() => removeQuestion(qIdx)} className="btn btn-outline" style={{ color: 'var(--error)' }}><FaTrash /></button>}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter your question here" 
                    value={q.question} 
                    onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                    style={{ width: '100%', fontSize: '1.2rem', marginBottom: '1.5rem' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder={`Option ${oIdx + 1}`} 
                          value={opt} 
                          onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                          style={{ flex: 1, borderLeft: `5px solid var(--opt-${oIdx})` }}
                        />
                        <button 
                          onClick={() => updateQuestion(qIdx, 'correct_answer', opt)}
                          className="btn"
                          style={{ padding: '0.5rem', background: q.correct_answer === opt ? 'var(--success)' : 'var(--glass)' }}
                        >
                          <FaCheckCircle color="white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={addQuestion} className="btn btn-outline" style={{ flex: 1 }}><FaPlus /> Add Question</button>
                <button onClick={handleManualSubmit} disabled={loading} className="btn btn-primary" style={{ flex: 2 }}><FaPlay /> Create Game</button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default KahootCreate;
