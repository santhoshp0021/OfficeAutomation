
# Anna University Facility Booking System

Full-stack web app for managing classroom, lab, projector, hall, and auditorium bookings.

- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Auth:** JWT tokens (stored in localStorage)

---

## First-Time Setup

Do this **once** after cloning or pulling fresh.

### 1. Install MongoDB

Download and install MongoDB Community Server from https://www.mongodb.com/try/download/community

During installation, choose **"Install MongoDB as a Service"** so it starts automatically.

To verify it's running, open a terminal and run:
```
mongosh
```
You should see a MongoDB prompt. Type `exit` to quit.

### 2. Install backend dependencies

Open a terminal in the project root:
```
cd backend
npm install
```

### 3. Configure backend environment

Edit `backend/.env` and fill in your Gmail App Password:
```
MAIL_PASS=your_gmail_app_password_here
```

> To get a Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords

### 4. Install frontend dependencies

Open another terminal:
```
cd frontend
npm install
```

---

## Running the App (Every Time)

You need **two terminals** open — one for backend, one for frontend.

### Terminal 1 — Backend

```
cd backend
npm run dev
```

You should see:
```
MongoDB connected
Server running on port 5000
Admin user seeded
```

### Terminal 2 — Frontend

```
cd frontend
npm run dev
```

You should see:
```
Local: http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## Default Login

| Field    | Value    |
|----------|----------|
| User ID  | admin    |
| Password | admin123 |

The admin account is created automatically on first run. **Change this password after first login** by registering a new admin.

---

## User Roles

| Role         | Access                                              |
|--------------|-----------------------------------------------------|
| admin        | Full access: register users, manage facilities, view dashboard, approve requests |
| secretary    | Approve hall/audi requests, view messages           |
| faculty      | Book rooms/labs/projectors, book halls (with approval), view own periods |
| student_rep  | Same as faculty — facility-wise booking, hall booking, messages |
| student      | View booking status only                            |

---

## Project Structure

```
OfficeAutomation/
├── backend/
│   ├── .env                  ← environment variables (never commit this)
│   ├── server.js             ← main Express server
│   ├── utils.js              ← week calculation helpers
│   ├── middleware/
│   │   └── auth.js           ← JWT auth middleware
│   ├── models/               ← Mongoose schemas
│   │   ├── User.js
│   │   ├── Facility.js
│   │   ├── Weektable.js
│   │   ├── Period.js
│   │   ├── Timetable.js
│   │   ├── HallRequest.js
│   │   ├── AuditoriumRequest.js
│   │   ├── BookingHistory.js
│   │   └── Enrollment.js
│   └── routes/               ← API route handlers
│       ├── adminRoutes.js
│       ├── availabilityRoutes.js
│       ├── bookRoutes.js
│       ├── facilityRoutes.js
│       ├── hallRoutes.js
│       ├── audiRoutes.js
│       ├── enrollmentRoutes.js
│       └── facultyRoutes.js
│
└── frontend/
    ├── src/
    │   ├── utils/api.js      ← axios instance with JWT interceptor
    │   ├── components/
    │   │   ├── Banner.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── LoadingSpinner.jsx
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── HomePage.jsx
    │       ├── BookingPage.jsx       ← faculty period booking
    │       ├── RoomListingPage.jsx
    │       ├── ProjectorListingPage.jsx
    │       ├── HallListingPage.jsx
    │       ├── AuditoriumRequest.jsx
    │       ├── FacilitywiseBooking.jsx
    │       ├── Messages.jsx
    │       └── Admin/
    │           ├── Register.jsx      ← create users
    │           ├── Dashboard.jsx     ← view/free all facility slots
    │           ├── Requestspage.jsx  ← approve/reject hall & audi requests
    │           ├── Historypage.jsx   ← booking history + CSV export
    │           ├── Facilities.jsx    ← add/edit/delete facilities
    │           ├── EnrollmentPage.jsx← enroll faculty in courses
    │           └── TimeTable.jsx     ← drag-and-drop timetable builder
    └── tailwind.config.js
```

---

## Admin Workflow (Quick Start)

1. Login as `admin` / `admin123`
2. **Facilities** → Add rooms, labs, projectors, halls
3. **Enrollment** → Enroll each faculty user with their courses
4. **Timetable** → Build the 40-period timetable for each faculty user
5. **Register** → Create faculty/student/secretary accounts
6. Faculty can now log in and book rooms for their periods

---

## API Base URL

All frontend API calls go to `/api` (proxied to `http://localhost:5000` by Vite).

The Vite proxy config is in `frontend/vite.config.js`. If the backend runs on a different port, update it there.
