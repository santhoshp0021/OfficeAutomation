import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

export default function ProjectorListingPage() {
  const [projectors, setProjectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const period = location.state?.period;
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchProjectors = async () => {
    setError('');
    setLoading(true);
    const periodId = period?.periodId;
    if (!periodId) { setError('No period selected'); setLoading(false); return; }
    try {
      const [allRes, bookedRes] = await Promise.all([
        api.get('/facilities/projectors'),
        api.get(`/projectors?periodId=${periodId}`)
      ]);
      const bookedSet = new Set(bookedRes.data.map(p => p.name.trim().toLowerCase()));
      setProjectors(allRes.data.map(p => ({
        name: p.name,
        type: p.type,
        free: !bookedSet.has(p.name.trim().toLowerCase())
      })));
    } catch {
      setError('Could not fetch projectors');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!period) { alert('No period selected'); navigate('/booking'); return; }
    fetchProjectors();
  }, [period?.periodId]);

  const handleBook = async (projector) => {
    if (!projector.free) return;
    try {
      await api.post('/book-projector', {
        userId: user.userId,
        periodId: period.periodId,
        projectorName: projector.name.trim()
      });
      alert('Projector booked successfully!');
      navigate('/booking');
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
      fetchProjectors();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige-50 to-beige-100">
        <LoadingSpinner message="Loading projectors..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beige-50 to-beige-100">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 flex flex-col items-center pb-10">
        <h2 className="text-2xl font-bold text-primary mt-6 mb-6">Projector Listing</h2>
        <div className="w-full max-w-4xl flex flex-wrap gap-4 justify-center">
          {projectors.map(projector => (
            <div
              key={projector.name}
              className={`rounded-xl border-2 p-5 flex flex-col items-center gap-3 w-44 shadow-sm ${
                projector.free ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="font-bold text-primary text-sm text-center">{projector.name}</div>
              <div className="text-xs text-gray-500">Projector</div>
              <div className={`text-sm font-semibold ${projector.free ? 'text-green-700' : 'text-red-600'}`}>
                {projector.free ? 'Free' : 'Occupied'}
              </div>
              <button
                onClick={() => handleBook(projector)}
                disabled={!projector.free}
                className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
                  projector.free
                    ? 'bg-primary text-white hover:bg-primary-dark cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {projector.free ? 'Book' : 'Occupied'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
