import React, { useState, useEffect } from "react";
import "./Students.css";
import { apiFetch } from '../../../utils/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // Edit states
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    id: "",
    batch: "",
    current_semester: "",
    joined_year: "",
  });

  // Bulk delete state
  const [bulkDeleteSemester, setBulkDeleteSemester] = useState("");
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, nameFilter, idFilter, batchFilter, semesterFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("http://localhost:5000/api/students");
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await response.json();
      setStudents(data);
      setError("");
    } catch (err) {
      setError("Failed to fetch students");
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (nameFilter) {
      filtered = filtered.filter((student) =>
        student.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (idFilter) {
      filtered = filtered.filter((student) =>
        student.id.toLowerCase().includes(idFilter.toLowerCase())
      );
    }

    if (batchFilter) {
      filtered = filtered.filter((student) =>
        student.batch.toLowerCase().includes(batchFilter.toLowerCase())
      );
    }

    if (semesterFilter && semesterFilter !== "") {
      filtered = filtered.filter(
        (student) => student.current_semester === parseInt(semesterFilter)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleEdit = (student) => {
    setEditingStudent(student._id);
    setEditForm({
      name: student.name,
      id: student.id,
      batch: student.batch,
      current_semester: student.current_semester,
      joined_year: student.joined_year,
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/students/${editingStudent}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update student");
      }

      setEditingStudent(null);
      setEditForm({
        name: "",
        id: "",
        batch: "",
        current_semester: "",
        joined_year: "",
      });
      fetchStudents();
    } catch (err) {
      setError("Failed to update student");
      console.error("Error updating student:", err);
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/students/${studentId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete student");
        }

        fetchStudents();
      } catch (err) {
        setError("Failed to delete student");
        console.error("Error deleting student:", err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteSemester) {
      setError("Please select a semester");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete all students from semester ${bulkDeleteSemester}?`
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/students/semester/${bulkDeleteSemester}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete students");
        }

        setShowBulkDeleteModal(false);
        setBulkDeleteSemester("");
        fetchStudents();
      } catch (err) {
        setError("Failed to delete students");
        console.error("Error bulk deleting students:", err);
      }
    }
  };

  const cancelEdit = () => {
    setEditingStudent(null);
    setEditForm({
      name: "",
      id: "",
      batch: "",
      current_semester: "",
      joined_year: "",
    });
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="students-container">
      <div className="header">
        <h1>Student Management</h1>
        <button
          className="bulk-delete-btn"
          onClick={() => setShowBulkDeleteModal(true)}
        >
          Bulk Delete by Semester
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Search by Name:</label>
          <input
            type="text"
            placeholder="Student name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Search by ID:</label>
          <input
            type="text"
            placeholder="Student ID..."
            value={idFilter}
            onChange={(e) => setIdFilter(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Filter by Batch:</label>
          <input
            type="text"
            placeholder="Batch..."
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Filter by Semester:</label>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>S.no</th>
              <th>Name</th>
              <th>ID</th>
              <th>Batch</th>
              <th>Current Semester</th>
              <th>Joined Year</th>
              <th>Feedback Given</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, i) => (
              <tr key={student._id}>
                <td>{i + 1}</td>
                <td>
                  {editingStudent === student._id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  ) : (
                    student.name
                  )}
                </td>
                <td>
                  {editingStudent === student._id ? (
                    <input
                      type="text"
                      value={editForm.id}
                      onChange={(e) =>
                        setEditForm({ ...editForm, id: e.target.value })
                      }
                    />
                  ) : (
                    student.id
                  )}
                </td>
                <td>
                  {editingStudent === student._id ? (
                    <input
                      type="text"
                      value={editForm.batch}
                      onChange={(e) =>
                        setEditForm({ ...editForm, batch: e.target.value })
                      }
                    />
                  ) : (
                    student.batch
                  )}
                </td>
                <td>
                  {editingStudent === student._id ? (
                    <select
                      value={editForm.current_semester}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          current_semester: e.target.value,
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  ) : (
                    student.current_semester
                  )}
                </td>
                <td>
                  {editingStudent === student._id ? (
                    <input
                      type="number"
                      value={editForm.joined_year}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          joined_year: e.target.value,
                        })
                      }
                    />
                  ) : (
                    student.joined_year
                  )}
                </td>
                <td>
                  <span
                    className={`feedback-status ${
                      student.isFeedbackGiven ? "given" : "not-given"
                    }`}
                  >
                    {student.isFeedbackGiven ? "Yes" : "No"}
                  </span>
                </td>
                <td>
                  {editingStudent === student._id ? (
                    <div className="action-buttons">
                      <button onClick={handleUpdate} className="save-btn">
                        Save
                      </button>
                      <button onClick={cancelEdit} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(student)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Bulk Delete Students by Semester</h3>
            <p>
              This will permanently delete all students from the selected
              semester.
            </p>
            <div className="modal-content">
              <label>Select Semester:</label>
              <select
                value={bulkDeleteSemester}
                onChange={(e) => setBulkDeleteSemester(e.target.value)}
              >
                <option value="">Choose semester...</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={handleBulkDelete} className="delete-btn">
                Delete All
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
