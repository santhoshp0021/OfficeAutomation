import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FacultyLogin = () => {
  const navigate = useNavigate();
  const [facultyId, setFacultyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!facultyId.trim()) {
      setError('Please enter your Faculty ID');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.get(`/api/faculty/${facultyId}`);
      if (response.data) {
        localStorage.setItem('loggedInFaculty', JSON.stringify(response.data));
        localStorage.setItem('facultyId', response.data.facultyId);
        navigate('/faculty/dashboard');
      }
    } catch (error) {
      setError('Invalid Faculty ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Faculty Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700">
              Enter Faculty ID
            </label>
            <input
              id="facultyId"
              name="facultyId"
              type="text"
              required
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your Faculty ID"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Role Selection
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyLogin; 