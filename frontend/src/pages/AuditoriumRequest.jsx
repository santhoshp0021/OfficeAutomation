import { useState } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';

const AUDITORIUMS = [
  { name: 'Vivekananda Auditorium', location: 'Block A', capacity: 500, features: ['AC', 'Projector', 'Sound System'] },
  { name: 'Tag Auditorium', location: 'Block B', capacity: 300, features: ['Projector', 'Sound System'] }
];

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const maxDate = new Date(tomorrow); maxDate.setDate(tomorrow.getDate() + 29);
const fmt = d => d.toISOString().split('T')[0];

export default function AuditoriumRequest({ user }) {
  const userId = user?.userId || JSON.parse(localStorage.getItem('user'))?.userId || '';
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', eventName: '', additionalInfo: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (audi) => {
    setSelected(audi);
    setSubmitted(false);
    setError('');
    setPdfFile(null);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') { setError('Only PDF files are allowed.'); setPdfFile(null); return; }
    if (file && file.size > 2 * 1024 * 1024) { setError('PDF must be less than 2MB.'); setPdfFile(null); return; }
    setError(''); setPdfFile(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.endTime <= form.startTime) { setError('End time must be after start time.'); return; }
    if (!pdfFile) { setError('Please upload a supporting PDF (max 2MB).'); return; }
    setError('');
    const fd = new FormData();
    fd.append('userId', userId);
    fd.append('venue', selected.name);
    fd.append('date', form.date);
    fd.append('startTime', form.startTime);
    fd.append('endTime', form.endTime);
    fd.append('eventName', form.eventName);
    fd.append('additionalInfo', form.additionalInfo || '');
    fd.append('pdf', pdfFile);
    try {
      const res = await fetch('/api/audi-request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });
      if (res.ok) { setSubmitted(true); setPdfFile(null); }
      else { const d = await res.json(); setError(d.message || 'Submission failed'); }
    } catch { setError('Something went wrong'); }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 max-w-3xl mx-auto pb-10">
        <h2 className="text-2xl font-bold text-primary mt-6 mb-6 text-center">Auditorium Booking Request</h2>

        <h3 className="text-base font-semibold text-indigo-700 mb-3">Select Auditorium</h3>
        <div className="flex flex-wrap gap-4 mb-8">
          {AUDITORIUMS.map(a => (
            <div
              key={a.name}
              onClick={() => handleSelect(a)}
              className={`rounded-xl border-2 p-5 flex-1 min-w-[240px] cursor-pointer transition-all ${
                selected?.name === a.name
                  ? 'border-indigo-400 bg-indigo-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="font-bold text-indigo-700 mb-1">{a.name}</div>
              <div className="text-sm text-gray-600">Location: {a.location}</div>
              <div className="text-sm text-gray-600">Capacity: {a.capacity}</div>
              <div className="text-sm text-gray-600">Features: {a.features.join(', ')}</div>
              {selected?.name === a.name && <div className="mt-2 text-indigo-600 font-semibold text-sm">Selected</div>}
            </div>
          ))}
        </div>

        {selected && !submitted && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
            <h3 className="font-bold text-primary text-base mb-1">Booking Details — {selected.name}</h3>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange}
                  min={fmt(tomorrow)} max={fmt(maxDate)} required
                  className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Start Time</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required
                  className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">End Time</label>
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required
                  className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Event Name</label>
              <input type="text" name="eventName" value={form.eventName} onChange={handleChange} required
                placeholder="Enter event name"
                className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Additional Information</label>
              <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} rows={3}
                placeholder="Any extra details"
                className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Supporting PDF (max 2MB)</label>
              <input type="file" accept="application/pdf" onChange={handleFileChange}
                className="text-sm" required />
            </div>

            <button type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
              Submit Request
            </button>
          </form>
        )}

        {submitted && (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center mt-4">
            <h3 className="text-green-700 font-bold text-lg mb-2">Request Submitted!</h3>
            <p className="text-gray-600">Your request is awaiting admin approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}
