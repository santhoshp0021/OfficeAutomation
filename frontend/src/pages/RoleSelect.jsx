import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelect = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!role) {
      setError('Please select a role');
      return;
    }
    localStorage.setItem('userRole', role);
    // Redirect based on selected role
    if (role === 'coordinator') {
      navigate('/dashboard');
    } else if (role === 'faculty') {
      navigate('/faculty/dashboard');
    } else if (role === 'hod') {
      navigate('/hod/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 transition-all duration-500">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-10 flex flex-col items-center animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-8 tracking-tight text-center drop-shadow">Login</h1>
        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">User ID</label>
            <input
              type="text"
              className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 px-2 bg-transparent transition-all duration-200"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 px-2 bg-transparent transition-all duration-200"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Role</label>
            <select
              className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 px-2 bg-transparent transition-all duration-200"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            >
              <option value="">Select a role</option>
              <option value="coordinator">Coordinator</option>
              <option value="faculty">Faculty</option>
              <option value="hod">HOD</option>
            </select>
          </div>
          {error && <div className="text-red-500 text-sm text-center animate-pulse">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg tracking-wide mt-2"
          >
            Login
          </button>
        </form>
      </div>
      <div className="w-full flex justify-center mt-8">
        <a
          href="/about"
          className="text-blue-700 font-semibold underline hover:text-purple-700 transition-all duration-200 text-base tracking-wide hover:scale-110"
        >
          About Us
        </a>
      </div>
    </div>
  );
};

export default RoleSelect;