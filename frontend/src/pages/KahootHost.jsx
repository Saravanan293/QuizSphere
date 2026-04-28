import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaPlay, FaArrowRight, FaTrophy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const KahootHost = () => {
  const { pin } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState('lobby'); // lobby, playing, results, leaderboard, final
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [questionResults, setQuestionResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('player_list_updated', (data) => setPlayers(data.players));
    
    socket.on('new_question', (q) => {
      setCurrentQuestion(q);
      setGameState('playing');
      setAnsweredCount(0);
    });

    socket.on('answer_count_updated', (data) => {
      setAnsweredCount(data.answered);
    });

    socket.on('question_results', (data) => {
      setQuestionResults(data.results);
      setLeaderboard(data.leaderboard);
      setGameState('results');
    });

    socket.on('game_over', (data) => {
      setLeaderboard(data.leaderboard);
      setGameState('final');
    });

    return () => {
      socket.off('player_list_updated');
      socket.off('new_question');
      socket.off('answer_count_updated');
      socket.off('question_results');
      socket.off('game_over');
    };
  }, [socket]);

  const startGame = () => {
    if (players.length === 0) return toast.error("Need players to start!");
    socket.emit('start_game', { pin });
  };

  const showResults = () => socket.emit('show_results', { pin });
  const nextQuestion = () => socket.emit('next_question', { pin });

  if (gameState === 'lobby') {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: 'var(--text-muted)', fontSize: '1.5rem', marginBottom: '1rem' }}>Game PIN:</h1>
          <h2 style={{ fontSize: '6rem', letterSpacing: '0.5rem', margin: '1rem 0' }}>{pin}</h2>
          <div style={{ display: 'flex', itemsCenter: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
            <FaUsers /> <span>{players.length} players joined</span>
          </div>
          <button onClick={startGame} className="btn btn-primary" style={{ padding: '1rem 4rem', fontSize: '1.5rem' }}>
            Start Game
          </button>
        </div>

        <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {players.map(p => (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={p.nickname} className="glass-card" style={{ padding: '1rem' }}>
              {p.nickname}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '4rem' }}>{currentQuestion.question}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
          {currentQuestion.options.map((opt, i) => (
            <div key={i} className={`kahoot-option opt-${i}`} style={{ cursor: 'default' }}>{opt}</div>
          ))}
        </div>
        <div style={{ marginTop: '4rem', display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '3rem' }}>{answeredCount}</h2>
            <p>Answers</p>
          </div>
          <button onClick={showResults} className="btn btn-primary" style={{ padding: '1.5rem 3rem' }}>End Question</button>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '3rem' }}>Question Results</h1>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '300px', marginBottom: '4rem' }}>
          {Object.entries(questionResults.answer_counts).map(([opt, count], i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '100%', height: `${(count / (questionResults.total_players || 1)) * 100}%`, background: `var(--opt-${i})`, minHeight: '10px', borderRadius: '0.5rem 0.5rem 0 0' }}></div>
              <div style={{ fontWeight: 800 }}>{count}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{opt}</div>
            </div>
          ))}
        </div>
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3>Correct Answer: <span style={{ color: 'var(--success)' }}>{questionResults.correct_answer}</span></h3>
        </div>
        <button onClick={nextQuestion} className="btn btn-primary" style={{ padding: '1rem 3rem' }}>Next <FaArrowRight /></button>
      </div>
    );
  }

  if (gameState === 'final') {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <FaTrophy size={100} color="var(--warning)" style={{ marginBottom: '2rem' }} />
        <h1 style={{ fontSize: '4rem', marginBottom: '4rem' }}>Podium</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', height: '400px' }}>
          {leaderboard.slice(0, 3).map((p, i) => (
            <div key={i} style={{ flex: 1, maxWidth: '200px' }}>
              <h3 style={{ marginBottom: '1rem' }}>{p.nickname}</h3>
              <div style={{ 
                height: i === 0 ? '300px' : (i === 1 ? '200px' : '150px'), 
                background: 'var(--glass-card)', 
                border: '1px solid var(--glass-border)',
                borderRadius: '1rem 1rem 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: 900
              }}>
                {i + 1}
              </div>
              <div style={{ padding: '1rem' }}>{p.score} pts</div>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: '4rem' }}>Exit Game</button>
      </div>
    );
  }

  return null;
};

export default KahootHost;
