import { useEffect, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';

function generateTimeSlots(start = '08:00', end = '17:00', interval = 15) {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h < eh || (h === eh && m < em)) {
    const s = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    m += interval; if (m >= 60) { h++; m -= 60; }
    slots.push({ start: s, end: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` });
  }
  return slots;
}

const PERIOD_TIMES = [
  { start: '08:30', end: '09:20' }, { start: '09:25', end: '10:15' },
  { start: '10:30', end: '11:20' }, { start: '11:25', end: '12:15' },
  { start: '13:10', end: '14:00' }, { start: '14:05', end: '14:55' },
  { start: '15:00', end: '15:50' }, { start: '15:55', end: '16:45' },
];

const hallSlots = generateTimeSlots();

function formatDateLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isFutureOrToday(dateStr, slotStart) {
  return new Date(`${dateStr}T${slotStart}:00`) >= new Date();
}

const TYPE_COLORS = {
  room: 'bg-blue-50 border-blue-300 text-blue-700',
  lab: 'bg-purple-50 border-purple-300 text-purple-700',
  projector: 'bg-yellow-50 border-yellow-300 text-yellow-700',
  hall: 'bg-cyan-50 border-cyan-300 text-cyan-700',
};

export default function Dashboard() {
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [facilityUsage, setFacilityUsage] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    api.get('/admin/available-week-dates').then(res => {
      setDateList(res.data);
      const todayStr = formatDateLocal(new Date());
      const init = res.data.includes(todayStr) ? todayStr : res.data[0];
      if (init) setSelectedDate(new Date(init + 'T00:00:00'));
    }).catch(() => setDateList([]));
  }, []);

  useEffect(() => {
    api.get('/allFacilities').then(res => {
      setFacilities(res.data); setFiltered(res.data);
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
    else if (value === 'hall') setFiltered(facilities.filter(f => f.type === 'hall'));
    else setFiltered(facilities);
  };

  const handleFreePeriod = async (facilityName, type, periodNo, userId) => {
    if (!window.confirm(`Free this slot booked by ${userId}?`)) return;
    try {
      await api.post('/admin/free-slot-period', { facilityName, type, date: formatDateLocal(selectedDate), periodNo, userId });
      const res = await api.get('/admin/usage-status', { params: { date: formatDateLocal(selectedDate) } });
      setFacilityUsage(res.data);
    } catch { alert('Failed to free slot'); }
  };

  const handleFreeHall = async (hallName, startTime, endTime, userId) => {
    if (!window.confirm(`Free this hall slot booked by ${userId}?`)) return;
    try {
      await api.post('/admin/free-slot-hall', { hallName, date: formatDateLocal(selectedDate), startTime, endTime, userId });
      const res = await api.get('/admin/usage-status', { params: { date: formatDateLocal(selectedDate) } });
      setFacilityUsage(res.data);
    } catch { alert('Failed to free slot'); }
  };

  const dateStr = selectedDate ? formatDateLocal(selectedDate) : '';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-6 text-center">Admin Dashboard — Facility Usage</h2>

        <div className="flex flex-wrap gap-8 mb-6 items-start px-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Date</label>
            <ReactDatePicker
              selected={selectedDate}
              onChange={d => setSelectedDate(d)}
              includeDates={dateList.map(d => new Date(d + 'T00:00:00'))}
              inline
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
              <option value="hall">Hall</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-10"><LoadingSpinner message="Loading usage data..." /></div>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map(facility => {
              const { name, type } = facility;
              const usage = facilityUsage[name]?.usage || [];
              const timeSlots = type === 'hall' ? hallSlots : PERIOD_TIMES;
              const colorClass = TYPE_COLORS[type] || 'bg-gray-50 border-gray-300 text-gray-700';

              return (
                <div key={name} className={`rounded-xl border-2 p-4 ${colorClass}`}>
                  <h3 className="font-bold text-base mb-3 text-center">{name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot, i) => {
                      const match = type === 'hall'
                        ? usage.find(u => u.startTime <= slot.start && u.endTime >= slot.end)
                        : usage.find(u => u.periodNo === i + 1);
                      const future = isFutureOrToday(dateStr, slot.start);
                      return (
                        <div key={i} className={`relative rounded px-2 py-2 text-xs text-center min-w-[100px] border ${match ? 'bg-red-100 border-red-300' : 'bg-white border-gray-200'}`}>
                          <div className="font-semibold">{slot.start}–{slot.end}</div>
                          <div className={match ? 'text-red-600' : 'text-green-700'}>
                            {match ? (type === 'hall' ? `${match.bookedBy}: ${match.eventName || ''}` : match.bookedBy) : 'Free'}
                          </div>
                          {match && future && (
                            <button
                              className="mt-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors"
                              onClick={() => type === 'hall'
                                ? handleFreeHall(name, slot.start, slot.end, match.bookedBy)
                                : handleFreePeriod(name, type, match.periodNo, match.bookedBy)
                              }
                            >
                              Free
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
