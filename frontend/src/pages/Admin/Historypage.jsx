import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getPeriodInfo(periodId) {
  if (!periodId) return { periodNo: '', periodDay: '' };
  const [no, day] = periodId.split('-');
  return { periodNo: no || '', periodDay: DAYS[parseInt(day, 10)] || '' };
}

function downloadCSV(header, rows, filename) {
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function Historypage() {
  const [history, setHistory] = useState([]);
  const [hallRequests, setHallRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hallLoading, setHallLoading] = useState(true);
  const [error, setError] = useState('');
  const [hallError, setHallError] = useState('');

  const [facilityFilter, setFacilityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [hallNameFilter, setHallNameFilter] = useState('');
  const [hallDateFilter, setHallDateFilter] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    const params = {};
    if (facilityFilter) params.facilityName = facilityFilter;
    if (dateFilter) params.date = dateFilter;
    api.get('/booking-history', { params })
      .then(res => setHistory(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to fetch booking history'))
      .finally(() => setLoading(false));
  }, [facilityFilter, dateFilter]);

  useEffect(() => {
    setHallLoading(true); setHallError('');
    const params = {};
    if (hallNameFilter) params.hallName = hallNameFilter;
    if (hallDateFilter) params.date = hallDateFilter;
    api.get('/hall-requests/filter', { params })
      .then(res => setHallRequests(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHallError('Failed to fetch hall requests'))
      .finally(() => setHallLoading(false));
  }, [hallNameFilter, hallDateFilter]);

  const handleDownloadHistory = () => {
    const header = ['User','Period ID','Period Day','Period No','Facility Name','Facility Type','Usage Date','Booked/Free','Logged At'];
    const rows = history.map(rec => {
      const { periodNo, periodDay } = getPeriodInfo(rec.periodId);
      return [
        rec.userId?.userId || rec.userId || '',
        rec.periodId, periodDay, periodNo,
        rec.facility?.name || '', rec.facility?.type || '',
        rec.usageDate || '',
        rec.facility?.free === false ? 'Booked' : 'Freed',
        rec.date ? new Date(rec.date).toLocaleString() : '',
      ];
    });
    downloadCSV(header, rows, 'booking_history.csv');
  };

  const handleDownloadHall = () => {
    const header = ['User','Hall Name','Date','Start Time','End Time','Status','Booked At'];
    const rows = hallRequests.map(r => [
      r.userId, r.hallName, r.date, r.startTime, r.endTime, r.status,
      r.bookedAt ? new Date(r.bookedAt).toLocaleString() : ''
    ]);
    downloadCSV(header, rows, 'hall_requests.csv');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-6 text-center">History &amp; Reports</h2>

        {/* Booking History */}
        <section className="mb-10">
          <h3 className="text-lg font-bold text-primary mb-3">Booking History</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <input type="text" placeholder="Filter by facility name" value={facilityFilter}
              onChange={e => setFacilityFilter(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button onClick={() => { setFacilityFilter(''); setDateFilter(''); }}
              className="bg-primary-light hover:bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Clear
            </button>
          </div>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            {error && <p className="text-red-600 p-4">{error}</p>}
            {loading && <p className="text-gray-400 p-4">Loading...</p>}
            {!loading && !error && history.length === 0 && <p className="text-gray-500 p-4">No booking history found.</p>}
            {!loading && !error && history.length > 0 && (
              <>
                <div className="p-3 border-b border-beige-100">
                  <button onClick={handleDownloadHistory}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                    Download CSV
                  </button>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-beige-100">
                      {['User','Period ID','Day','P#','Facility','Type','Usage Date','Status','Logged At'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-beige-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((rec, idx) => {
                      const { periodNo, periodDay } = getPeriodInfo(rec.periodId);
                      return (
                        <tr key={rec._id || idx} className="even:bg-beige-50 hover:bg-beige-100 transition-colors">
                          <td className="px-3 py-2 border-b border-beige-100">{rec.userId?.userId || rec.userId || ''}</td>
                          <td className="px-3 py-2 border-b border-beige-100">{rec.periodId}</td>
                          <td className="px-3 py-2 border-b border-beige-100">{periodDay}</td>
                          <td className="px-3 py-2 border-b border-beige-100">{periodNo}</td>
                          <td className="px-3 py-2 border-b border-beige-100">{rec.facility?.name || ''}</td>
                          <td className="px-3 py-2 border-b border-beige-100">{rec.facility?.type || ''}</td>
                          <td className="px-3 py-2 border-b border-beige-100">{rec.usageDate || ''}</td>
                          <td className="px-3 py-2 border-b border-beige-100">
                            <span className={rec.facility?.free === false ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>
                              {rec.facility?.free === false ? 'Booked' : 'Freed'}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-beige-100 text-xs text-gray-500">{rec.date ? new Date(rec.date).toLocaleString() : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </section>

        {/* Hall Requests */}
        <section>
          <h3 className="text-lg font-bold text-primary mb-3">Hall Requests</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <input type="text" placeholder="Filter by hall name" value={hallNameFilter}
              onChange={e => setHallNameFilter(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <input type="date" value={hallDateFilter} onChange={e => setHallDateFilter(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button onClick={() => { setHallNameFilter(''); setHallDateFilter(''); }}
              className="bg-primary-light hover:bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Clear
            </button>
          </div>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            {hallError && <p className="text-red-600 p-4">{hallError}</p>}
            {hallLoading && <p className="text-gray-400 p-4">Loading...</p>}
            {!hallLoading && !hallError && hallRequests.length === 0 && <p className="text-gray-500 p-4">No hall requests found.</p>}
            {!hallLoading && !hallError && hallRequests.length > 0 && (
              <>
                <div className="p-3 border-b border-beige-100">
                  <button onClick={handleDownloadHall}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                    Download CSV
                  </button>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-beige-100">
                      {['User','Hall','Date','Start','End','Status','Booked At'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-beige-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hallRequests.map((req, idx) => (
                      <tr key={req._id || idx} className="even:bg-beige-50 hover:bg-beige-100 transition-colors">
                        <td className="px-3 py-2 border-b border-beige-100">{req.userId}</td>
                        <td className="px-3 py-2 border-b border-beige-100">{req.hallName}</td>
                        <td className="px-3 py-2 border-b border-beige-100">{req.date}</td>
                        <td className="px-3 py-2 border-b border-beige-100">{req.startTime}</td>
                        <td className="px-3 py-2 border-b border-beige-100">{req.endTime}</td>
                        <td className="px-3 py-2 border-b border-beige-100">
                          <span className={
                            req.status === 'accepted' ? 'text-green-700 font-semibold' :
                            req.status === 'rejected' ? 'text-red-600 font-semibold' :
                            'text-yellow-700 font-semibold'
                          }>{req.status}</span>
                        </td>
                        <td className="px-3 py-2 border-b border-beige-100 text-xs text-gray-500">
                          {req.bookedAt ? new Date(req.bookedAt).toLocaleString() : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
