import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreate from './pages/ProjectCreate';
import Sellers from './pages/Sellers';
import SellerDetail from './pages/SellerDetail';
import MyPage from './pages/MyPage';
import Chat from './pages/Chat';
import Admin from './pages/Admin';

function ProtectedRoute({ children, requireAdmin }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>로딩 중...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="sellers" element={<Sellers />} />
        <Route path="sellers/:id" element={<SellerDetail />} />
        <Route path="mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
        <Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
