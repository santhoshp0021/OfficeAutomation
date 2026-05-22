import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

function BookingCard({ req, color, title, onDownload, downloadLabel }) {
  const borderClass = color === 'green'
    ? 'border-green-400 bg-green-50'
    : color === 'red'
    ? 'border-red-400 bg-red-50'
    : 'border-gray-300 bg-gray-50';
  const titleClass = color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-700' : 'text-gray-700';
  const labelClass = color === 'green' ? 'text-green-800' : color === 'red' ? 'text-red-800' : 'text-gray-700';

  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col gap-2 shadow-sm min-w-[260px] max-w-[320px] ${borderClass}`}>
      <div className={`font-bold text-lg text-center ${titleClass}`}>{title}</div>
      {req.hallName && <div className="text-sm"><span className={`font-semibold ${labelClass}`}>Hall:</span> {req.hallName}</div>}
      {req.venue && <div className="text-sm"><span className={`font-semibold ${labelClass}`}>Venue:</span> {req.venue}</div>}
      <div className="text-sm"><span className={`font-semibold ${labelClass}`}>Date:</span> {req.date}</div>
      {req.eventName && <div className="text-sm"><span className={`font-semibold ${labelClass}`}>Event:</span> {req.eventName}</div>}
      <div className="text-sm"><span className={`font-semibold ${labelClass}`}>Time:</span> {req.startTime} – {req.endTime}</div>
      <div className="text-sm"><span className={`font-semibold ${labelClass}`}>By:</span> {req.userId}</div>
      <div className="text-sm"><span className={`font-semibold ${labelClass}`}>Status:</span> <span className="font-semibold">{req.status}</span></div>
      <div className="text-xs text-gray-500">At: {new Date(req.bookedAt).toLocaleString()}</div>
      {onDownload && (
        <button onClick={onDownload} className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1.5 rounded-lg transition-colors">
          {downloadLabel || 'Download'}
        </button>
      )}
    </div>
  );
}

function Section({ title, colorClass, items, loading, emptyMsg, renderCard }) {
  return (
    <div className="mb-10 w-full max-w-5xl">
      <h2 className={`text-xl font-bold mb-4 ${colorClass}`}>{title}</h2>
      <div className="bg-white rounded-2xl shadow p-5">
        {loading && <p className="text-gray-400">Loading...</p>}
        {!loading && items.length === 0 && <p className="text-gray-500">{emptyMsg}</p>}
        {!loading && items.length > 0 && (
          <div className="flex flex-wrap gap-5">{items.map(renderCard)}</div>
        )}
      </div>
    </div>
  );
}

export default function Messages() {
  const userId = JSON.parse(localStorage.getItem('user'))?.userId;
  const userRole = JSON.parse(localStorage.getItem('user'))?.role;

  const [hallAccepted, setHallAccepted] = useState([]);
  const [hallRejected, setHallRejected] = useState([]);
  const [hallWithdrawn, setHallWithdrawn] = useState([]);
  const [audiAccepted, setAudiAccepted] = useState([]);
  const [audiRejected, setAudiRejected] = useState([]);
  const [hallLoading, setHallLoading] = useState(true);
  const [audiLoading, setAudiLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setError('User not logged in'); setHallLoading(false); return; }
    const params = { userId };
    Promise.all([
      api.get('/hall-requests', { params: { ...params, status: 'accepted' } }),
      api.get('/hall-requests', { params: { ...params, status: 'rejected' } }),
      api.get('/hall-requests', { params: { ...params, status: 'withdrawn' } }),
    ]).then(([a, r, w]) => {
      setHallAccepted(Array.isArray(a.data) ? a.data : []);
      setHallRejected(Array.isArray(r.data) ? r.data : []);
      setHallWithdrawn(Array.isArray(w.data) ? w.data : []);
    }).catch(() => setError('Could not load hall bookings'))
      .finally(() => setHallLoading(false));

    Promise.all([
      api.get('/audi-requests', { params: { ...params, status: 'accepted' } }),
      api.get('/audi-requests', { params: { ...params, status: 'rejected' } }),
    ]).then(([a, r]) => {
      setAudiAccepted(Array.isArray(a.data) ? a.data : []);
      setAudiRejected(Array.isArray(r.data) ? r.data : []);
    }).catch(() => {})
      .finally(() => setAudiLoading(false));
  }, [userId]);

  const handleHallDownload = (req) => {
    const content = [
      'Hall Booking Receipt',
      `Hall: ${req.hallName}`,
      `Event: ${req.eventName || ''}`,
      `User: ${req.userId}`,
      `Date: ${req.date}`,
      `Time: ${req.startTime} - ${req.endTime}`,
      `Status: ${req.status}`,
      `Booked At: ${new Date(req.bookedAt).toLocaleString()}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `HallReceipt_${req.hallName}_${req.date}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleAudiDownload = (req) => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('To,', 10, 20);
    doc.text('The Office Administration,', 10, 27);
    doc.text('College of Engineering Guindy', 10, 34);
    doc.text('Subject: Request for Auditorium Booking', 10, 50);
    doc.text('Respected Sir/Madam,', 10, 60);
    const body = `I, ${req.userId}, request your approval to use the ${req.venue} on ${req.date} from ${req.startTime} to ${req.endTime} for the event "${req.eventName}".`;
    doc.text(doc.splitTextToSize(body, 180), 10, 70);
    if (req.additionalInfo) {
      doc.text('Additional Information:', 10, 95);
      doc.text(doc.splitTextToSize(req.additionalInfo, 180), 10, 102);
    }
    doc.text('Thank you for your consideration.', 10, 125);
    doc.text(`Sincerely,\n${req.userId}`, 10, 135);
    doc.text(`Status: ${req.status}`, 10, 160);
    doc.text(`Booked At: ${new Date(req.bookedAt).toLocaleString()}`, 10, 170);
    doc.save(`AuditoriumBooking_${req.venue}_${req.date}.pdf`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-primary mt-4 mb-8">My Booking Messages</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <Section title="Accepted Hall Bookings" colorClass="text-green-700" items={hallAccepted} loading={hallLoading}
          emptyMsg="No accepted hall bookings."
          renderCard={req => (
            <BookingCard key={req._id} req={req} color="green" title="Booking Confirmed!"
              onDownload={() => handleHallDownload(req)} downloadLabel="Download Receipt" />
          )} />

        <Section title="Rejected Hall Bookings" colorClass="text-red-700" items={hallRejected} loading={hallLoading}
          emptyMsg="No rejected hall bookings."
          renderCard={req => <BookingCard key={req._id} req={req} color="red" title="Booking Rejected" />} />

        <Section title="Withdrawn Hall Bookings" colorClass="text-gray-700" items={hallWithdrawn} loading={hallLoading}
          emptyMsg="No withdrawn hall bookings."
          renderCard={req => <BookingCard key={req._id} req={req} color="gray" title="Booking Withdrawn" />} />

        {(userRole === 'secretary' || userRole === 'admin') && (
          <>
            <Section title="Accepted Auditorium Bookings" colorClass="text-green-700" items={audiAccepted} loading={audiLoading}
              emptyMsg="No accepted auditorium bookings."
              renderCard={req => (
                <BookingCard key={req._id} req={req} color="green" title="Booking Confirmed!"
                  onDownload={() => handleAudiDownload(req)} downloadLabel="Download Letter" />
              )} />

            <Section title="Rejected Auditorium Bookings" colorClass="text-red-700" items={audiRejected} loading={audiLoading}
              emptyMsg="No rejected auditorium bookings."
              renderCard={req => <BookingCard key={req._id} req={req} color="red" title="Booking Rejected" />} />
          </>
        )}
      </div>
    </div>
  );
}
