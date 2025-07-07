
---

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd api
   npm install
   ```

2. **Configure environment variables:**
   - Create a `.env` file in the `api/` directory with:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=5000
     ```

3. **Start the backend server:**
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:5000`.

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd student-feedback-grievance
   npm install
   ```

2. **Start the frontend development server:**
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000` and proxy API requests to the backend.

---

## User Roles & Features

### Student

- **Login:** Use your student ID and password (see password hint on login page).
- **Submit Feedback:** Fill out feedback forms for your courses and faculty.
- **File Grievance:** Submit grievances regarding academic or campus issues.
- **View Notifications:** See updates from faculty/admin.
- **Track Submissions:** View status of submitted feedback and grievances.

### Faculty

- **Login:** Use your faculty ID and password (see password hint on login page).
- **Dashboard:** View your assigned courses and batches.
- **Performance Analytics:** See feedback analytics, yearly performance charts, and question-wise ratings.
- **Download Reports:** Export feedback/performance as PDF.
- **Notifications:** Receive updates from admin.

### Admin

- **Login:** Use admin credentials provided by the system.
- **Dashboard:** Overview of all students, faculty, courses, feedback, and grievances.
- **Manage Users:** Add/edit/delete students and faculty.
- **Assign Courses:** Assign faculty to courses and manage electives.
- **View Analytics:** Access all feedback and grievance analytics, including charts and reports.
- **Notifications:** Send notifications to students and faculty.

---

## API Overview

The backend exposes RESTful endpoints for:

- **Authentication:** `/api/auth/login`, `/api/auth/password-hint/:id/:role`
- **Students:** `/api/students/`, `/api/grievance/`, `/api/feedback/`
- **Faculty:** `/api/faculties/`, `/api/feedback/faculty/yearly/:id`, etc.
- **Admin:** `/api/courses/`, `/api/assignments/`, `/api/notifications/`, etc.

All endpoints require authentication via JWT (token is stored in localStorage and sent in headers).

---

## Troubleshooting

- **MongoDB Connection:** Ensure your MongoDB URI is correct and the database is running.
- **CORS Issues:** The backend uses CORS middleware; if you encounter CORS errors, check your frontend and backend URLs.
- **Port Conflicts:** Make sure ports 3000 (frontend) and 5000 (backend) are free or update them in your `.env` and React proxy settings.
- **Password Issues:** Use the "Forgot Password" or "Password Hint" feature on the login page for help.

---

## License

This project is for educational and institutional use. Please contact the maintainers for other usage.

---

**For any issues or feature requests, please open an issue or contact the project maintainers.**
