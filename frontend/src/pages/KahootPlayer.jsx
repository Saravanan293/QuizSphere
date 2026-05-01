import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const KahootPlayer = () => {
  const socket = useSocket();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [gameState, setGameState] = useState('join'); // join, waiting, playing, answered, result, final
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!socket) return;

    socket.on('joined_room', (data) => {
      setGameState('waiting');
      toast.success("Joined! Wait for the host to start.");
    });

    // Remove redundant game_started listener that causes race condition crashes
    // socket.on('game_started', () => setGameState('playing'));

    socket.on('new_question', (q) => {
      setCurrentQuestion(q);
      setLastResult(null); // Reset last result for the new question
      setGameState('playing');
      setTimeLeft(15);
    });

    socket.on('answer_result', (data) => {
      setLastResult(data);
      setTotalScore(data.total_score);
      // Wait for host to trigger question_results before changing state
    });

    socket.on('question_results', () => {
      setGameState('result');
    });

    socket.on('game_over', () => setGameState('final'));

    socket.on('error', (err) => toast.error(err.message));

    return () => {
      socket.off('joined_room');
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('question_results');
      socket.off('game_over');
    };
  }, [socket]);

  useEffect(() => {
    let timer;
    if ((gameState === 'playing' || gameState === 'answered') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const joinGame = (e) => {
    e.preventDefault();
    if (!pin || !nickname) return;
    socket.emit('join_room_request', { pin, nickname });
  };

  const submitAnswer = (option) => {
    socket.emit('submit_answer', { pin, answer: option });
    setGameState('answered');
  };

  if (gameState === 'join') {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <form onSubmit={joinGame} className="glass-card flex flex-col gap-4" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Join Kahoot</h1>
          <input type="text" placeholder="Game PIN" value={pin} onChange={(e) => setPin(e.target.value)} style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800 }} required />
          <input type="text" placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} style={{ textAlign: 'center' }} required />
          <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.2rem' }}>Join</button>
        </form>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh', textAlign: 'center' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          <h1 style={{ fontSize: '3rem' }}>You're In!</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Check your name on the screen</p>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'playing') {
    if (!currentQuestion) {
      return (
        <div className="container flex items-center justify-center" style={{ minHeight: '100vh', textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2>Loading Question...</h2>
            <div className="loading-spinner" style={{ marginTop: '1rem' }}></div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-card" style={{ margin: '1rem', padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 5 ? 'var(--error)' : 'inherit' }}>{timeLeft}s</div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Question {currentQuestion.index + 1}</h2>
          <h1 style={{ fontSize: '1.5rem' }}>{currentQuestion.question}</h1>
        </div>
        
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', padding: '0.5rem' }}>
          {currentQuestion.options.map((opt, i) => (
            <button key={i} onClick={() => submitAnswer(opt)} className={`kahoot-option opt-${i}`} style={{ border: 'none' }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'answered') {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft <= 5 ? 'var(--error)' : 'inherit' }}>{timeLeft}s</div>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Answered!</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Wait for others...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    const isCorrect = lastResult?.is_correct || false;
    const points = lastResult?.points || 0;
    
    return (
      <div className={`container flex items-center justify-center`} style={{ minHeight: '100vh', textAlign: 'center', background: isCorrect ? 'var(--success)' : 'var(--error)' }}>
        <div>
          <h1 style={{ fontSize: '4rem' }}>{isCorrect ? 'Correct!' : (lastResult ? 'Wrong' : 'Time\'s Up!')}</h1>
          <h2 style={{ marginTop: '2rem' }}>+{points} points</h2>
          <p style={{ marginTop: '1rem' }}>Current Score: {totalScore}</p>
        </div>
      </div>
    );
  }

  if (gameState === 'final') {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '4rem' }}>
          <h1 style={{ fontSize: '3rem' }}>Game Over!</h1>
          <h2 style={{ marginTop: '2rem', color: 'var(--primary)' }}>Final Score: {totalScore}</h2>
          <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: '2rem' }}>Play Again</button>
        </div>
      </div>
    );
  }

  return null;
};

export default KahootPlayer;
