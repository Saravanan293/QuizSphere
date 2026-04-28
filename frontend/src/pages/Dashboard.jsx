import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaUsers, FaChartLine, FaArrowRight } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Hello, {user?.username}! 👋</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>What would you like to do today?</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <motion.div whileHover={{ y: -5 }} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '1rem', width: 'fit-content' }}>
            <FaFilePdf size={40} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Quiz Generator</h3>
            <p style={{ color: 'var(--text-muted)' }}>Upload a PDF and let our AI generate a custom quiz for you to test your knowledge.</p>
          </div>
          <Link to="/generate" className="btn btn-primary" style={{ width: 'fit-content' }}>
            Start Generating <FaArrowRight />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '1rem', width: 'fit-content' }}>
            <FaUsers size={40} color="var(--secondary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Multiplayer Kahoot</h3>
            <p style={{ color: 'var(--text-muted)' }}>Host a real-time multiplayer game. Perfect for classrooms and studying with friends.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/kahoot/create" className="btn btn-primary" style={{ flex: 1 }}>
              Host Game
            </Link>
            <Link to="/kahoot/join" className="btn btn-outline" style={{ flex: 1 }}>
              Join Room
            </Link>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', width: 'fit-content' }}>
            <FaChartLine size={40} color="var(--success)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>View History</h3>
            <p style={{ color: 'var(--text-muted)' }}>Track your progress over time. Review past quizzes and see how you've improved.</p>
          </div>
          <Link to="/history" className="btn btn-outline" style={{ width: 'fit-content' }}>
            See History
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
