import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaHistory, FaUsers, FaSignOutAlt, FaBrain } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="glass-card" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '1rem', zIndex: 100 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'white' }}>
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
          <FaBrain size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem' }}>QuizSphere</h2>
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/generate" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
          <FaPlus /> Generate
        </Link>
        <Link to="/history" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
          <FaHistory /> History
        </Link>
        <Link to="/kahoot/create" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
          <FaUsers /> Kahoot
        </Link>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: user?.avatar_color || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user?.username?.[0].toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem' }}>
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
