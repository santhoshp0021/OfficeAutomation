import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';

export default function HomePage({ user }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 flex items-center justify-center min-h-screen px-4">
        <div className="bg-white/90 rounded-2xl shadow-lg p-10 max-w-2xl w-full text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Welcome to Anna University Facility Booking System
          </h2>
          <p className="text-base text-gray-600 mb-6">
            Book and manage{' '}
            <span className="text-primary-light font-semibold">Rooms</span>,{' '}
            <span className="text-primary-light font-semibold">Labs</span>,{' '}
            <span className="text-primary-light font-semibold">Halls</span>, and{' '}
            <span className="text-primary-light font-semibold">Projectors</span> with ease.
          </p>
          <div className="inline-block bg-beige-50 rounded-xl px-6 py-3 text-primary font-medium">
            Logged in as: <span className="font-bold">{user?.userId}</span>
            <span className="ml-2 text-xs bg-primary text-white rounded-full px-2 py-0.5 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
