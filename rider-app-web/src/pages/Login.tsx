import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/features/auth/authApi';
import { persistToken, setCredentials } from '@/features/auth/authSlice';
import { wsConnect } from '@/features/websocket/websocketSlice';
import { useAppDispatch } from '@/store';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Login() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email: email.trim().toLowerCase(), password }).unwrap();
      persistToken(res.data.token);
      dispatch(setCredentials({ rider: res.data.rider!, token: res.data.token }));
      dispatch(wsConnect(res.data.token));
      navigate('/home');
    } catch (err: any) {
      setError(err?.data?.message ?? 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-zinc-900 text-sm">🚗</span>
          </div>
          <span className="text-white font-black tracking-tight">RideApp</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-black text-white mb-1">Welcome back 👋</h1>
          <p className="text-zinc-500 text-sm mb-8">Sign in to continue your journey</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon="📧"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              placeholder="••••••••"
              leftIcon="🔒"
              isPassword
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" size="lg" fullWidth loading={isLoading} className="mt-2">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
