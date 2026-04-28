import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const QuizPage = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simple Data Loading
  useEffect(() => {
    if (location.state?.quizData) {
      setQuizData(location.state.quizData);
      setLoading(false);
    } else {
      axios.get(`/api/quiz/session/${sessionId}`)
        .then(res => {
          setQuizData(res.data.session);
          setLoading(false);
        })
        .catch(() => {
          toast.error("Quiz not found");
          navigate('/');
        });
    }
  }, [sessionId, location.state]);

  const handleSelect = (option) => {
    const qId = quizData.questions[currentIdx].id;
    setUserAnswers({ ...userAnswers, [qId]: option });
  };

  const nextQuestion = () => {
    if (currentIdx < quizData.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = () => {
    setLoading(true);
    axios.post('/api/quiz/submit', {
      session_id: sessionId,
      answers: userAnswers,
      time_taken: 60
    }).then(res => {
      setQuizData(res.data.session);
      setShowResults(true);
      setLoading(false);
    }).catch(() => {
      toast.error("Could not save score");
      setLoading(false);
    });
  };

  if (loading) return <div className="container"><h1>Loading...</h1></div>;
  if (!quizData) return <div className="container"><h1>No Data Found</h1></div>;

  // Results View
  if (showResults) {
    return (
      <div className="container">
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem' }}>Done! 🏁</h1>
          <h2 style={{ margin: '1rem 0' }}>Your Score: {quizData.score} / {quizData.total_questions}</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary">Back to Home</button>
        </div>
      </div>
    );
  }

  // Quiz View
  const q = quizData.questions[currentIdx];
  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '1rem', opacity: 0.7 }}>Question {currentIdx + 1} of {quizData.questions.length}</div>
      
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '2rem' }}>{q.question_text || q.question}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {q.options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => handleSelect(opt)}
              className="btn btn-outline"
              style={{ 
                justifyContent: 'flex-start', 
                background: userAnswers[q.id] === opt ? 'var(--primary)' : 'transparent',
                color: userAnswers[q.id] === opt ? 'white' : 'inherit'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <button 
          onClick={nextQuestion} 
          disabled={!userAnswers[q.id]}
          className="btn btn-primary"
          style={{ padding: '1rem 3rem' }}
        >
          {currentIdx === quizData.questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
