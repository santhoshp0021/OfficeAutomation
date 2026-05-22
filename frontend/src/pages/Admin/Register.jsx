import { useState, useEffect, useRef } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

const ROLES = ['student', 'student_rep', 'faculty', 'secretary', 'admin'];
const ROLE_LABELS = { student: 'Student', student_rep: 'Student Rep', faculty: 'Faculty', secretary: 'Secretary', admin: 'Admin' };
const ROLE_COLORS = { admin: 'bg-red-100 text-red-700', faculty: 'bg-blue-100 text-blue-700', secretary: 'bg-purple-100 text-purple-700', student_rep: 'bg-yellow-100 text-yellow-700', student: 'bg-gray-100 text-gray-600' };

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = [];
  const errors = [];
  lines.forEach((line, i) => {
    // skip header line if present
    if (i === 0 && line.toLowerCase().startsWith('userid')) return;
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 4) { errors.push(`Line ${i + 1}: needs 4 columns (userId,password,role,email)`); return; }
    const [userId, password, role, email] = parts;
    if (!ROLES.includes(role)) { errors.push(`Line ${i + 1}: invalid role "${role}"`); return; }
    parsed.push({ userId, password, role, email });
  });
  return { parsed, errors };
}

// ── Single Register Tab ───────────────────────────────────────────────────────

