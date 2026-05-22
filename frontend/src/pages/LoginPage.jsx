import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError('Please enter both User ID and Password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ userId: data.userId, role: data.role }));
      onLogin({ userId: data.userId, role: data.role });
      navigate('/home');
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center mb-8">
        <img src={logo} alt="Anna University" className="h-20 mb-3" />
        <h1 className="text-2xl font-bold text-primary">Anna University</h1>
        <p className="text-sm text-primary-light">Facility Booking System</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg px-8 py-8 flex flex-col gap-4 w-full max-w-sm"
      >
        <h2 className="text-center text-xl font-bold text-primary mb-2">Sign In</h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-primary">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="Enter your User ID"
            className="border border-beige-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-primary">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="border border-beige-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center bg-red-50 rounded-lg py-2 px-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
