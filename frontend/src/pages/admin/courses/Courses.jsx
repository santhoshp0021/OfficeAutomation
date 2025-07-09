import React, { useState, useEffect } from "react";
import "./Courses.css";
import { apiFetch } from '../../../utils/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // Edit states
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    semester: "",
  });

  // Bulk delete state
  const [bulkDeleteSemester, setBulkDeleteSemester] = useState("");
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, nameFilter, codeFilter, semesterFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("http://localhost:5000/api/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(data);
      setError("");
    } catch (err) {
      setError("Failed to fetch courses");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (nameFilter) {
      filtered = filtered.filter((course) =>
        course.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (codeFilter) {
      filtered = filtered.filter((course) =>
        course.code.toLowerCase().includes(codeFilter.toLowerCase())
      );
    }

    if (semesterFilter && semesterFilter !== "") {
      filtered = filtered.filter(
        (course) => course.semester === parseInt(semesterFilter)
      );
    }

    setFilteredCourses(filtered);
  };

  const handleEdit = (course) => {
    setEditingCourse(course._id);
    setEditForm({
      name: course.name,
      code: course.code,
      semester: course.semester,
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await apiFetch(
        `http://localhost:5000/api/courses/${editingCourse}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update course");
      }

      setEditingCourse(null);
      setEditForm({ name: "", code: "", semester: "" });
      fetchCourses();
    } catch (err) {
      setError("Failed to update course");
      console.error("Error updating course:", err);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        const response = await apiFetch(
          `http://localhost:5000/api/courses/${courseId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete course");
        }

        fetchCourses();
      } catch (err) {
        setError("Failed to delete course");
        console.error("Error deleting course:", err);
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
        `Are you sure you want to delete all courses from semester ${bulkDeleteSemester}?`
      )
    ) {
      try {
        const response = await apiFetch(
          `http://localhost:5000/api/courses/semester/${bulkDeleteSemester}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete courses");
        }

        setShowBulkDeleteModal(false);
        setBulkDeleteSemester("");
        fetchCourses();
      } catch (err) {
        setError("Failed to delete courses");
        console.error("Error bulk deleting courses:", err);
      }
    }
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setEditForm({ name: "", code: "", semester: "" });
  };

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div className="courses-container">
      <div className="header">
        <h1>Course Management</h1>
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
            placeholder="Course name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Search by Code:</label>
          <input
            type="text"
            placeholder="Course code..."
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
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

      {/* Courses Table */}
      <div className="table-container">
        <table className="courses-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Code</th>
              <th>Semester</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course, i) => (
              <tr key={course._id}>
                <td>{i + 1} </td>
                <td>
                  {editingCourse === course._id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  ) : (
                    course.name
                  )}
                </td>
                <td>
                  {editingCourse === course._id ? (
                    <input
                      type="text"
                      value={editForm.code}
                      onChange={(e) =>
                        setEditForm({ ...editForm, code: e.target.value })
                      }
                    />
                  ) : (
                    course.code
                  )}
                </td>
                <td>
                  {editingCourse === course._id ? (
                    <select
                      value={editForm.semester}
                      onChange={(e) =>
                        setEditForm({ ...editForm, semester: e.target.value })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  ) : (
                    course.semester
                  )}
                </td>
                <td>
                  {editingCourse === course._id ? (
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
                        onClick={() => handleEdit(course)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course._id)}
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
            <h3>Bulk Delete Courses by Semester</h3>
            <p>
              This will permanently delete all courses from the selected
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

export default Courses;
