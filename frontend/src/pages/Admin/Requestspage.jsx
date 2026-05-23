import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

function openBase64PDF(base64Data) {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  window.open(URL.createObjectURL(blob), '_blank');
}

const ROLE_LABELS = {
  faculty:     'Faculty',
  student_rep: 'Student Rep',
  secretary:   'Secretary',
  admin:       'Admin',
  student:     'Student',
};

const ROLE_BADGE = {
  faculty:     'bg-blue-100 text-blue-700',
  student_rep: 'bg-purple-100 text-purple-700',
  secretary:   'bg-orange-100 text-orange-700',
  admin:       'bg-red-100 text-red-700',
  student:     'bg-gray-100 text-gray-600',
};

const HALL_FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'faculty',     label: 'Faculty' },
  { key: 'student_rep', label: 'Student Rep' },
  { key: 'secretary',   label: 'Secretary' },
];

function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[role] || 'bg-gray-100 text-gray-600'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function RequestTable({ requests, onAccept, onReject, columns }) {
  if (!requests.length) return <p className="text-gray-500 text-sm py-4 text-center">No pending requests.</p>;
  return (
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
                <td key={c.key} className="px-3 py-2 border-b border-beige-100">
                  {c.render ? c.render(req) : (req[c.key] ?? '')}
                </td>
              ))}
              <td className="px-3 py-2 border-b border-beige-100">
                <div className="flex gap-2">
                  <button onClick={() => onAccept(req._id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold w-8 h-8 rounded-lg transition-colors" title="Accept">✔</button>
                  <button onClick={() => onReject(req._id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold w-8 h-8 rounded-lg transition-colors" title="Reject">✖</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const pdfCell = (req) =>
  req.pdf?.data ? (
    <button onClick={() => openBase64PDF(req.pdf.data)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors">
      View PDF
    </button>
  ) : <span className="text-gray-400 text-xs">No file</span>;

const AUDI_COLS = [
  { key: 'venue',      label: 'Auditorium' },
  { key: 'userId',     label: 'User' },
  { key: 'date',       label: 'Date' },
  { key: 'eventName',  label: 'Event' },
  { key: 'startTime',  label: 'Start' },
  { key: 'endTime',    label: 'End' },
  { key: 'status',     label: 'Status' },
  { key: 'pdf',        label: 'Document', render: pdfCell },
];

export default function Requestspage() {
  const [hallRequests, setHallRequests] = useState([]);
  const [audiRequests, setAudiRequests] = useState([]);
  const [userRoles, setUserRoles]       = useState({});  // userId → role
  const [hallFilter, setHallFilter]     = useState('all');
  const [loading, setLoading]           = useState(true);
  const [error,   setError]             = useState('');

  const fetchRequests = async () => {
    setLoading(true); setError('');
    try {
      const [hallRes, audiRes, usersRes] = await Promise.all([
        api.get('/hall-requests', { params: { status: 'pending' } }),
        api.get('/audi-requests', { params: { status: 'pending' } }),
        api.get('/users'),
      ]);
      setHallRequests(Array.isArray(hallRes.data) ? hallRes.data : []);
      setAudiRequests(Array.isArray(audiRes.data) ? audiRes.data : []);
      const roleMap = {};
      (Array.isArray(usersRes.data) ? usersRes.data : []).forEach(u => { roleMap[u.userId] = u.role; });
      setUserRoles(roleMap);
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

  const filteredHall = hallFilter === 'all'
    ? hallRequests
    : hallRequests.filter(r => userRoles[r.userId] === hallFilter);

  // Build HALL_COLS dynamically so role cell can use userRoles
  const HALL_COLS = [
    { key: 'hallName',  label: 'Hall' },
    { key: 'userId',    label: 'User' },
    {
      key: '_role',
      label: 'Role',
      render: (req) => <RoleBadge role={userRoles[req.userId]} />,
    },
    { key: 'date',      label: 'Date' },
    { key: 'eventName', label: 'Event' },
    { key: 'startTime', label: 'Start' },
    { key: 'endTime',   label: 'End' },
    { key: 'pdf',       label: 'Document', render: pdfCell },
  ];

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
            {/* ── Hall Requests ── */}
            <div className="mb-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-primary">Pending Hall Requests</h3>
                <div className="flex flex-wrap gap-2">
                  {HALL_FILTERS.map(f => {
                    const count = f.key === 'all'
                      ? hallRequests.length
                      : hallRequests.filter(r => userRoles[r.userId] === f.key).length;
                    return (
                      <button key={f.key} onClick={() => setHallFilter(f.key)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          hallFilter === f.key
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-600 border-beige-200 hover:bg-beige-50'
                        }`}>
                        {f.label} <span className="opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <RequestTable
                requests={filteredHall}
                onAccept={id => handleHallStatus(id, 'accepted')}
                onReject={id => handleHallStatus(id, 'rejected')}
                columns={HALL_COLS}
              />
            </div>

            {/* ── Auditorium Requests ── */}
            <div>
              <h3 className="text-lg font-bold text-primary mb-4">Pending Auditorium Requests</h3>
              <RequestTable
                requests={audiRequests}
                onAccept={id => handleAudiStatus(id, 'accepted')}
                onReject={id => handleAudiStatus(id, 'rejected')}
                columns={AUDI_COLS}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
