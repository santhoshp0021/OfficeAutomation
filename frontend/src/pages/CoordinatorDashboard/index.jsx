import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { timetableService } from '../../services/timetableService';

const ROOM_INFRA = {
  UG: {
    rooms: [
      ...Array.from({ length: 10 }, (_, i) => `101`.replace('101', `${101 + i}`)),
      ...Array.from({ length: 10 }, (_, i) => `201`.replace('201', `${201 + i}`)),
      ...Array.from({ length: 10 }, (_, i) => `301` .replace('301', `${301 + i}`)),
      ...Array.from({ length: 10 }, (_, i) => `401` .replace('401', `${401 + i}`)),
    ],
    labs: ['Ground Floor Lab', 'Second Floor Lab', 'Third Floor Lab'],
  },
  PG: {
    rooms: ['R1', 'R2'],
    labs: ['First Floor Lab (PG only)'],
    semRoomMap: {
      '1': ['R1' ],
      '2': ['R1'],
      '3': ['R2'],
      '4': ['R2'],
    },
  },
};
const UG_BATCHES = ['N', 'P', 'Q'];

const SEMESTERS = ['1','2','3','4','5','6','7','8'];

const UG_SEM_1_2_ROOMS = ['Class 73', 'Class 74', 'Class 75']; // Red Building
const UG_KP_ROOMS = [
  ...Array.from({ length: 10 }, (_, i) => `${101 + i}`),
  ...Array.from({ length: 10 }, (_, i) => `${201 + i}`),
  ...Array.from({ length: 10 }, (_, i) => `${301 + i}`),
  ...Array.from({ length: 10 }, (_, i) => `${401 + i}`),
];

const PG_SEMESTERS = ['1', '2', '3', '4'];

const RoomAllocationPanel = ({ user }) => {
  const [semesterType, setSemesterType] = useState('Odd');
  const [courseType, setCourseType] = useState('UG');
  const [semester, setSemester] = useState('1');
  const [batch, setBatch] = useState('N');
  const [room, setRoom] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hasDisabledStudents, setHasDisabledStudents] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Fetch allocations on mount and after changes
  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const data = await timetableService.getRoomAllocations();
      console.log('Fetched Room Allocations:', data); // Add this
      setAllocations(data);
    } catch (err) {
      console.error('Error fetching room allocations:', err);
      setError('Failed to fetch room allocations');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;
    try {
      await timetableService.deleteRoomAllocation(id);
      await fetchAllocations();
    } catch (err) {
      setError('Failed to delete allocation');
    }
  };

  const handleEdit = (allocation) => {
    setEditingId(allocation._id);
    setEditData({ ...allocation });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    try {
      await timetableService.updateRoomAllocation(editData._id, editData);
      setEditingId(null);
      setEditData({});
      await fetchAllocations();
    } catch (err) {
      setError('Failed to update allocation');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const getRoomOptions = () => {
    if (
      hasDisabledStudents &&
      courseType === 'UG' &&
      Number(semester) >= 3 &&
      Number(semester) <= 8
    ) {
      return Array.from({ length: 10 }, (_, i) => `${101 + i}`);
    }
    if (courseType === 'UG') {
      if (semester === '1' || semester === '2') {
        return UG_SEM_1_2_ROOMS;
      } else {
        return UG_KP_ROOMS;
      }
    }
    if (courseType === 'PG') {
      if (semester === '1' || semester === '2') {
        return ['R1'];
      } else if (semester === '3' || semester === '4') {
        return ['R2'];
      }
    }
    return [];
  };

  const getBatchOptions = () => {
    if (courseType === 'UG') return UG_BATCHES;
    return [];
  };

  const getSemesterOptions = () => {
    let semesters = [];
    if (courseType === 'UG') semesters = SEMESTERS;
    if (courseType === 'PG') semesters = PG_SEMESTERS;
    return semesters.filter(s => {
      const num = parseInt(s, 10);
      if (semesterType === 'Odd') return num % 2 === 1;
      if (semesterType === 'Even') return num % 2 === 0;
      return true;
    });
  };

  const handleAssign = async () => {
    setError('');
    if (!room) {
      setError('Please select a room.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        courseType,
        semester,
        batch: courseType === 'UG' ? batch : null,
        room,
        assignedBy: user?.email || user?.id || 'coordinator',
        semesterType,
      };
      await timetableService.createRoomAllocation(payload);
      setRoom('');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      await fetchAllocations();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to assign room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg p-6 mt-8">
      <h3 className="text-lg font-semibold mb-4 text-blue-900">Room Allocation Panel</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-black">Semester Type</label>
          <select value={semesterType} onChange={e => {
            setSemesterType(e.target.value);
            const filtered = (courseType === 'UG' ? SEMESTERS : PG_SEMESTERS).filter(s => {
              const num = parseInt(s, 10);
              if (e.target.value === 'Odd') return num % 2 === 1;
              if (e.target.value === 'Even') return num % 2 === 0;
              return true;
            });
            setSemester(filtered[0] || '1');
            setBatch('N');
            setRoom('');
          }} className="w-full rounded border-gray-300 text-black">
            <option value="Odd">Odd</option>
            <option value="Even">Even</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-black">Course Type</label>
          <select value={courseType} onChange={e => {
            setCourseType(e.target.value);
            const filtered = (e.target.value === 'UG' ? SEMESTERS : PG_SEMESTERS).filter(s => {
              const num = parseInt(s, 10);
              if (semesterType === 'Odd') return num % 2 === 1;
              if (semesterType === 'Even') return num % 2 === 0;
              return true;
            });
            setSemester(filtered[0] || '1');
            setBatch('N');
            setRoom('');
          }} className="w-full rounded border-gray-300 text-black">
            <option value="UG">UG</option>
            <option value="PG">PG</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-black">Semester</label>
          <select value={semester} onChange={e => {
            setSemester(e.target.value);
            setBatch('N');
            setRoom('');
          }} className="w-full rounded border-gray-300 text-black">
            {getSemesterOptions().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {courseType === 'UG' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Batch</label>
            <select value={batch} onChange={e => setBatch(e.target.value)} className="w-full rounded border-gray-300 text-black">
              {getBatchOptions().map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        )}
        {courseType === 'UG' && (
          <div className="col-span-1 flex items-center mt-6">
            <input
              id="disabled-students-checkbox"
              type="checkbox"
              checked={hasDisabledStudents}
              onChange={e => setHasDisabledStudents(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="disabled-students-checkbox" className="text-sm text-black">
              Disabled students in batch
            </label>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1 text-black">Room</label>
          <select value={room} onChange={e => setRoom(e.target.value)} className="w-full rounded border-gray-300 text-black">
            <option value="">Select</option>
            {getRoomOptions().map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleAssign} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Assign</button>
        </div>
      </div>
      {/* Allocations Table */}
      <div className="mt-8">
        <h4 className="text-md font-semibold mb-2 text-blue-900">Allocated Rooms</h4>
        <table className="min-w-full bg-white border border-gray-300 text-black">
          <thead>
            <tr>
              <th className="border px-2 py-1">Room</th>
              <th className="border px-2 py-1">Batch</th>
              <th className="border px-2 py-1">Semester</th>
              <th className="border px-2 py-1">Course Type</th>
              <th className="border px-2 py-1">Semester Type</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc) => (
              <tr key={alloc._id}>
                {editingId === alloc._id ? (
                  <>
                    <td className="border px-2 py-1"><input name="room" value={editData.room} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="border px-2 py-1"><input name="batch" value={editData.batch || ''} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="border px-2 py-1"><input name="semester" value={editData.semester} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="border px-2 py-1"><input name="courseType" value={editData.courseType} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="border px-2 py-1"><input name="semesterType" value={editData.semesterType} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="border px-2 py-1">
                      <button onClick={handleEditSave} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Save</button>
                      <button onClick={handleEditCancel} className="bg-gray-400 text-white px-2 py-1 rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-2 py-1">{alloc.room}</td>
                    <td className="border px-2 py-1">{alloc.batch || '-'}</td>
                    <td className="border px-2 py-1">{alloc.semester}</td>
                    <td className="border px-2 py-1">{alloc.courseType}</td>
                    <td className="border px-2 py-1">{alloc.semesterType}</td>
                    <td className="border px-2 py-1">
                      <button onClick={() => handleEdit(alloc)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                      <button onClick={() => handleDelete(alloc._id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {allocations.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-2">No allocations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow z-50 transition-all">Room allocated successfully</div>
      )}
      {error && <div className="text-red-600 mb-2">{error}</div>}
    </div>
  );
};

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateTimetable = () => {
    if (user?.role === 'coordinator') {
      navigate('/timetable-builder');
    } else {
      console.error('User is not authorized as coordinator');
    }
  };

  return (
    <DashboardLayout role="coordinator" title="Coordinator Dashboard">
      <div className="space-y-6">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Timetable Management</h2>
            <button
              onClick={handleCreateTimetable}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Create New Timetable
            </button>
          </div>

          {/* Additional dashboard content can go here */}
          
          {/* Room/Lab Allocation Panel */}
          <RoomAllocationPanel user={user} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorDashboard; 