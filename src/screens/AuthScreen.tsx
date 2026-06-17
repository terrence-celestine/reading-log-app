// src/screens/AuthScreen.tsx
import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-[#2C2C2A] rounded-lg flex items-center justify-center">
          <BookOpen size={16} color="#F7F5F0" />
        </div>
        <span className="text-lg font-medium text-[#2C2C2A]">ReadLog</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-6 flex flex-col gap-4">

        <div>
          <h1 className="text-[17px] font-medium text-[#2C2C2A]">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-[13px] text-[#888780] mt-1">
            {mode === 'login' ? 'Sign in to your library' : 'Start tracking your reading'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
            />
          </div>

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="yourname"
                className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="bg-[#F0EDE6] border border-[#E0DDD6] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#C8C5BE]"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#2C2C2A] disabled:bg-[#C8C5BE] text-[#F7F5F0] text-[13px] font-medium py-3 rounded-xl transition-colors"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {/* Toggle */}
        <p className="text-center text-[12px] text-[#888780]">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-[#2C2C2A] font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  );
};

export default AuthScreen;