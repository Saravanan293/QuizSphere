import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaHistory, FaEye, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const History = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/quiz/history');
        setSessions(res.data.sessions);
      } catch (err) {
        console.error("History fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="container">Loading history...</div>;

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <FaHistory size={32} color="var(--primary)" />
        <h1 style={{ fontSize: '2.5rem' }}>Your Quiz History</h1>
      </header>

      {sessions.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No quizzes yet</h2>
          <Link to="/generate" className="btn btn-primary">Create Your First Quiz</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session, idx) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card" 
              style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: session.accuracy >= 70 ? 'var(--success)' : 'inherit' }}>
                    {session.score}/{session.total_questions}
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>Score</small>
                </div>
                
                <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }}></div>
                
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{session.pdf_filename || 'Generated Quiz'}</h3>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <span style={{ textTransform: 'capitalize' }}>{session.difficulty}</span>
                    <span>•</span>
                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <Link to={`/quiz/${session.id}`} className="btn btn-outline" style={{ gap: '0.5rem' }}>
                <FaEye /> Review <FaChevronRight size={12} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
