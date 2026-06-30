import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadToken, restoreSession, sessionNotFound } from '@/features/auth/authSlice';
import { wsConnect } from '@/features/websocket/websocketSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import Welcome  from '@/pages/Welcome';
import Login    from '@/pages/Login';
import Register from '@/pages/Register';
import Home     from '@/pages/Home';
import Trip     from '@/pages/Trip';

function AppRoutes() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isRestoring } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const token = loadToken();
    if (token) {
      dispatch(restoreSession(token));
      dispatch(wsConnect(token));
    } else {
      dispatch(sessionNotFound());
    }
  }, []);

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"         element={isAuthenticated ? <Navigate to="/home" replace /> : <Welcome />} />
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/home" replace /> : <Register />} />
      <Route path="/home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/trip"     element={<ProtectedRoute><Trip /></ProtectedRoute>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
