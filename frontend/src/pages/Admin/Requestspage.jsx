import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

function RequestTable({ title, requests, onAccept, onReject, columns }) {
  if (!requests.length) return null;
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-primary mb-3">{title}</h3>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-beige-100">
              {columns.map(c => (
                <th key={c.key} className="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">{c.label}</th>
              ))}
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req._id} className="bg-yellow-50 even:bg-white hover:bg-beige-50 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className="px-3 py-2 border-b border-beige-100">{req[c.key] ?? ''}</td>
                ))}
                <td className="px-3 py-2 border-b border-beige-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAccept(req._id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold w-8 h-8 rounded-lg transition-colors"
                      title="Accept"
                    >✔</button>
                    <button
                      onClick={() => onReject(req._id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold w-8 h-8 rounded-lg transition-colors"
                      title="Reject"
                    >✖</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const HALL_COLS = [
  { key: 'hallName', label: 'Hall' },
  { key: 'userId', label: 'User' },
  { key: 'date', label: 'Date' },
  { key: 'eventName', label: 'Event' },
  { key: 'startTime', label: 'Start' },
  { key: 'endTime', label: 'End' },
  { key: 'status', label: 'Status' },
];

const AUDI_COLS = [
  { key: 'venue', label: 'Auditorium' },
  { key: 'userId', label: 'User' },
  { key: 'date', label: 'Date' },
  { key: 'eventName', label: 'Event' },
  { key: 'startTime', label: 'Start' },
  { key: 'endTime', label: 'End' },
  { key: 'status', label: 'Status' },
];

export default function Requestspage() {
  const [hallRequests, setHallRequests] = useState([]);
  const [audiRequests, setAudiRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true); setError('');
    try {
      const [hallRes, audiRes] = await Promise.all([
        api.get('/hall-requests', { params: { status: 'pending' } }),
        api.get('/audi-requests', { params: { status: 'pending' } }),
      ]);
      setHallRequests(Array.isArray(hallRes.data) ? hallRes.data : []);
      setAudiRequests(Array.isArray(audiRes.data) ? audiRes.data : []);
    } catch {
      setError('Could not fetch requests');
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleHallStatus = async (id, status) => {
    try { await api.post(`/hall-requests/${id}/status`, { status }); fetchRequests(); }
    catch { alert('Failed to update status'); }
  };

  const handleAudiStatus = async (id, status) => {
    try { await api.post(`/audi-requests/${id}/status`, { status }); fetchRequests(); }
    catch { alert('Failed to update status'); }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-6 text-center">Pending Requests</h2>
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {hallRequests.length === 0 && audiRequests.length === 0 && (
              <p className="text-center text-gray-500">No pending requests.</p>
            )}
            <RequestTable
              title="Pending Hall Requests"
              requests={hallRequests}
              onAccept={id => handleHallStatus(id, 'accepted')}
              onReject={id => handleHallStatus(id, 'rejected')}
              columns={HALL_COLS}
            />
            <RequestTable
              title="Pending Auditorium Requests"
              requests={audiRequests}
              onAccept={id => handleAudiStatus(id, 'accepted')}
              onReject={id => handleAudiStatus(id, 'rejected')}
              columns={AUDI_COLS}
            />
          </>
        )}
      </div>
    </div>
  );
}
