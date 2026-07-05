import './App.css'
import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import ForgotPassword from './pages/ForgotPassword';
import AuthLoader from './components/AuthLoader';


import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthLoader>
      <Toaster position="top-right" toastOptions={{ style: { background: '#18181b', color: '#fafafa', border: '1px solid #27272a' } }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </AuthLoader>
  );
}

export default App
