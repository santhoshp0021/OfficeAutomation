import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Sidebar from '../components/Sidebar';
import Banner from '../components/Banner';
import api from '../utils/api';

function getTodayDayNumber() {
  const d = new Date().getDay();
  return d === 0 ? 1 : d > 5 ? 5 : d;
}

function isFutureOrToday(slotStartTime) {
  if (!slotStartTime) return false;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  return new Date(`${todayStr}T${slotStartTime}:00`) >= now;
}

export default function BookingPage({ user }) {
  const storedUser = user || JSON.parse(localStorage.getItem('user'));
  const isReadOnly = storedUser?.role === 'student';
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holiday, setHoliday] = useState(null);
  const navigate = useNavigate();

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const todayDay = getTodayDayNumber();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  const fetchPeriods = async () => {
    if (!storedUser) return;
    setLoading(true);
    try {
      const res = await api.get(`/weekperiod-details?userId=${storedUser.userId}`);
      let data = Array.isArray(res.data) ? res.data : [];
      const todayPeriods = Array.from({ length: 8 }, (_, i) => {
        const periodNo = i + 1;
        return data.find(p => p.day === todayDay && p.periodNo === periodNo) || {
          periodNo,
          day: todayDay,
          periodId: `${periodNo}-${todayDay}`,
          free: true,
          staffName: '',
          courseCode: '',
          roomNo: '',
          lab: '',
          projector: '',
          startTime: '',
          endTime: ''
        };
      });
      setPeriods(todayPeriods);
    } catch {
      setPeriods([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if today is a holiday
    const todayStr = today.toISOString().split('T')[0];
    api.get('/admin/holidays').then(res => {
      const h = res.data.find(h => h.date === todayStr);
      setHoliday(h || null);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchPeriods(); }, [storedUser?.userId, todayDay]);

  const handleFree = async (period) => {
    setLoading(true);
    try {
      await api.post(`/free-period/${period.periodId}`, { userId: storedUser?.userId });
      await fetchPeriods();
    } catch {
      setLoading(false);
    }
  };

  const handleBookRoom = (period) => navigate('/rooms', { state: { period, user: storedUser } });
  const handleBookProjector = (period) => navigate('/projectorlisting', { state: { period } });

  const facilityLabel = (period) => {
    if (period.roomNo) return `Room: ${period.roomNo}`;
    if (period.lab) return `Lab: ${period.lab}`;
    return '';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 flex flex-col items-center pb-10">
        <h2 className="text-2xl font-bold text-primary mt-6 mb-1">{todayStr}</h2>
        <h3 className="text-base text-primary-light mb-6">
          {isWeekend ? 'No classes today (weekend)' : isReadOnly ? 'Your Timetable for Today' : 'Your Periods for Today'}
        </h3>

        {holiday ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl px-8 py-6 text-center max-w-sm">
            <div className="text-3xl mb-2">🗓️</div>
            <div className="font-bold text-red-700 text-lg">Holiday</div>
            {holiday.label && <div className="text-red-600 mt-1">{holiday.label}</div>}
            <div className="text-gray-500 text-sm mt-2">No bookings today</div>
          </div>
        ) : isWeekend ? null : loading ? (
          <LoadingSpinner message="Loading your periods..." />
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {periods.map(period => {
              const occupied = !period.free;
              const hasProjector = !!period.projector;
              const canAct = isFutureOrToday(period.startTime);

              return (
                <div
                  key={period.periodNo}
                  className={`rounded-xl border-2 p-4 flex flex-col gap-2 shadow-sm transition-shadow ${
                    occupied
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="font-bold text-primary text-base">Period {period.periodNo}</div>
                  {period.startTime && (
                    <div className="text-xs text-gray-500">{period.startTime} – {period.endTime}</div>
                  )}
                  <div className={`text-sm font-semibold ${occupied ? 'text-red-600' : 'text-green-700'}`}>
                    {occupied ? 'Occupied' : 'Free'}
                  </div>
                  {occupied && (
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {period.staffName && <div><b>Staff:</b> {period.staffName}</div>}
                      {period.courseCode && <div><b>Course:</b> {period.courseCode}</div>}
                      {facilityLabel(period) && <div>{facilityLabel(period)}</div>}
                      {period.projector && <div><b>Projector:</b> {period.projector}</div>}
                    </div>
                  )}
                  {canAct && !isReadOnly && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {!occupied ? (
                        <button
                          onClick={() => handleBookRoom(period)}
                          className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Book
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleFree(period)}
                            className="bg-primary-light text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary transition-colors"
                          >
                            Free
                          </button>
                          {!hasProjector && (
                            <button
                              onClick={() => handleBookProjector(period)}
                              className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              + Projector
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
