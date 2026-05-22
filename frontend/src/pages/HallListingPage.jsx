import { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

function generateTimeSlots(start = '08:00', end = '17:00', interval = 15) {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h < eh || (h === eh && m < em)) {
    const s = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    m += interval;
    if (m >= 60) { h++; m -= 60; }
    const e = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    slots.push({ start: s, end: e });
  }
  return slots;
}

function getWorkingDays(fromDate, toDate) {
  const days = [];
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      const y = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
      days.push(`${y}-${mo}-${dd}`);
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function isFutureOrToday(dateStr, slotStartTime) {
  return new Date(`${dateStr}T${slotStartTime}:00`) >= new Date();
}

const slots = generateTimeSlots();

export default function HallListingPage({ user }) {
  const currentUser = user || JSON.parse(localStorage.getItem('user'));
  const userId = currentUser?.userId || '';
  const isStudentRep = currentUser?.role === 'student_rep';

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + (isStudentRep ? 6 : 60));
  const regularDays = getWorkingDays(today, maxDate);

  const [dates, setDates] = useState(regularDays);
  const [halls, setHalls] = useState([]);
  const [selectedDate, setSelectedDate] = useState(regularDays[0] || '');

  // Merge special Saturdays into date list
  useEffect(() => {
    api.get('/admin/special-days').then(res => {
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const future = res.data
        .map(s => s.date)
        .filter(d => {
          if (d < todayStr) return false;
          if (isStudentRep) {
            const diff = (new Date(d + 'T12:00:00') - today) / 86400000;
            return diff <= 6;
          }
          return true;
        });
      const merged = [...new Set([...regularDays, ...future])].sort();
      setDates(merged);
      if (!merged.includes(selectedDate)) setSelectedDate(merged[0] || '');
    }).catch(() => {});
  }, []);
  const [hallBookings, setHallBookings] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const [eventNames, setEventNames] = useState({});
  const [pdfFiles, setPdfFiles] = useState({});

  useEffect(() => {
    api.get('/allFacilities')
      .then(res => setHalls(res.data.filter(f => f.type === 'hall')))
      .catch(() => setHalls([]));
  }, []);

  useEffect(() => {
    halls.forEach(hall => fetchBookings(hall.name, selectedDate));
  }, [selectedDate, halls]);

  const fetchBookings = async (hallName, date) => {
    try {
      const res = await api.get(`/hall-requests/slots?hallName=${encodeURIComponent(hallName)}&date=${date}`);
      setHallBookings(prev => ({ ...prev, [hallName]: { ...prev[hallName], [date]: res.data } }));
    } catch {
      setHallBookings(prev => ({ ...prev, [hallName]: { ...prev[hallName], [date]: [] } }));
    }
  };

  const isSlotBooked = (hallName, date, slot) => {
    return (hallBookings[hallName]?.[date] || []).find(b =>
      (b.startTime <= slot.start && b.endTime >= slot.start) ||
      (b.startTime >= slot.start && b.endTime <= slot.end)
    );
  };

  const handleSlotToggle = (hallName, slot) => {
    const current = selectedSlots[hallName] || [];
    const idx = current.findIndex(s => s.start === slot.start);
    const updated = idx > -1
      ? current.filter((_, i) => i !== idx)
      : [...current, slot].sort((a, b) => a.start.localeCompare(b.start));
    setSelectedSlots(prev => ({ ...prev, [hallName]: updated }));
  };

  const areSlotsContinuous = (slts) => {
    for (let i = 0; i < slts.length - 1; i++) {
      if (slts[i].end !== slts[i+1].start) return false;
    }
    return true;
  };

  const handleConfirmBooking = async (hallName) => {
    const selected = selectedSlots[hallName];
    const eventName = eventNames[hallName];
    const pdf = pdfFiles[hallName];
    if (!selected?.length || !eventName?.trim() || !areSlotsContinuous(selected) || !pdf) {
      alert('Select continuous slots, provide an event name, and upload a PDF.');
      return;
    }
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('hallName', hallName);
    formData.append('date', selectedDate);
    formData.append('startTime', selected[0].start);
    formData.append('endTime', selected[selected.length-1].end);
    formData.append('eventName', eventName);
    formData.append('pdf', pdf);
    try {
      const res = await fetch('/api/hall-request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Booking failed'); return; }
      alert(`Request sent for ${hallName} on ${selectedDate}`);
      fetchBookings(hallName, selectedDate);
      setSelectedSlots(p => ({ ...p, [hallName]: [] }));
      setEventNames(p => ({ ...p, [hallName]: '' }));
      setPdfFiles(p => ({ ...p, [hallName]: null }));
    } catch { alert('Error connecting to server'); }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-6 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-4 text-center">Hall Booking</h2>

        {/* Date selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
          {dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${
                date === selectedDate
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-primary border-beige-200 hover:bg-beige-50'
              }`}
            >
              {date}
            </button>
          ))}
        </div>

        {halls.length === 0 && (
          <p className="text-center text-gray-500">No halls available. Ask admin to add hall facilities.</p>
        )}

        {halls.map(hall => {
          const sel = selectedSlots[hall.name] || [];
          const continuous = areSlotsContinuous(sel);
          const valid = sel.length > 0 && continuous && (eventNames[hall.name] || '').trim() && pdfFiles[hall.name];

          return (
            <div key={hall.name} className="bg-white rounded-xl shadow p-5 mb-6">
              <h3 className="text-lg font-bold text-primary mb-3">{hall.name}</h3>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {slots.map(slot => {
                  const booked = isSlotBooked(hall.name, selectedDate, slot);
                  const isSelected = sel.some(s => s.start === slot.start);
                  return (
                    <div
                      key={slot.start}
                      onClick={() => !booked && isFutureOrToday(selectedDate, slot.start) && handleSlotToggle(hall.name, slot)}
                      className={`px-2 py-1.5 text-xs rounded border text-center min-w-[90px] transition-colors ${
                        booked
                          ? 'bg-red-400 text-white border-red-400 cursor-not-allowed'
                          : isSelected
                          ? 'bg-green-200 border-green-500 cursor-pointer'
                          : isFutureOrToday(selectedDate, slot.start)
                          ? 'bg-white border-beige-200 cursor-pointer hover:bg-beige-50'
                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div>{slot.start}</div>
                      <div className="text-[10px]">{booked ? `${booked.userId}` : 'Free'}</div>
                    </div>
                  );
                })}
              </div>

              {sel.length > 0 && (
                <div className="flex flex-wrap gap-3 items-center mt-3 pt-3 border-t border-beige-100">
                  <input
                    type="text"
                    placeholder="Event Name"
                    value={eventNames[hall.name] || ''}
                    onChange={e => setEventNames(p => ({ ...p, [hall.name]: e.target.value }))}
                    className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 flex-1 min-w-[180px]"
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setPdfFiles(p => ({ ...p, [hall.name]: e.target.files[0] }))}
                    className="text-sm"
                  />
                  <button
                    onClick={() => handleConfirmBooking(hall.name)}
                    disabled={!valid}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                      valid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Confirm Booking
                  </button>
                  {!continuous && sel.length > 1 && (
                    <p className="text-xs text-red-500 w-full">Slots must be continuous</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
