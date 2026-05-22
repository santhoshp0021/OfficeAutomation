import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    close();
    navigate('/');
  };

  if (!user) return null;

  const isFaculty = ['faculty'].includes(user.role);
  const isSecretary = ['secretary'].includes(user.role);
  const isStudentRep = ['student_rep'].includes(user.role);
  const isStudent = user.role === 'student';
  const isAdmin = user.role === 'admin';

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-5 left-5 z-[1200] flex flex-col gap-1.5 p-1 bg-transparent border-none cursor-pointer"
        aria-label="Toggle Sidebar"
      >
        <span className="block w-7 h-1 bg-primary-light rounded" />
        <span className="block w-7 h-1 bg-primary-light rounded" />
        <span className="block w-7 h-1 bg-primary-light rounded" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[1099]"
          onClick={close}
        />
      )}

      {/* Sidebar panel */}
      <nav
        className={`fixed top-0 left-0 h-full w-56 bg-beige-50 border-r border-beige-100 shadow-lg z-[1100] flex flex-col pt-20 px-4 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <p className="text-primary font-bold text-lg text-center mb-6 tracking-wide">Menu</p>
        <ul className="list-none p-0 m-0 flex flex-col gap-1 flex-1">
          <NavItem to="/home" onClick={close}>Home</NavItem>

          {(isFaculty || isSecretary || isStudentRep) && (
            <NavItem to="/facilitywiseBooking" onClick={close}>Facilitywise Booking</NavItem>
          )}
          {isStudentRep && (
            <NavItem to="/booking" onClick={close}>My Bookings</NavItem>
          )}
          {(isFaculty || isSecretary || isStudentRep) && (
            <NavItem to="/halls" onClick={close}>Halls</NavItem>
          )}
          {isSecretary && (
            <NavItem to="/auditorium" onClick={close}>Auditorium</NavItem>
          )}
          {(isFaculty || isSecretary || isStudentRep) && (
            <NavItem to="/messages" onClick={close}>Messages</NavItem>
          )}

          {isStudent && (
            <NavItem to="/booking" onClick={close}>My Timetable</NavItem>
          )}

          {isAdmin && (<>
            <NavItem to="/requests" onClick={close}>Requests</NavItem>
            <NavItem to="/history" onClick={close}>History</NavItem>
            <NavItem to="/dashboard" onClick={close}>Dashboard</NavItem>
            <NavItem to="/facilities" onClick={close}>Facilities</NavItem>
            <NavItem to="/enrollment" onClick={close}>Enrollment</NavItem>
            <NavItem to="/timetable" onClick={close}>Timetable</NavItem>
            <NavItem to="/register" onClick={close}>Register</NavItem>
          </>)}
        </ul>

        <button
          onClick={handleSignOut}
          className="mt-auto mb-6 w-full text-left px-4 py-2.5 rounded-lg text-primary font-medium hover:bg-beige-100 transition-colors"
        >
          Sign Out
        </button>
      </nav>
    </>
  );
}

function NavItem({ to, onClick, children }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className="block px-4 py-2.5 rounded-lg text-primary font-medium hover:bg-beige-100 transition-colors text-sm"
      >
        {children}
      </Link>
    </li>
  );
}
