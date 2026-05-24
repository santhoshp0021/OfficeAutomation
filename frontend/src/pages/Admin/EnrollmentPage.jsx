import { useState, useEffect } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function notify(setMsg, setIsErr, msg, err = false) {
  setMsg(msg); setIsErr(err);
  setTimeout(() => setMsg(''), 5000);
}

// Tag chip with a remove button
function Tag({ label, onRemove, color = 'indigo' }) {
  const styles = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    gray:   'bg-gray-100 border-gray-200 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 border text-xs font-semibold px-2 py-0.5 rounded-full ${styles[color]}`}>
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="opacity-50 hover:opacity-100 hover:text-red-500 font-bold leading-none">×</button>
      )}
    </span>
  );
}

// Small input + Add button for building a list of userIds
function MemberInput({ label, members, onAdd, onRemove, color }) {
  const [input, setInput] = useState('');
  const add = () => {
    const id = input.trim();
    if (id && !members.includes(id)) { onAdd(id); setInput(''); }
  };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <div className="flex flex-wrap gap-1.5 items-center">
        {members.map(id => <Tag key={id} label={id} onRemove={() => onRemove(id)} color={color} />)}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="userId + Enter"
          className="border border-beige-200 rounded px-2 py-0.5 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <button type="button" onClick={add}
          className="bg-primary hover:bg-primary-dark text-white text-xs px-2 py-0.5 rounded transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}

// ── Enrollment builder form ───────────────────────────────────────────────────

function EnrollmentForm({ facultyUsers, onSaved }) {
  const [facultyId, setFacultyId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing enrollment when faculty changes
  useEffect(() => {
    if (!facultyId) { setStaffName(''); setCourses([]); return; }
    api.get('/enrollment/all')
      .then(res => {
        const existing = (res.data || []).find(e => e.facultyId === facultyId);
        if (existing) {
          setStaffName(existing.staffName || '');
          setCourses(existing.courses.map(c => ({
            courseCode: c.courseCode,
            courseName: c.courseName,
            lab: !!c.lab,
            studentReps: [...(c.studentReps || [])],
            students: [...(c.students || [])],
          })));
        } else {
          setStaffName('');
          setCourses([]);
        }
      })
      .catch(() => { setStaffName(''); setCourses([]); });
  }, [facultyId]);

  const addCourse = () =>
    setCourses(prev => [...prev, { courseCode: '', courseName: '', lab: false, studentReps: [], students: [] }]);

  const updateCourse = (idx, field, value) =>
    setCourses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  const removeCourse = idx =>
    setCourses(prev => prev.filter((_, i) => i !== idx));

  const addMember = (courseIdx, field, id) =>
    setCourses(prev => prev.map((c, i) =>
      i !== courseIdx ? c : { ...c, [field]: [...c[field], id] }));

  const removeMember = (courseIdx, field, id) =>
    setCourses(prev => prev.map((c, i) =>
      i !== courseIdx ? c : { ...c, [field]: c[field].filter(x => x !== id) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!facultyId) return notify(setMsg, setIsErr, 'Select a faculty', true);
    if (!staffName.trim()) return notify(setMsg, setIsErr, 'Enter the staff name', true);
    if (courses.length === 0) return notify(setMsg, setIsErr, 'Add at least one course', true);
    for (const c of courses) {
      if (!c.courseCode.trim() || !c.courseName.trim())
        return notify(setMsg, setIsErr, 'Every course needs a code and name', true);
    }
    setSaving(true);
    try {
      await api.post('/enrollment/', { facultyId, staffName: staffName.trim(), courses });
      notify(setMsg, setIsErr, `Enrollment saved for ${facultyId}`);
      onSaved();
    } catch (err) {
      notify(setMsg, setIsErr, err.response?.data?.error || 'Failed to save', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-5">
      <h3 className="font-bold text-primary text-lg">Set Up Faculty Enrollment</h3>

      {msg && (
        <p className={`text-sm px-3 py-2 rounded-lg ${isErr ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>{msg}</p>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Faculty (Login ID)</label>
          <select value={facultyId} onChange={e => setFacultyId(e.target.value)}
            className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">-- Select Faculty --</option>
            {facultyUsers.map(u => <option key={u.userId} value={u.userId}>{u.userId}</option>)}
          </select>
        </div>
        {facultyId && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Staff Name (Display)</label>
            <input
              value={staffName}
              onChange={e => setStaffName(e.target.value)}
              placeholder="e.g. Dr. Smith"
              className="border border-beige-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
      </div>

      {facultyId && (
        <>
          <div className="flex flex-col gap-4">
            {courses.length === 0 && (
              <p className="text-sm text-gray-400">No courses yet — click "Add Course" to begin.</p>
            )}
            {courses.map((course, idx) => (
              <div key={idx} className="border border-beige-200 rounded-xl p-4 bg-beige-50 flex flex-col gap-3">
                {/* Course metadata row */}
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600">Course Code</label>
                    <input value={course.courseCode} onChange={e => updateCourse(idx, 'courseCode', e.target.value)}
                      placeholder="CS101"
                      className="border border-beige-200 rounded px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                    <label className="text-xs font-semibold text-gray-600">Course Name</label>
                    <input value={course.courseName} onChange={e => updateCourse(idx, 'courseName', e.target.value)}
                      placeholder="Data Structures"
                      className="border border-beige-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary/40" />
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <input type="checkbox" checked={course.lab} onChange={e => updateCourse(idx, 'lab', e.target.checked)}
                      className="w-4 h-4 accent-primary" />
                    <label className="text-sm font-semibold text-gray-600">Lab</label>
                  </div>
                  <button type="button" onClick={() => removeCourse(idx)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    Remove
                  </button>
                </div>

                {/* Members */}
                <MemberInput
                  label="Student Reps"
                  members={course.studentReps}
                  onAdd={id => addMember(idx, 'studentReps', id)}
                  onRemove={id => removeMember(idx, 'studentReps', id)}
                  color="purple"
                />
                <MemberInput
                  label="Students"
                  members={course.students}
                  onAdd={id => addMember(idx, 'students', id)}
                  onRemove={id => removeMember(idx, 'students', id)}
                  color="gray"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button type="button" onClick={addCourse}
              className="border border-beige-200 bg-beige-100 hover:bg-beige-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Add Course
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-8 rounded-xl transition-colors">
              {saving ? 'Saving…' : 'Save Enrollment'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── All enrollments view ──────────────────────────────────────────────────────

function AllEnrollments({ enrollments, onDelete }) {
  return (
    <div className="flex flex-col gap-4">
      {enrollments.length === 0 && (
        <p className="text-center text-gray-500">No enrollments yet.</p>
      )}
      {enrollments.map(doc => (
        <div key={doc.facultyId} className="bg-white rounded-xl shadow p-5 border-l-4 border-primary">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-bold text-primary text-base">{doc.staffName}</span>
              <span className="ml-2 text-xs text-gray-400">({doc.facultyId}) · {doc.courses.length} course(s)</span>
            </div>
            <button onClick={() => onDelete(doc.facultyId)}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Delete
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {doc.courses.map((c, i) => (
              <div key={i} className="border border-beige-100 rounded-lg p-3 bg-beige-50">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-primary-light">{c.courseCode}</span>
                  <span className="text-sm text-gray-700">{c.courseName}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.lab ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.lab ? 'Lab' : 'Room'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-semibold text-purple-600 mb-1">
                      Student Reps ({c.studentReps.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.studentReps.length === 0
                        ? <span className="text-xs text-gray-400">—</span>
                        : c.studentReps.map(id => <Tag key={id} label={id} color="purple" />)
                      }
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Students ({c.students.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.students.length === 0
                        ? <span className="text-xs text-gray-400">—</span>
                        : c.students.map(id => <Tag key={id} label={id} color="gray" />)
                      }
                    </div>
                  </div>
                </div>

                {/* Propagation note */}
                {(c.studentReps.length > 0 || c.students.length > 0) && (
                  <p className="text-xs text-gray-400 mt-2 italic">
                    When <strong>{doc.staffName}</strong> or any rep books a room for this course, all {c.students.length} student(s) see it automatically.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function EnrollmentPage() {
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const fetchEnrollments = () =>
    api.get('/enrollment/all')
      .then(r => setAllEnrollments(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAllEnrollments([]));

  useEffect(() => {
    api.get('/users')
      .then(r => setFacultyUsers((r.data || []).filter(u => u.role === 'faculty')))
      .catch(() => setFacultyUsers([]));
    fetchEnrollments();
  }, []);

  const handleDelete = async (facultyId) => {
    if (!window.confirm(`Delete all enrollment for ${facultyId}?`)) return;
    try {
      await api.delete(`/enrollment/${facultyId}`);
      notify(setMsg, setIsErr, `Enrollment deleted for ${facultyId}`);
      fetchEnrollments();
    } catch {
      notify(setMsg, setIsErr, 'Failed to delete', true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10 max-w-4xl mx-auto flex flex-col gap-8">
        <h2 className="text-2xl font-bold text-primary mt-4 text-center">Enrollment Management</h2>

        {msg && (
          <p className={`text-sm px-3 py-2 rounded-lg ${isErr ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>{msg}</p>
        )}

        <EnrollmentForm facultyUsers={facultyUsers} onSaved={fetchEnrollments} />

        <div>
          <h3 className="text-lg font-bold text-primary mb-4">
            All Enrollments <span className="text-sm font-normal text-gray-400">({allEnrollments.length})</span>
          </h3>
          <AllEnrollments enrollments={allEnrollments} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
