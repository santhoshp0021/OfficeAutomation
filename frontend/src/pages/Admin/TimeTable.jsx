import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

const DAY_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };

const PERIOD_TIMES = [
  { startTime: '08:30', endTime: '09:20' }, { startTime: '09:25', endTime: '10:15' },
  { startTime: '10:30', endTime: '11:20' }, { startTime: '11:25', endTime: '12:15' },
  { startTime: '13:10', endTime: '14:00' }, { startTime: '14:05', endTime: '14:55' },
  { startTime: '15:00', endTime: '15:50' }, { startTime: '15:55', endTime: '16:45' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PERIODS = 40;

function getDayAndPeriod(idx) {
  return { day: Math.floor(idx / 8) + 1, periodNo: (idx % 8) + 1 };
}

// ── Special Working Days tab ──────────────────────────────────────────────────

function SpecialDaysTab() {
  const [days, setDays] = useState([]);
  const [date, setDate] = useState('');
  const [followsDay, setFollowsDay] = useState('');
  const [label, setLabel] = useState('');
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const fetchDays = () => api.get('/admin/special-days').then(r => setDays(r.data)).catch(() => {});
  useEffect(() => { fetchDays(); }, []);

  const notify = (m, err = false) => { setMsg(m); setIsErr(err); setTimeout(() => setMsg(''), 4000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!date) return notify('Select a date', true);
    const d = new Date(date + 'T12:00:00');
    if (d.getDay() !== 6) return notify('Only Saturdays can be special working days', true);
    try {
      await api.post('/admin/special-days', {
        date,
        followsDay: followsDay ? parseInt(followsDay) : null,
        label
      });
      notify('Special day added');
      setDate(''); setFollowsDay(''); setLabel('');
      fetchDays();
    } catch (err) { notify(err.response?.data?.error || 'Failed', true); }
  };

  const handleRemove = async (d) => {
    if (!window.confirm(`Remove special day ${d}?`)) return;
    await api.delete(`/admin/special-days/${d}`);
    fetchDays();
  };

  // Get next 12 Saturdays for quick pick
  const saturdays = [];
  const cur = new Date();
  while (saturdays.length < 12) {
    if (cur.getDay() === 6) saturdays.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`);
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {msg && <p className={`text-sm px-3 py-2 rounded-lg ${isErr ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>{msg}</p>}

      <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <h3 className="font-bold text-primary text-lg">Add Special Working Saturday</h3>

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Date (must be a Saturday)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {saturdays.map(s => (
                <button key={s} type="button" onClick={() => setDate(s)}
                  className={`px-2 py-1 text-xs rounded-lg border transition-colors ${date === s ? 'bg-primary text-white border-primary' : 'bg-white border-beige-200 hover:bg-beige-50'}`}>
                  {s}
                </button>
              ))}
            </div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Follows whose timetable?</label>
            <select value={followsDay} onChange={e => setFollowsDay(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">No timetable (open — all facilities free)</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{DAY_NAMES[n]}'s timetable</option>)}
            </select>
            <p className="text-xs text-gray-400">
              {followsDay
                ? `Period slots will reflect ${DAY_NAMES[followsDay]}'s schedule`
                : 'All 8 period slots available with no timetable restrictions'}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Note (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Compensatory for Diwali holiday"
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded-xl transition-colors w-fit">
            Add Special Day
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-bold text-primary text-lg mb-4">Scheduled Special Days</h3>
        {days.length === 0 ? (
          <p className="text-gray-400 text-sm">No special working days configured.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-beige-100">
                {['Date', 'Follows', 'Note', 'Action'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-beige-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(d => (
                <tr key={d.date} className="even:bg-beige-50 hover:bg-beige-100">
                  <td className="px-3 py-2 border-b border-beige-100 font-medium">{d.date}</td>
                  <td className="px-3 py-2 border-b border-beige-100">
                    {d.followsDay ? <span className="text-indigo-700 font-semibold">{DAY_NAMES[d.followsDay]}'s schedule</span> : <span className="text-gray-400">Open (no timetable)</span>}
                  </td>
                  <td className="px-3 py-2 border-b border-beige-100 text-gray-500">{d.label || '—'}</td>
                  <td className="px-3 py-2 border-b border-beige-100">
                    <button onClick={() => handleRemove(d.date)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Timetable builder tab ─────────────────────────────────────────────────────

function TimetableTab() {
  const [enrollments, setEnrollments] = useState([]);
  const [userId, setUserId] = useState('');
  const [courses, setCourses] = useState([]);
  const [defaultRoom, setDefaultRoom] = useState('');
  const [defaultLab, setDefaultLab] = useState('');
  const [periods, setPeriods] = useState(Array(PERIODS).fill(null));
  const [editIdx, setEditIdx] = useState(null);
  const [editRoom, setEditRoom] = useState('');
  const [editLab, setEditLab] = useState('');
  const [dragCourseIdx, setDragCourseIdx] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('/enrollment/all')
      .then(res => setEnrollments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEnrollments([]));
  }, []);

  useEffect(() => {
    if (!userId) return;
    api.get(`/enrollment/courses?userId=${userId}`)
      .then(res => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCourses([]));
    setPeriods(Array(PERIODS).fill(null));
    setSubmitted(false);
  }, [userId]);

  const assignCourse = (periodIdx, course) => {
    const { day, periodNo } = getDayAndPeriod(periodIdx);
    setPeriods(prev => prev.map((p, i) => i !== periodIdx ? p : {
      ...course, free: false,
      roomNo: course.lab ? '' : defaultRoom,
      lab: course.lab ? defaultLab : '',
      periodNo, day,
      periodId: `${periodNo}-${day}`,
      startTime: PERIOD_TIMES[periodNo - 1].startTime,
      endTime: PERIOD_TIMES[periodNo - 1].endTime,
    }));
  };

  const removeCourse = idx => setPeriods(prev => prev.map((p, i) => i === idx ? null : p));

  const saveEdit = idx => {
    setPeriods(prev => prev.map((p, i) => i === idx ? { ...p, roomNo: editRoom, lab: editLab } : p));
    setEditIdx(null);
  };

  const handleSubmit = async () => {
    if (!userId) { alert('Please select a user.'); return; }
    const filled = periods.map((p, idx) => {
      const { day, periodNo } = getDayAndPeriod(idx);
      return p || {
        periodNo, day, periodId: `${periodNo}-${day}`, free: true,
        roomNo: '', lab: '', staffName: '', courseCode: '',
        startTime: PERIOD_TIMES[periodNo - 1].startTime,
        endTime: PERIOD_TIMES[periodNo - 1].endTime,
      };
    });
    try {
      await api.post('/timetable', { userId, periods: filled });
      setSubmitted(true);
      alert('Timetable submitted!');
    } catch (err) { alert(err.response?.data?.error || 'Failed to submit timetable'); }
  };

  return (
    <div className="pt-4 px-4 pb-10">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">Build Timetable</h2>

        <div className="bg-white rounded-2xl shadow p-6 mb-6 max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Select User</label>
              <select value={userId} onChange={e => setUserId(e.target.value)}
                className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[160px]">
                <option value="">-- Select User --</option>
                {enrollments.map(e => <option key={e.facultyId} value={e.facultyId}>{e.facultyId}</option>)}
              </select>
            </div>
            {userId && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Default Room</label>
                  <input value={defaultRoom} onChange={e => setDefaultRoom(e.target.value)} placeholder="e.g. CS-101"
                    className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-32" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Default Lab</label>
                  <input value={defaultLab} onChange={e => setDefaultLab(e.target.value)} placeholder="e.g. CS Lab 1"
                    className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-32" />
                </div>
              </>
            )}
          </div>

          {userId && courses.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-700 mb-2">Courses — drag to assign</h4>
              <div className="flex flex-wrap gap-2">
                {courses.map((c, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => setDragCourseIdx(i)}
                    className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700 cursor-grab active:cursor-grabbing select-none"
                  >
                    {c.courseCode} — {c.courseName} ({c.lab ? 'Lab' : 'Room'})
                  </div>
                ))}
              </div>
            </div>
          )}

          {userId && (
            <>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-1 min-w-[700px]">
                  {/* Header: day labels */}
                  {DAYS.map((day, di) => (
                    <div key={day} className={`col-span-1 ${di === 0 ? 'col-start-1' : ''} font-bold text-xs text-center text-primary py-1`}>
                      {/* placeholder for column header logic below */}
                    </div>
                  ))}

                  {Array.from({ length: PERIODS }).map((_, idx) => {
                    const { day, periodNo } = getDayAndPeriod(idx);
                    const p = periods[idx];
                    return (
                      <div
                        key={idx}
                        onDrop={e => {
                          e.preventDefault();
                          if (dragCourseIdx !== null) { assignCourse(idx, courses[dragCourseIdx]); setDragCourseIdx(null); }
                        }}
                        onDragOver={e => e.preventDefault()}
                        className={`min-h-[90px] rounded-lg border p-1.5 text-xs transition-colors ${
                          p ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-beige-50'
                        }`}
                      >
                        <div className="font-bold text-gray-600">{DAYS[day-1]} P{periodNo}</div>
                        <div className="text-[10px] text-gray-400 mb-1">{PERIOD_TIMES[periodNo-1].startTime}–{PERIOD_TIMES[periodNo-1].endTime}</div>
                        {p ? (
                          editIdx === idx ? (
                            <div>
                              <input value={editRoom} onChange={e => setEditRoom(e.target.value)} placeholder="Room"
                                className="border rounded px-1 py-0.5 text-xs w-full mb-1" />
                              <input value={editLab} onChange={e => setEditLab(e.target.value)} placeholder="Lab"
                                className="border rounded px-1 py-0.5 text-xs w-full mb-1" />
                              <button onClick={() => saveEdit(idx)} className="bg-primary text-white text-[10px] px-2 py-0.5 rounded mr-1">Save</button>
                              <button onClick={() => setEditIdx(null)} className="bg-gray-400 text-white text-[10px] px-2 py-0.5 rounded">✕</button>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-primary truncate">{p.courseCode}</div>
                              <div className="text-gray-500 truncate">{p.staffName}</div>
                              {p.roomNo && <div className="text-gray-400">R: {p.roomNo}</div>}
                              {p.lab && <div className="text-gray-400">L: {p.lab}</div>}
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => { setEditIdx(idx); setEditRoom(p.roomNo || ''); setEditLab(p.lab || ''); }}
                                  className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">Edit</button>
                                <button onClick={() => removeCourse(idx)}
                                  className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">✕</button>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="text-gray-300 text-center mt-2">Free</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 text-center">
                <button onClick={handleSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-8 rounded-xl transition-colors">
                  Submit Timetable
                </button>
                {submitted && <p className="text-green-700 font-semibold mt-2">Timetable submitted successfully!</p>}
              </div>
            </>
          )}
        </div>
    </div>
  );
}

// ── Holidays / Off Days tab ───────────────────────────────────────────────────

function HolidaysTab() {
  const [holidays, setHolidays] = useState([]);
  const [mode, setMode] = useState('single'); // 'single' | 'range'
  const [singleDate, setSingleDate] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo]     = useState('');
  const [label, setLabel]         = useState('');
  const [msg, setMsg]             = useState('');
  const [isErr, setIsErr]         = useState(false);

  const fetchHolidays = () =>
    api.get('/admin/holidays').then(r => setHolidays(r.data)).catch(() => {});

  useEffect(() => { fetchHolidays(); }, []);

  const notify = (m, err = false) => {
    setMsg(m); setIsErr(err); setTimeout(() => setMsg(''), 4000);
  };

  // Expand a date range into individual YYYY-MM-DD strings
  const expandRange = (from, to) => {
    const dates = [];
    const cur = new Date(from + 'T12:00:00');
    const end = new Date(to   + 'T12:00:00');
    while (cur <= end) {
      const y = cur.getFullYear(), m = String(cur.getMonth()+1).padStart(2,'0'), d = String(cur.getDate()).padStart(2,'0');
      dates.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    let dates = [];
    if (mode === 'single') {
      if (!singleDate) return notify('Select a date', true);
      dates = [singleDate];
    } else {
      if (!rangeFrom || !rangeTo) return notify('Select both from and to dates', true);
      if (rangeFrom > rangeTo) return notify('From date must be before To date', true);
      dates = expandRange(rangeFrom, rangeTo);
    }
    try {
      const res = await api.post('/admin/holidays', { dates, label });
      notify(`Added ${res.data.added.length} holiday(s)${res.data.skipped.length ? `, ${res.data.skipped.length} already existed` : ''}`);
      setSingleDate(''); setRangeFrom(''); setRangeTo(''); setLabel('');
      fetchHolidays();
    } catch (err) { notify(err.response?.data?.error || 'Failed', true); }
  };

  const handleRemove = async (date) => {
    await api.delete(`/admin/holidays/${date}`);
    setHolidays(prev => prev.filter(h => h.date !== date));
  };

  const handleRemoveAll = async () => {
    if (!window.confirm(`Remove all ${holidays.length} holidays?`)) return;
    await Promise.all(holidays.map(h => api.delete(`/admin/holidays/${h.date}`)));
    setHolidays([]);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {msg && (
        <p className={`text-sm px-3 py-2 rounded-lg ${isErr ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>{msg}</p>
      )}

      <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <h3 className="font-bold text-primary text-lg">Mark Holiday / Off Day</h3>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {[['single', 'Single Day'], ['range', 'Date Range']].map(([m, lbl]) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${mode === m ? 'bg-primary text-white border-primary' : 'bg-white border-beige-200 text-gray-600 hover:bg-beige-50'}`}>
              {lbl}
            </button>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          {mode === 'single' ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Date</label>
              <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)}
                className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          ) : (
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">From</label>
                <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)}
                  className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">To</label>
                <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)}
                  className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Label (optional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Diwali, Summer vacation, Public holiday"
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <button type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors w-fit">
            Mark as Holiday
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-primary text-lg">Scheduled Holidays ({holidays.length})</h3>
          {holidays.length > 1 && (
            <button onClick={handleRemoveAll}
              className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
              Remove All
            </button>
          )}
        </div>
        {holidays.length === 0 ? (
          <p className="text-gray-400 text-sm">No holidays configured.</p>
        ) : (
          <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-beige-200">
            {holidays.map((h, i) => (
              <div key={h.date}
                className={`flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-beige-50'}`}>
                <div>
                  <span className="font-semibold text-sm text-gray-800">{h.date}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(h.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  {h.label && <span className="ml-2 text-xs text-primary-light">— {h.label}</span>}
                </div>
                <button onClick={() => handleRemove(h.date)}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold transition-colors">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Weektable Generation tab ──────────────────────────────────────────────────

function WeektableGenTab() {
  const [tillDate, setTillDate] = useState('');
  const [coverage, setCoverage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const notify = (m, err = false) => { setMsg(m); setIsErr(err); setTimeout(() => setMsg(''), 5000); };

  useEffect(() => {
    api.get('/admin/weektable-coverage')
      .then(r => setCoverage(r.data.latestWeekStart))
      .catch(() => {});
  }, [result]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!tillDate) return notify('Select a till date', true);
    const today = new Date().toISOString().slice(0, 10);
    if (tillDate < today) return notify('Till date must be today or in the future', true);
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/admin/generate-weektables', { tillDate });
      setResult(res.data);
      notify(`Done — ${res.data.created} new weektable(s) created, ${res.data.skipped} already existed`);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to generate', true);
    } finally {
      setLoading(false);
    }
  };

  const coverageDate = coverage ? new Date(coverage).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }) : null;

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {msg && (
        <p className={`text-sm px-3 py-2 rounded-lg ${isErr ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>{msg}</p>
      )}

      <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-5">
        <h3 className="font-bold text-primary text-lg">Generate Weektables</h3>

        <div className="bg-beige-50 border border-beige-200 rounded-xl px-4 py-3 text-sm">
          <span className="font-semibold text-gray-700">Current coverage: </span>
          {coverageDate
            ? <span className="text-indigo-700 font-semibold">up to week of {coverageDate}</span>
            : <span className="text-gray-400">none yet</span>
          }
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Generate up to (till date)</label>
            <input
              type="date"
              value={tillDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setTillDate(e.target.value)}
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-gray-400">
              Weektables will be created for all users from the current week through the week containing this date.
              Weeks that already have weektables are skipped safely.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors w-fit"
          >
            {loading ? 'Generating…' : 'Generate Weektables'}
          </button>
        </form>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm flex flex-col gap-1">
            <p className="font-semibold text-green-700">Generation complete</p>
            <p className="text-gray-700">Users: <span className="font-semibold">{result.users}</span></p>
            <p className="text-gray-700">New weektables created: <span className="font-semibold text-green-700">{result.created}</span></p>
            <p className="text-gray-700">Already existed (skipped): <span className="font-semibold text-gray-500">{result.skipped}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export with tabs ─────────────────────────────────────────────────────

export default function TimeTable() {
  const [tab, setTab] = useState('timetable');
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <div className="flex gap-1 justify-center mb-6 bg-white rounded-xl shadow p-1 w-fit mx-auto flex-wrap">
          {[
            ['timetable', 'Build Timetable'],
            ['weektables', 'Generate Weektables'],
            ['special', 'Special Working Days'],
            ['holidays', 'Holidays / Off Days'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-beige-50'}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'timetable'  && <TimetableTab />}
        {tab === 'weektables' && <WeektableGenTab />}
        {tab === 'special'    && <SpecialDaysTab />}
        {tab === 'holidays'   && <HolidaysTab />}
      </div>
    </div>
  );
}
