import { useEffect, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Sidebar from '../components/Sidebar';
import Banner from '../components/Banner';
import api from '../utils/api';

const PERIOD_TIMES = [
  { start: '08:30', end: '09:20' },
  { start: '09:25', end: '10:15' },
  { start: '10:30', end: '11:20' },
  { start: '11:25', end: '12:15' },
  { start: '13:10', end: '14:00' },
  { start: '14:05', end: '14:55' },
  { start: '15:00', end: '15:50' },
  { start: '15:55', end: '16:45' },
];

const TYPE_LABELS = { room: 'Room', lab: 'Lab', projector: 'Projector' };

function formatDateLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isFutureOrToday(dateStr, slotStart) {
  return new Date(`${dateStr}T${slotStart}:00`) >= new Date();
}

function withinWeekFromToday(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = (target - today) / 86400000;
  return diff >= 0 && diff <= 6;
}

export default function FacilityWiseBooking() {
  const user = JSON.parse(localStorage.getItem('user'));
  const isStudentRep = user?.role === 'student_rep';

  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [facilityUsage, setFacilityUsage] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    api.get('/admin/available-week-dates').then(res => {
      const all = res.data;
      const filtered = isStudentRep ? all.filter(withinWeekFromToday) : all;
      setDateList(filtered);
      const todayStr = formatDateLocal(new Date());
      const init = filtered.includes(todayStr) ? todayStr : filtered[0];
      if (init) setSelectedDate(new Date(init + 'T00:00:00'));
    }).catch(() => setDateList([]));
  }, []);

  useEffect(() => {
    api.get('/allFacilities').then(res => {
      const allowed = res.data.filter(f => ['room','lab','projector'].includes(f.type));
      setFacilities(allowed);
      setFiltered(allowed);
    }).catch(() => setFacilities([]));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    api.get('/admin/usage-status', { params: { date: formatDateLocal(selectedDate) } })
      .then(res => setFacilityUsage(res.data))
      .catch(() => setFacilityUsage({}))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const handleTypeChange = (value) => {
    setSelectedType(value);
    if (value === 'kp') setFiltered(facilities.filter(f => f.type === 'room' && f.name.startsWith('KP')));
    else if (value === 'dept') setFiltered(facilities.filter(f => f.type === 'room' && !f.name.startsWith('KP')));
    else if (value === 'lab') setFiltered(facilities.filter(f => f.type === 'lab'));
    else if (value === 'projector') setFiltered(facilities.filter(f => f.type === 'projector'));
    else setFiltered(facilities);
  };

  const handleBook = async (facilityName, type, idx) => {
    const dateStr = formatDateLocal(selectedDate);
    try {
      await api.post('/faculty/facilities/book', {
        date: dateStr, slot: idx, facility: facilityName, type, userId: user.userId
      });
      alert(`${facilityName} booked for ${dateStr} - Period ${idx + 1}`);
      const res = await api.get('/admin/usage-status', { params: { date: dateStr } });
      setFacilityUsage(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    }
  };

  const dateStr = selectedDate ? formatDateLocal(selectedDate) : '';

  const typeColorClass = { room: 'bg-blue-50 border-blue-300', lab: 'bg-purple-50 border-purple-300', projector: 'bg-yellow-50 border-yellow-300' };
  const typeTextClass = { room: 'text-blue-700', lab: 'text-purple-700', projector: 'text-yellow-700' };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-6 text-center">Facility-wise Booking</h2>

        <div className="flex flex-wrap gap-8 mb-6 items-start px-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Date</label>
            <ReactDatePicker
              selected={selectedDate}
              onChange={d => setSelectedDate(d)}
              includeDates={dateList.map(d => new Date(d + 'T00:00:00'))}
              inline
              calendarStartDay={1}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Facility Type</label>
            <select
              value={selectedType}
              onChange={e => handleTypeChange(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-48"
            >
              <option value="">All</option>
              <option value="kp">KP Room</option>
              <option value="dept">Department Room</option>
              <option value="lab">Lab</option>
              <option value="projector">Projector</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(fac => {
              const usage = facilityUsage[fac.name]?.usage || [];
              const label = fac.type === 'room' ? (fac.name.startsWith('KP') ? 'KP Room' : 'Dept Room') : TYPE_LABELS[fac.type];
              return (
                <div key={fac.name} className={`rounded-xl border-2 p-4 ${typeColorClass[fac.type] || 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-bold mb-3 text-center ${typeTextClass[fac.type]}`}>{label} — {fac.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {PERIOD_TIMES.map((p, idx) => {
                      const match = usage.find(u => u.periodNo === idx + 1);
                      const future = isFutureOrToday(dateStr, p.start);
                      return (
                        <div key={idx} className={`rounded-lg px-2 py-2 text-xs text-center min-w-[100px] border ${match ? 'bg-red-100 border-red-300' : 'bg-white border-gray-200'}`}>
                          <div className="font-semibold">P{idx+1}</div>
                          <div className="text-gray-500">{p.start}–{p.end}</div>
                          <div className={match ? 'text-red-600 font-medium' : 'text-green-700'}>{match ? match.bookedBy : 'Free'}</div>
                          {!match && future && (
                            <button
                              onClick={() => handleBook(fac.name, fac.type, idx)}
                              className="mt-1 bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded hover:bg-primary-dark transition-colors"
                            >
                              Book
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-gray-500">No facilities found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