function SingleRegister({ onDone }) {
  const [form, setForm] = useState({ userId: '', password: '', role: 'student', email: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setLoading(true);
    try {
      await api.post('/register', form);
      setIsError(false);
      setMessage('User registered successfully!');
      setForm({ userId: '', password: '', role: 'student', email: '' });
      onDone();
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4 max-w-md mx-auto">
      {message && (
        <p className={`text-sm px-3 py-2 rounded-lg ${isError ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>{message}</p>
      )}
      {[
        { label: 'User ID', name: 'userId', type: 'text', placeholder: 'e.g. faculty4' },
        { label: 'Password', name: 'password', type: 'password', placeholder: 'Min 6 characters' },
        { label: 'Email', name: 'email', type: 'email', placeholder: 'user@ceg.ac.in' },
      ].map(f => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">{f.label}</label>
          <input type={f.type} value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
            placeholder={f.placeholder} required
            className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">Role</label>
        <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} required
          className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors">
        {loading ? 'Registering...' : 'Register User'}
      </button>
    </form>
  );
}

// ── Bulk Register Tab ─────────────────────────────────────────────────────────

function BulkRegister({ onDone }) {
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleParse = () => {
    const { parsed, errors } = parseCSV(csvText);
    setPreview(parsed);
    setParseErrors(errors);
    setResult(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCsvText(ev.target.result); setPreview([]); setParseErrors([]); setResult(null); };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!preview.length) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.post('/register/bulk', { users: preview });
      setResult(res.data);
      if (res.data.created.length > 0) { setCsvText(''); setPreview([]); onDone(); }
    } catch (err) {
      setResult({ created: [], failed: [{ userId: 'all', reason: err.response?.data?.error || 'Server error' }] });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 max-w-3xl mx-auto flex flex-col gap-5">
      <div className="bg-beige-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-1">CSV Format (one user per line):</p>
        <code className="font-mono text-xs bg-white border border-beige-200 rounded px-2 py-1 block">
          userId,password,role,email<br />
          faculty4,pass123,faculty,faculty4@ceg.ac.in<br />
          student2,pass123,student,student2@ceg.ac.in
        </code>
        <p className="mt-1.5 text-xs text-gray-500">Valid roles: {ROLES.join(', ')}</p>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <button onClick={() => fileRef.current.click()}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Upload CSV File
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
        <span className="text-sm text-gray-400">or paste below</span>
      </div>

      <textarea value={csvText} onChange={e => { setCsvText(e.target.value); setPreview([]); setResult(null); }}
        rows={6} placeholder="userId,password,role,email&#10;faculty4,pass123,faculty,faculty4@ceg.ac.in"
        className="border border-beige-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />

      <button onClick={handleParse} disabled={!csvText.trim()}
        className="bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors w-fit">
        Parse &amp; Preview
      </button>

      {parseErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-700 font-semibold text-sm mb-1">Parse errors:</p>
          {parseErrors.map((e, i) => <p key={i} className="text-red-600 text-xs">{e}</p>)}
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-beige-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-beige-100">
                  {['User ID', 'Password', 'Role', 'Email'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((u, i) => (
                  <tr key={i} className="even:bg-beige-50">
                    <td className="px-3 py-1.5 font-medium">{u.userId}</td>
                    <td className="px-3 py-1.5 text-gray-400 font-mono text-xs">{'•'.repeat(u.password.length)}</td>
                    <td className="px-3 py-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-600">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors w-fit">
            {loading ? 'Registering...' : `Register ${preview.length} User${preview.length > 1 ? 's' : ''}`}
          </button>
        </>
      )}

      {result && (
        <div className={`rounded-xl p-4 text-sm ${result.failed.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          {result.created.length > 0 && (
            <p className="text-green-700 font-semibold mb-1">Created ({result.created.length}): {result.created.join(', ')}</p>
          )}
          {result.failed.length > 0 && (
            <>
              <p className="text-red-700 font-semibold mb-1">Failed ({result.failed.length}):</p>
              {result.failed.map((f, i) => (
                <p key={i} className="text-red-600 text-xs">{f.userId}: {f.reason}</p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Manage Users Tab ──────────────────────────────────────────────────────────

function ManageUsers({ refreshKey }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId;

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await api.get('/users'); setUsers(res.data); }
    catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [refreshKey]);

  const notify = (msg, err = false) => { setMessage(msg); setIsError(err); setTimeout(() => setMessage(''), 4000); };

  const handleDelete = async (userId) => {
    if (!window.confirm(`Delete user "${userId}" and ALL their data (timetable, bookings, enrollment, requests)?`)) return;
    try {
      const res = await api.delete(`/users/${userId}`);
      notify(res.data.message);
      setSelected(prev => { const n = new Set(prev); n.delete(userId); return n; });
      fetchUsers();
    } catch (err) { notify(err.response?.data?.error || 'Delete failed', true); }
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} user(s) and ALL their data? This cannot be undone.`)) return;
    try {
      const res = await api.post('/users/bulk-delete', { userIds: ids });
      notify(`Deleted: ${res.data.deleted.join(', ')}${res.data.failed.length ? ` | Failed: ${res.data.failed.map(f => f.userId).join(', ')}` : ''}`);
      setSelected(new Set());
      fetchUsers();
    } catch (err) { notify(err.response?.data?.error || 'Bulk delete failed', true); }
  };

  const toggleSelect = (userId) => {
    if (userId === currentUserId) return;
    setSelected(prev => { const n = new Set(prev); n.has(userId) ? n.delete(userId) : n.add(userId); return n; });
  };

  const toggleAll = () => {
    const selectable = filtered.map(u => u.userId).filter(id => id !== currentUserId);
    const allSelected = selectable.every(id => selected.has(id));
    if (allSelected) setSelected(prev => { const n = new Set(prev); selectable.forEach(id => n.delete(id)); return n; });
    else setSelected(prev => { const n = new Set(prev); selectable.forEach(id => n.add(id)); return n; });
  };

  const filtered = filterRole ? users.filter(u => u.role === filterRole) : users;
  const selectableFiltered = filtered.filter(u => u.userId !== currentUserId);
  const allChecked = selectableFiltered.length > 0 && selectableFiltered.every(u => selected.has(u.userId));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      {message && (
        <p className={`text-sm px-3 py-2 rounded-lg ${isError ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>{message}</p>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="border border-beige-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <span className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
            Delete Selected ({selected.size})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <p className="text-gray-400 p-4">Loading...</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-beige-100">
                <th className="px-3 py-2.5 border-b border-beige-200 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-primary" />
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">User ID</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Role</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Email</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isSelf = u.userId === currentUserId;
                const isChecked = selected.has(u.userId);
                return (
                  <tr key={u.userId} className={`${isChecked ? 'bg-red-50' : 'even:bg-beige-50'} hover:bg-beige-100 transition-colors`}>
                    <td className="px-3 py-2 border-b border-beige-100">
                      {!isSelf && (
                        <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(u.userId)}
                          className="w-4 h-4 accent-red-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 border-b border-beige-100 font-medium">
                      {u.userId} {isSelf && <span className="text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-3 py-2 border-b border-beige-100">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-b border-beige-100 text-gray-600">{u.email}</td>
                    <td className="px-3 py-2 border-b border-beige-100">
                      {!isSelf && (
                        <button onClick={() => handleDelete(u.userId)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'single', label: 'Register User' },
  { key: 'bulk', label: 'Bulk Register' },
  { key: 'manage', label: 'Manage Users' },
];

export default function Register() {
  const [tab, setTab] = useState('single');
  const [refreshKey, setRefreshKey] = useState(0);

  const onDone = () => { setRefreshKey(k => k + 1); };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-6 text-center">User Management</h2>

        {/* Tabs */}
        <div className="flex gap-1 justify-center mb-6 bg-white rounded-xl shadow p-1 w-fit mx-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-beige-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'single' && <SingleRegister onDone={onDone} />}
        {tab === 'bulk' && <BulkRegister onDone={onDone} />}
        {tab === 'manage' && <ManageUsers refreshKey={refreshKey} />}
      </div>
    </div>
  );
}
