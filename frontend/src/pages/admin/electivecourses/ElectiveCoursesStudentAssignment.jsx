import React, { useState, useEffect } from "react";
import styles from "./ElectiveCourses.module.css";
import { apiAxios } from '../../../utils/api';
import { FaFilter, FaTimes, FaGraduationCap, FaBook, FaUser, FaIdCard } from "react-icons/fa";

const ElectiveCoursesStudentAssignment = () => {
  const [electiveCourses, setElectiveCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ batch: '', electiveCourseId: '' });
  const [allElectiveCourses, setAllElectiveCourses] = useState([]);
  const [filters, setFilters] = useState({ 
    courseName: '', 
    studentName: '', 
    registerNumber: '', 
    batch: '' 
  });

  useEffect(() => {
    fetchElectiveCourses();
    fetchAllElectiveCourses();
  }, []);

  const fetchElectiveCourses = async () => {
    try {
      setLoading(true);
      const response = await apiAxios().get("/elective-student-assignments");
      setElectiveCourses(response.data);
    } catch (error) {
      console.error("Error fetching elective courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllElectiveCourses = async () => {
    try {
      const response = await apiAxios().get("/electives");
      setAllElectiveCourses(response.data);
    } catch (error) {
      console.error("Error fetching all elective courses:", error);
    }
  };

  const handleEdit = (assignment) => {
    setEditingId(assignment._id);
    setEditForm({
      batch: assignment.student.batch,
      electiveCourseId: assignment.electiveCourse?._id || '',
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (assignment) => {
    try {
      await apiAxios().patch(
        `/elective-student-assignments/${assignment.student.registerNumber}/${assignment.electiveCourse._id}`,
        {
          batch: editForm.batch,
          newElectiveCourseId: editForm.electiveCourseId,
        }
      );
      setEditingId(null);
      fetchElectiveCourses();
    } catch (error) {
      alert("Failed to update assignment");
    }
  };

  const handleDelete = async (assignment) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await apiAxios().delete(
          `/elective-student-assignments/${assignment.student.registerNumber}/${assignment.electiveCourse._id}`
        );
        fetchElectiveCourses();
      } catch (error) {
        alert("Failed to delete assignment");
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ courseName: '', studentName: '', registerNumber: '', batch: '' });
  };

  const filteredAssignments = electiveCourses.filter((assignment) => {
    return (
      (filters.courseName === "" ||
        (assignment.electiveCourse?.name || "").toLowerCase().includes(filters.courseName.toLowerCase())) &&
      (filters.studentName === "" ||
        (assignment.student?.name || "").toLowerCase().includes(filters.studentName.toLowerCase())) &&
      (filters.registerNumber === "" ||
        (assignment.student?.registerNumber || "").toLowerCase().includes(filters.registerNumber.toLowerCase())) &&
      (filters.batch === "" ||
        String(assignment.student?.batch || "") === String(filters.batch))
    );
  });

  // Calculate statistics
  const totalAssignments = electiveCourses.length;
  const activeFilters = Object.values(filters).filter(f => f !== "").length;
  const filteredCount = filteredAssignments.length;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Elective Courses and Students</h1>
      
      {/* Statistics Cards */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{totalAssignments}</div>
          <div className={styles.statLabel}>Total Assignments</div>
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
          <FaFilter /> Filter Assignments
        </div>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FaBook /> Course Name
            </label>
            <input
              type="text"
              name="courseName"
              placeholder="Enter course name..."
              value={filters.courseName}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FaUser /> Student Name
            </label>
            <input
              type="text"
              name="studentName"
              placeholder="Enter student name..."
              value={filters.studentName}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FaIdCard /> Register Number
            </label>
            <input
              type="text"
              name="registerNumber"
              placeholder="Enter register number..."
              value={filters.registerNumber}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FaGraduationCap /> Batch
            </label>
            <input
              type="number"
              name="batch"
              placeholder="Enter batch (1-5)..."
              value={filters.batch}
              onChange={handleFilterChange}
              min={1}
              max={5}
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
          <div className={styles.loadingText}>Loading assignments...</div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateText}>
            {activeFilters > 0 
              ? "No assignments match your current filters. Try adjusting your search criteria."
              : "No elective course assignments found. Create some assignments to get started."
            }
          </div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Student Name</th>
                <th>Register Number</th>
                <th>Batch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => (
                <tr key={assignment._id}>
                  {editingId === assignment._id ? (
                    <>
                      <td>
                        <select
                          name="electiveCourseId"
                          value={editForm.electiveCourseId}
                          onChange={handleEditChange}
                          className={styles.editSelect}
                        >
                          <option value="">Select Course</option>
                          {allElectiveCourses.map((course) => (
                            <option key={course._id} value={course._id}>
                              {course.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{assignment.student?.name || "N/A"}</td>
                      <td>{assignment.student?.registerNumber || "N/A"}</td>
                      <td>
                        <input
                          type="number"
                          name="batch"
                          value={editForm.batch}
                          min="1"
                          max="5"
                          onChange={handleEditChange}
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            onClick={() => handleUpdate(assignment)}
                            className={`${styles.btn} ${styles.btnSave}`}
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className={`${styles.btn} ${styles.btnCancel}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{assignment.electiveCourse?.name || "N/A"}</td>
                      <td>{assignment.student?.name || "N/A"}</td>
                      <td>{assignment.student?.registerNumber || "N/A"}</td>
                      <td>{assignment.student?.batch || "N/A"}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            onClick={() => handleEdit(assignment)}
                            className={`${styles.btn} ${styles.btnEdit}`}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(assignment)}
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

export default ElectiveCoursesStudentAssignment; 