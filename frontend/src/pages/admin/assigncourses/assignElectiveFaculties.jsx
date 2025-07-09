import React, { useEffect, useState } from "react";
import styles from "./assigncourses.module.css";
import { apiFetch } from "../../../utils/api";

const AssignElectiveFaculties = () => {
  const [assignments, setAssignments] = useState([]);
  const [electiveCourses, setElectiveCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    electiveCourse: "",
    faculty: "",
    batch: 1,
  });
  const [editingAssignment, setEditingAssignment] = useState(null);

  useEffect(() => {
    fetchElectiveCourses();
    fetchFaculties();
    fetchAssignments();
  }, []);

  const fetchElectiveCourses = async () => {
    try {
      const res = await apiFetch("http://localhost:5000/api/electives");
      const data = await res.json();
      setElectiveCourses(data);
    } catch (err) {
      setElectiveCourses([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await apiFetch("http://localhost:5000/api/faculties");
      const data = await res.json();
      setFaculties(data);
    } catch (err) {
      setFaculties([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await apiFetch("http://localhost:5000/api/electiveCourseFacultyAssignment");
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      setAssignments([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (!form.electiveCourse || !form.faculty) {
      setError("Please select both elective course and faculty");
      setLoading(false);
      return;
    }
    const payload = {
      electiveCourse: form.electiveCourse,
      faculty: form.faculty,
      batch: form.batch,
    };
    try {
      const response = await apiFetch(
        "http://localhost:5000/api/electiveCourseFacultyAssignment/assign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        setSuccess("Faculty assigned to elective course successfully!");
        setForm({ electiveCourse: "", faculty: "", batch: 1 });
        fetchAssignments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to assign faculty");
      }
    } catch (err) {
      setError("An error occurred while assigning faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(
        `http://localhost:5000/api/electiveCourseFacultyAssignment/${assignmentId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setSuccess("Assignment deleted successfully!");
        fetchAssignments();
      } else {
        setError("Failed to delete assignment");
      }
    } catch (err) {
      setError("An error occurred while deleting assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.assignCoursesWrapper}>
      <h2 className={styles.assignCoursesTitle}>Assign Faculties to Elective Courses</h2>
      <form className={styles.assignCoursesForm} onSubmit={handleAssign}>
        <div>
          <label>Elective Course:</label>
          <select
            name="electiveCourse"
            value={form.electiveCourse}
            onChange={handleChange}
            required
          >
            <option value="">Select Elective Course</option>
            {electiveCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Faculty:</label>
          <select
            name="faculty"
            value={form.faculty}
            onChange={handleChange}
            required
          >
            <option value="">Select Faculty</option>
            {faculties.map((faculty) => (
              <option key={faculty._id} value={faculty._id}>
                {faculty.name} ({faculty.designation})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Batch:</label>
          <select
            name="batch"
            value={form.batch}
            onChange={handleChange}
            required
          >
            {[1, 2, 3, 4, 5].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.assignCoursesButton} disabled={loading}>
          {loading ? "Assigning..." : "Assign Faculty"}
        </button>
        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}
      </form>
      <h3 style={{marginTop: '2rem'}}>Current Elective Course-Faculty Assignments</h3>
      <table className={styles.assignCoursesTable}>
        <thead>
          <tr>
            <th>Elective Course</th>
            <th>Faculty</th>
            <th>Batch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => (
            <tr key={assignment._id}>
              <td>{assignment.electiveCourse?.code} - {assignment.electiveCourse?.name}</td>
              <td>{assignment.faculty?.name} ({assignment.faculty?.designation})</td>
              <td>{assignment.batch}</td>
              <td>
                <button
                  className={styles.assignCoursesButton}
                  style={{background: '#e74c3c', color: '#fff', padding: '0.4rem 1.2rem'}}
                  onClick={() => handleDelete(assignment._id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignElectiveFaculties; 