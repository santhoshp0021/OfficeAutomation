import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const FILTERS = [
  { key: 'all',            label: 'All' },
  { key: 'hall-accepted',  label: 'Hall Accepted' },
  { key: 'hall-rejected',  label: 'Hall Rejected' },
  { key: 'hall-withdrawn', label: 'Hall Withdrawn' },
  { key: 'audi-accepted',  label: 'Audi Accepted' },
  { key: 'audi-rejected',  label: 'Audi Rejected' },
];

function statusColor(status) {
  if (status === 'accepted') return { border: 'border-green-400 bg-green-50', title: 'text-green-700', badge: 'bg-green-100 text-green-700' };
  if (status === 'rejected') return { border: 'border-red-400 bg-red-50',   title: 'text-red-700',   badge: 'bg-red-100 text-red-700' };
  return                            { border: 'border-gray-300 bg-gray-50',  title: 'text-gray-700',  badge: 'bg-gray-100 text-gray-600' };
}

function downloadHallPDF(req) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Hall Booking Confirmation', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Your hall booking request has been approved.', 105, 30, { align: 'center' });

  doc.setDrawColor(200);
  doc.line(10, 38, 200, 38);
  doc.setTextColor(0);

  const rows = [
    ['Booking Reference', req._id],
    ['Hall',              req.hallName],
    ['Event',             req.eventName || '—'],
    ['Date',              req.date],
    ['Time',              `${req.startTime} – ${req.endTime}`],
    ['Booked By',         req.userId],
    ['Status',            'CONFIRMED'],
    ['Booked At',         new Date(req.bookedAt).toLocaleString()],
  ];

  let y = 48;
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 70, y);
    y += 10;
  });

  doc.setDrawColor(200);
  doc.line(10, y + 2, 200, y + 2);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Please carry this receipt when using the hall. This is a system-generated document.', 105, y + 10, { align: 'center' });

  doc.save(`HallBookingReceipt_${req.hallName}_${req.date}.pdf`);
}

function downloadAudiPDF(req) {
  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.text('To,', 10, 20);
  doc.text('The Office Administration,', 10, 27);
  doc.text('College of Engineering Guindy', 10, 34);
  doc.text('Subject: Auditorium Booking — ' + req.status.toUpperCase(), 10, 50);
  doc.text('Respected Sir/Madam,', 10, 60);
  const body = `I, ${req.userId}, request your approval to use the ${req.venue} on ${req.date} from ${req.startTime} to ${req.endTime} for the event "${req.eventName}".`;
  doc.text(doc.splitTextToSize(body, 180), 10, 70);
  if (req.additionalInfo) {
    doc.text('Additional Information:', 10, 95);
    doc.text(doc.splitTextToSize(req.additionalInfo, 180), 10, 102);
  }
  doc.text(`Status: ${req.status.toUpperCase()}`, 10, 130);
  doc.text(`Booked At: ${new Date(req.bookedAt).toLocaleString()}`, 10, 140);
  doc.save(`AuditoriumBooking_${req.venue}_${req.date}.pdf`);
}

function BookingCard({ item }) {
  const c = statusColor(item.status);
  const isHall = item.type === 'hall';
  const title = item.status === 'accepted' ? 'Booking Confirmed' : item.status === 'rejected' ? 'Booking Rejected' : 'Booking Withdrawn';

  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col gap-2 shadow-sm min-w-[260px] max-w-[320px] ${c.border}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.badge}`}>
          {isHall ? 'Hall' : 'Auditorium'}
        </span>
        <span className={`text-xs font-semibold ${c.title}`}>{title}</span>
      </div>
      {item.hallName && <div className="text-sm"><span className="font-semibold">Hall:</span> {item.hallName}</div>}
      {item.venue    && <div className="text-sm"><span className="font-semibold">Venue:</span> {item.venue}</div>}
      <div className="text-sm"><span className="font-semibold">Date:</span> {item.date}</div>
      {item.eventName && <div className="text-sm"><span className="font-semibold">Event:</span> {item.eventName}</div>}
      <div className="text-sm"><span className="font-semibold">Time:</span> {item.startTime} – {item.endTime}</div>
      <div className="text-sm"><span className="font-semibold">By:</span> {item.userId}</div>
      <div className="text-xs text-gray-400">At: {new Date(item.bookedAt).toLocaleString()}</div>
      {item.status === 'accepted' && (
        <button
          onClick={() => isHall ? downloadHallPDF(item) : downloadAudiPDF(item)}
          className="mt-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors"
        >
          Download Receipt
        </button>
      )}
    </div>
  );
}

export default function Messages() {
  const userId   = JSON.parse(localStorage.getItem('user'))?.userId;
  const [filter, setFilter] = useState('all');
  const [items,  setItems]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]  = useState('');

  useEffect(() => {
    if (!userId) { setError('User not logged in'); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.get('/hall-requests', { params: { userId, status: 'accepted'  } }),
      api.get('/hall-requests', { params: { userId, status: 'rejected'  } }),
      api.get('/hall-requests', { params: { userId, status: 'withdrawn' } }),
      api.get('/audi-requests', { params: { userId, status: 'accepted'  } }),
      api.get('/audi-requests', { params: { userId, status: 'rejected'  } }),
    ]).then(([ha, hr, hw, aa, ar]) => {
      const tag = (arr, type, status) =>
        (Array.isArray(arr.data) ? arr.data : []).map(r => ({ ...r, type, filterKey: `${type}-${status}` }));
      setItems([
        ...tag(ha, 'hall', 'accepted'),
        ...tag(hr, 'hall', 'rejected'),
        ...tag(hw, 'hall', 'withdrawn'),
        ...tag(aa, 'audi', 'accepted'),
        ...tag(ar, 'audi', 'rejected'),
      ].sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)));
    }).catch(() => setError('Could not load bookings'))
      .finally(() => setLoading(false));
  }, [userId]);

  const visible = filter === 'all' ? items : items.filter(i => i.filterKey === filter);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-primary mt-4 mb-6">My Booking Messages</h1>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-beige-200 hover:bg-beige-50'
              }`}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({items.filter(i => i.filterKey === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {error   && <p className="text-red-600 mb-4">{error}</p>}
        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && !error && visible.length === 0 && (
          <p className="text-gray-500 mt-8">No bookings found for this filter.</p>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="flex flex-wrap gap-5 justify-center w-full max-w-5xl">
            {visible.map(item => <BookingCard key={item._id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}
