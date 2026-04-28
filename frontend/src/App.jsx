import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import QuizGenerator from './pages/QuizGenerator';
import QuizPage from './pages/QuizPage';
import History from './pages/History';
import KahootCreate from './pages/KahootCreate';
import KahootHost from './pages/KahootHost';
import KahootPlayer from './pages/KahootPlayer';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/generate" element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
        <Route path="/quiz/:sessionId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        
        {/* Kahoot Routes */}
        <Route path="/kahoot/create" element={<ProtectedRoute><KahootCreate /></ProtectedRoute>} />
        <Route path="/kahoot/host/:pin" element={<ProtectedRoute><KahootHost /></ProtectedRoute>} />
        <Route path="/kahoot/join" element={<KahootPlayer />} /> {/* Players don't need login */}
      </Routes>
    </div>
  );
}

export default App;
