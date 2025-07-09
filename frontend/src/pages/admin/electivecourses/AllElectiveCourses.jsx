import React, { useEffect, useState } from "react";
import styles from "./ElectiveCourses.module.css";
import { apiAxios } from "../../../utils/api";
import { FaFilter, FaSearch, FaTimes, FaGraduationCap, FaBook, FaCalendarAlt } from "react-icons/fa";

const AllElectiveCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    semester: "",
  });
  const [filters, setFilters] = useState({ code: "", name: "", semester: "" });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await apiAxios().get("/electives");
      setCourses(res.data);
    } catch (err) {
      console.log(err);
      alert("Failed to fetch elective courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditId(course._id);
    setEditForm({
      code: course.code,
      name: course.name,
      semester: course.semester,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (course) => {
    try {
      await apiAxios().put(`/electives/${course._id}`, editForm);
      setEditId(null);
      fetchCourses();
    } catch (err) {
      console.log(err);
      alert("Failed to update course");
    }
  };

  const handleDelete = async (course) => {
    if (
      window.confirm("Delete this elective course and all related assignments?")
    ) {
      try {
        await apiAxios().delete(`/electives/${course._id}`);
        fetchCourses();
      } catch (err) {
        alert("Failed to delete course");
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ code: "", name: "", semester: "" });
  };

  const filteredCourses = courses.filter((c) => {
    return (
      (filters.code === "" ||
        c.code.toLowerCase().includes(filters.code.toLowerCase())) &&
      (filters.name === "" ||
        c.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.semester === "" ||
        String(c.semester) === String(filters.semester))
    );
  });

  // Calculate statistics
  const totalCourses = courses.length;
  const activeFilters = Object.values(filters).filter(f => f !== "").length;
  const filteredCount = filteredCourses.length;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>All Elective Courses</h1>
      
      {/* Statistics Cards */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{totalCourses}</div>
          <div className={styles.statLabel}>Total Courses</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{filteredCount}</div>
          <div className={styles.statLabel}>Filtered Results</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{activeFilters}</div>
          <div className={styles.statLabel}>Active Filters</div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersTitle}>
          <FaFilter /> Filter Courses
        </div>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FaBook /> Course Code
            </label>
            <input
              type="text"
              name="code"
              placeholder="Enter course code..."
              value={filters.code}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FaGraduationCap /> Course Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter course name..."
              value={filters.name}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FaCalendarAlt /> Semester
            </label>
            <input
              type="number"
              name="semester"
              placeholder="Enter semester (1-8)..."
              value={filters.semester}
              onChange={handleFilterChange}
              min={1}
              max={8}
              className={styles.filterInput}
            />
          </div>
          <button 
            onClick={clearFilters} 
            className={styles.clearFiltersBtn}
            disabled={activeFilters === 0}
          >
            <FaTimes /> Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading courses...</div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateText}>
            {activeFilters > 0 
              ? "No courses match your current filters. Try adjusting your search criteria."
              : "No elective courses found. Add some courses to get started."
            }
          </div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Semester</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course._id}>
                  {editId === course._id ? (
                    <>
                      <td>
                        <input
                          name="code"
                          value={editForm.code}
                          onChange={handleEditChange}
                          required
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          required
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <input
                          name="semester"
                          type="number"
                          min={1}
                          max={8}
                          value={editForm.semester}
                          onChange={handleEditChange}
                          required
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleUpdate(course)}
                            className={`${styles.btn} ${styles.btnSave}`}
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditId(null)}
                            className={`${styles.btn} ${styles.btnCancel}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{course.code}</td>
                      <td>{course.name}</td>
                      <td>{course.semester}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleEdit(course)}
                            className={`${styles.btn} ${styles.btnEdit}`}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(course)}
                            className={`${styles.btn} ${styles.btnDelete}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllElectiveCourses;
