import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import type { RootState } from "./app/store";
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';


function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

//
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
}

export default App
