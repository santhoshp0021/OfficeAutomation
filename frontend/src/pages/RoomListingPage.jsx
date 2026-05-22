import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

export default function RoomListingPage({ user }) {
  const [rooms, setRooms] = useState([]);
  const [labs, setLabs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState(null);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const period = location.state?.period;
  const currentUser = location.state?.user || user || JSON.parse(localStorage.getItem('user'));

  const fetchFacilities = async () => {
    if (!period?.periodId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [roomRes, labRes] = await Promise.all([
        api.get(`/rooms?periodId=${period.periodId}`),
        api.get(`/labs?periodId=${period.periodId}`)
      ]);
      setRooms(roomRes.data);
      setLabs(labRes.data);
    } catch { setRooms([]); setLabs([]); }
    setLoading(false);
  };

  useEffect(() => { fetchFacilities(); }, [period?.periodId]);

  useEffect(() => {
    if (!currentUser?.userId) return;
    api.get(`/enrollment/courses?userId=${currentUser.userId}`)
      .then(res => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [currentUser?.userId]);

  const handleConfirmBooking = async () => {
    if (!selectedCourse || !currentUser?.userId || !period?.periodId) {
      alert('Please select a course.');
      return;
    }
    try {
      const endpoint = bookingType === 'room' ? '/book-room' : '/book-lab';
      const body = {
        userId: currentUser.userId,
        periodId: period.periodId,
        staffName: selectedCourse.staffName,
        courseCode: selectedCourse.courseCode,
        ...(bookingType === 'room' ? { roomName: bookingTarget.name } : { labName: bookingTarget.name })
      };
      await api.post(endpoint, body);
      alert(`${bookingType === 'room' ? 'Room' : 'Lab'} booked successfully!`);
      setBookingType(null);
      setBookingTarget(null);
      setSelectedCourse(null);
      navigate('/booking');
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />

      {/* Course selection modal */}
      {bookingType && bookingTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="text-center font-bold text-primary text-lg">
              Select Course — {bookingTarget.name}
            </h3>
            <select
              className="border border-beige-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
              value={selectedCourse?.courseCode || ''}
              onChange={e => setSelectedCourse(courses.find(c => c.courseCode === e.target.value) || null)}
            >
              <option value="">-- Select Course --</option>
              {courses.map(c => (
                <option key={c.courseCode} value={c.courseCode}>
                  {c.courseCode} – {c.courseName} ({c.staffName})
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedCourse}
                className="flex-1 bg-primary text-white font-semibold py-2 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => { setBookingType(null); setBookingTarget(null); setSelectedCourse(null); }}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-24 px-4 flex flex-col items-center pb-10">
        <h2 className="text-2xl font-bold text-primary mt-6 mb-6">Room & Lab Listing</h2>
        {period && (
          <p className="text-sm text-gray-500 mb-4">
            Period {period.periodNo} — {period.startTime} to {period.endTime}
          </p>
        )}

        {loading ? (
          <LoadingSpinner message="Loading facilities..." />
        ) : (
          <div className="w-full max-w-5xl flex flex-wrap gap-4 justify-center">
            {rooms.map(room => (
              <FacilityCard
                key={'room-' + room.name}
                name={room.name}
                label="Room"
                free={room.free}
                onBook={() => { setBookingType('room'); setBookingTarget(room); }}
              />
            ))}
            {labs.map(lab => (
              <FacilityCard
                key={'lab-' + lab.name}
                name={lab.name}
                label="Lab"
                free={lab.free}
                onBook={() => { setBookingType('lab'); setBookingTarget(lab); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FacilityCard({ name, label, free, onBook }) {
  return (
    <div className={`rounded-xl border-2 p-5 flex flex-col items-center gap-3 w-44 shadow-sm transition-shadow hover:shadow-md ${
      free ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="font-bold text-primary text-sm text-center">{name}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${free ? 'text-green-700' : 'text-red-600'}`}>
        {free ? 'Free' : 'Occupied'}
      </div>
      {free ? (
        <button
          onClick={onBook}
          className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Book
        </button>
      ) : (
        <button disabled className="bg-gray-300 text-gray-500 text-xs font-semibold px-4 py-1.5 rounded-lg cursor-not-allowed">
          Occupied
        </button>
      )}
    </div>
  );
}
