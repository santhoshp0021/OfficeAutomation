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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">User ID</label>
            <input
              type="text"
              className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 px-2 bg-transparent"
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
              className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 px-2 bg-transparent"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Role</label>
            <select
              className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 px-2 bg-transparent"
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
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelect;