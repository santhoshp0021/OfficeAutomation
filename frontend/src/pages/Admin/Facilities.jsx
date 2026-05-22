import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

const FACILITY_TYPES = ['room', 'lab', 'projector', 'hall'];

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [mode, setMode] = useState('');
  const [newFacility, setNewFacility] = useState({ name: '', type: 'room', bookable: true });
  const [editIdx, setEditIdx] = useState(null);
  const [editBookable, setEditBookable] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fetchFacilities = async () => {
    try {
      const res = await api.get('/Facilities');
      setFacilities(res.data);
    } catch { setFacilities([]); }
  };

  useEffect(() => { fetchFacilities(); }, []);

  const notify = (msg, err = false) => { setMessage(msg); setIsError(err); setTimeout(() => setMessage(''), 3000); };

  const addFacility = async () => {
    if (!newFacility.name.trim()) return;
    try {
      await api.post('/facilities', newFacility);
      setNewFacility({ name: '', type: 'room', bookable: true });
      fetchFacilities();
      notify('Facility added successfully!');
    } catch (err) { notify(err.response?.data?.message || 'Failed to add facility', true); }
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/facilities/${id}`, { bookable: editBookable });
      setEditIdx(null);
      fetchFacilities();
      notify('Facility updated!');
    } catch { notify('Failed to update facility', true); }
  };

  const deleteFacility = async (id) => {
    if (!window.confirm('Delete this facility?')) return;
    try {
      await api.delete(`/facilities/${id}`);
      fetchFacilities();
      notify('Facility deleted.');
    } catch { notify('Failed to delete', true); }
  };

  const modeBtn = (m, label) => (
    <button
      onClick={() => setMode(mode === m ? '' : m)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
        mode === m ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-beige-200 hover:bg-beige-50'
      }`}
    >{label}</button>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-beige-50 to-beige-100">
      <Banner />
      <Sidebar />
      <div className="pt-24 px-4 pb-10">
        <h2 className="text-2xl font-bold text-primary mt-4 mb-6 text-center">Facility Management</h2>

        <div className="flex gap-3 justify-center mb-6 flex-wrap">
          {modeBtn('add', '+ Add Facility')}
          {modeBtn('edit', 'Edit Bookable')}
          {modeBtn('delete', 'Delete Facility')}
        </div>

        {message && (
          <p className={`text-sm text-center mb-4 px-3 py-2 rounded-lg ${isError ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
            {message}
          </p>
        )}

        {mode && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-beige-100">
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Type</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Bookable</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mode === 'add' && (
                  <tr className="bg-yellow-50">
                    <td className="px-4 py-2 border-b border-beige-100 font-semibold text-primary">New</td>
                    <td className="px-4 py-2 border-b border-beige-100">
                      <input value={newFacility.name} onChange={e => setNewFacility(f => ({ ...f, name: e.target.value }))}
                        placeholder="Facility name"
                        className="border border-beige-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-36" />
                    </td>
                    <td className="px-4 py-2 border-b border-beige-100">
                      <select value={newFacility.type} onChange={e => setNewFacility(f => ({ ...f, type: e.target.value }))}
                        className="border border-beige-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                        {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2 border-b border-beige-100">
                      <input type="checkbox" checked={newFacility.bookable}
                        onChange={e => setNewFacility(f => ({ ...f, bookable: e.target.checked }))}
                        className="w-4 h-4 accent-primary" />
                    </td>
                    <td className="px-4 py-2 border-b border-beige-100">
                      <button onClick={addFacility}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        Add
                      </button>
                    </td>
                  </tr>
                )}
                {mode !== 'add' && facilities.map((f, idx) => (
                  <tr key={f._id} className="even:bg-beige-50 hover:bg-beige-100 transition-colors">
                    <td className="px-4 py-2 border-b border-beige-100 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 border-b border-beige-100 font-medium">{f.name}</td>
                    <td className="px-4 py-2 border-b border-beige-100 capitalize">{f.type}</td>
                    <td className="px-4 py-2 border-b border-beige-100">
                      {mode === 'edit' && editIdx === idx ? (
                        <input type="checkbox" checked={editBookable}
                          onChange={e => setEditBookable(e.target.checked)}
                          className="w-4 h-4 accent-primary" />
                      ) : (
                        <span className={f.bookable ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                          {f.bookable ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-b border-beige-100">
                      {mode === 'edit' ? (
                        editIdx === idx ? (
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(f._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Save</button>
                            <button onClick={() => setEditIdx(null)}
                              className="bg-gray-400 hover:bg-gray-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditIdx(idx); setEditBookable(f.bookable); }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                        )
                      ) : mode === 'delete' ? (
                        <button onClick={() => deleteFacility(f._id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!mode && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-beige-100">
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Type</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-beige-200">Bookable</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f, idx) => (
                  <tr key={f._id} className="even:bg-beige-50">
                    <td className="px-4 py-2 border-b border-beige-100 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 border-b border-beige-100 font-medium">{f.name}</td>
                    <td className="px-4 py-2 border-b border-beige-100 capitalize">{f.type}</td>
                    <td className="px-4 py-2 border-b border-beige-100">
                      <span className={f.bookable ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                        {f.bookable ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
                {facilities.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-400">No facilities found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
