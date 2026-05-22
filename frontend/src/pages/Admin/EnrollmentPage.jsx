import { useState, useEffect } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

export default function EnrollmentPage() {
  const [userId, setUserId] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [staffName, setStaffName] = useState('');
  const [lab, setLab] = useState(false);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editCourse, setEditCourse] = useState({ courseCode: '', courseName: '', staffName: '', lab: false });
  const [allEnrollments, setAllEnrollments] = useState([]);

  const notify = (msg, err = false) => { setMessage(msg); setIsError(err); };

  const fetchEnrollments = async () => {
    try {
      const res = await api.get('/enrollment/all');
      setAllEnrollments(res.data);
    } catch { setAllEnrollments([]); }
  };

  useEffect(() => { fetchEnrollments(); }, []);

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!courseCode || !courseName || !staffName) return;
    setCourses(prev => [...prev, { courseCode, courseName, staffName, lab }]);
    setCourseCode(''); setCourseName(''); setStaffName(''); setLab(false);
  };

  const handleEditSave = (idx) => {
    setCourses(prev => prev.map((c, i) => i === idx ? { ...editCourse } : c));
    setEditIdx(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || courses.length === 0) { notify('Enter User ID and add at least one course.', true); return; }
    try {
      await api.post('/enrollment/', { userId, enrolled: courses });
      notify('Enrollment successful!');
      setCourses([]); setUserId('');
      fetchEnrollments();
    } catch (err) { notify(err.response?.data?.error || 'Error enrolling.', true); }
  };

  const handleDelete = async (delUserId) => {
    if (!window.confirm(`Delete enrollment for ${delUserId}?`)) return;
    try {
      await api.delete(`/enrollment/${delUserId}`);
      notify('Enrollment deleted.');
      fetchEnrollments();
    } catch { notify('Failed to delete.', true); }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-6 text-center">Enrollment Management</h2>

        <div className="bg-white rounded-2xl shadow p-6 mb-8 max-w-4xl mx-auto">
          <h3 className="text-base font-bold text-primary mb-4">Enroll User in Courses</h3>

          {message && (
            <p className={`text-sm px-3 py-2 rounded-lg mb-4 ${isError ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
              {message}
            </p>
          )}

          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">User ID</label>
              <input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Enter user ID" required
                className="border border-beige-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 max-w-xs" />
            </div>

            <div className="border border-beige-100 rounded-xl p-4 bg-beige-50">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Add Course</h4>
              <form onSubmit={handleAddCourse} className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <label className="text-xs font-semibold text-gray-600">Course Code</label>
                  <input value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="CS101"
                    className="border border-beige-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <label className="text-xs font-semibold text-gray-600">Course Name</label>
                  <input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Data Structures"
                    className="border border-beige-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="flex flex-col gap-1 min-w-[130px]">
                  <label className="text-xs font-semibold text-gray-600">Staff Name</label>
                  <input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Dr. Smith"
                    className="border border-beige-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <input type="checkbox" checked={lab} onChange={e => setLab(e.target.checked)} className="w-4 h-4 accent-primary" />
                  <label className="text-sm font-semibold text-gray-600">Lab</label>
                </div>
                <button type="submit"
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Add Course
                </button>
              </form>
            </div>

            {courses.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-beige-100">
                      {['Code','Name','Staff','Lab',''].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-beige-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c, idx) => editIdx === idx ? (
                      <tr key={idx} className="bg-blue-50">
                        <td className="px-2 py-1 border-b border-beige-100">
                          <input value={editCourse.courseCode} onChange={e => setEditCourse(p => ({...p, courseCode: e.target.value}))}
                            className="border border-beige-200 rounded px-2 py-1 text-sm w-24" />
                        </td>
                        <td className="px-2 py-1 border-b border-beige-100">
                          <input value={editCourse.courseName} onChange={e => setEditCourse(p => ({...p, courseName: e.target.value}))}
                            className="border border-beige-200 rounded px-2 py-1 text-sm w-36" />
                        </td>
                        <td className="px-2 py-1 border-b border-beige-100">
                          <input value={editCourse.staffName} onChange={e => setEditCourse(p => ({...p, staffName: e.target.value}))}
                            className="border border-beige-200 rounded px-2 py-1 text-sm w-28" />
                        </td>
                        <td className="px-2 py-1 border-b border-beige-100">
                          <input type="checkbox" checked={!!editCourse.lab} onChange={e => setEditCourse(p => ({...p, lab: e.target.checked}))}
                            className="w-4 h-4 accent-primary" />
                        </td>
                        <td className="px-2 py-1 border-b border-beige-100">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditSave(idx)}
                              className="bg-primary hover:bg-primary-dark text-white text-xs px-2 py-1 rounded">Save</button>
                            <button onClick={() => setEditIdx(null)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={idx} className="even:bg-beige-50">
                        <td className="px-3 py-2 border-b border-beige-100">{c.courseCode}</td>
                        <td className="px-3 py-2 border-b border-beige-100">{c.courseName}</td>
                        <td className="px-3 py-2 border-b border-beige-100">{c.staffName}</td>
                        <td className="px-3 py-2 border-b border-beige-100">
                          <span className={c.lab ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>{c.lab ? 'Yes' : 'No'}</span>
                        </td>
                        <td className="px-3 py-2 border-b border-beige-100">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditIdx(idx); setEditCourse({...c}); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">Edit</button>
                            <button onClick={() => setCourses(prev => prev.filter((_,i) => i !== idx))}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded">Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-center mt-2">
              <button type="button" onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-8 rounded-xl transition-colors">
                Submit Enrollment
              </button>
            </div>
          </div>
        </div>

        {/* All Enrollments */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-bold text-primary mb-4">All Enrollments</h3>
          {allEnrollments.length === 0 ? (
            <p className="text-center text-gray-500">No enrollments found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {allEnrollments.map((enroll, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-primary">{enroll.userId}</div>
                    <button onClick={() => handleDelete(enroll.userId)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {enroll.enrolled.map((c, i) => (
                      <div key={i} className="bg-beige-50 border border-beige-200 rounded-lg px-3 py-2 min-w-[160px]">
                        <div className="font-semibold text-primary-light text-sm">{c.courseCode}</div>
                        <div className="text-sm text-gray-700">{c.courseName}</div>
                        <div className="text-xs text-gray-500">Staff: {c.staffName}</div>
                        <div className={`text-xs font-semibold mt-1 ${c.lab ? 'text-green-700' : 'text-gray-500'}`}>
                          {c.lab ? 'Lab' : 'Room'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
