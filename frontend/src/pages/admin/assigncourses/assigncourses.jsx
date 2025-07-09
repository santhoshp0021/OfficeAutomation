import React, { useEffect, useState } from "react";
import styles from "./assigncourses.module.css";
import { apiAxios } from "../../../utils/api";

// Example static data

// const faculties = [
//   { name: 'Dr. V. Mary Anita Rajam', designation: 'Professor' },
//   { name: 'Dr. K.S. Easwarakumar', designation: 'Professor' },
//   { name: 'Dr. T.V. Gopal', designation: 'Professor' },
//   { name: 'Dr. S. Valli', designation: 'Professor' },
//   { name: 'Dr. S. Chitrakala', designation: 'Professor' },
//   { name: 'Dr. V. Vetriselvi', designation: 'Professor' },
//   { name: 'Dr. S. Bose', designation: 'Professor' },
//   { name: 'Dr. R. Baskaran', designation: 'Professor' },
//   { name: 'Dr. P. Geetha', designation: 'Professor' },
//   { name: 'Dr. S. Sudha', designation: 'Assistant Professor(Sl. Gr.)' },
//   { name: 'Dr. P. Uma Maheswari', designation: 'Professor' },
//   { name: 'Dr. C. Valliyammai', designation: 'Professor' },
//   { name: 'Dr. B.L. Velammal', designation: 'Associate Professor' },
//   { name: 'Dr. G.S. Mahalakshmi', designation: 'Associate Professor' },
//   { name: 'Dr. Angelin Gladston', designation: 'Associate Professor' },
//   { name: 'Dr. Tripuraribhatla Raghuveera', designation: 'Associate Professor' },
//   { name: 'Dr. R. Arockia Xavier Annie', designation: 'Associate Professor' },
//   { name: 'Dr. Dejey', designation: 'Associate Professor' },
//   { name: 'Dr. P. Ganesh kumar', designation: 'Associate Professor' },
//   { name: 'Dr. T. Sree Sharmila', designation: 'Associate Professor' },
//   { name: 'Dr. K. Saravanan', designation: 'Associate Professor' },
//   { name: 'Dr. D. Shiloah Elizabeth', designation: 'Assistant Professor(Sl. Gr.)' },
//   { name: 'Dr. S. Renugadevi', designation: 'Assistant Professor(Sl. Gr.)' },
//   { name: 'Dr. M. Shanmuga Priya', designation: 'Assistant Professor(Sl. Gr.)' },
//   { name: 'Dr. P. Velvizhy', designation: 'Assistant Professor(Sl. Gr.)' },
//   { name: 'Dr. E. Shanmuga Priya', designation: 'Assistant Professor(Sr. Gr.)' },
//   { name: 'M.S. Karthika Devi', designation: 'Assistant Professor(Sr. Gr.)' },
//   { name: 'Dr. P. Prabhavathy', designation: 'Assistant Professor' },
//   { name: 'Dr. C. Balaji', designation: 'Assistant Professor' },
//   { name: 'Dr. S. Kirthica', designation: 'Assistant Professor' },
//   { name: 'Dr. P. Shanthi', designation: 'Assistant Professor' },
//   { name: 'Dr. P. Mohamed Fathimal', designation: 'Assistant Professor' },
//   { name: 'Dr. K. Selvamani', designation: 'Assistant Professor' },
// ];

const years = [1, 2, 3, 4];
const batches = ["N", "P", "Q"];
const yearToSemesters = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
  4: [7, 8],
};

const AssignCourses = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    year: 1,
    batch: "N",
    semester: 1,
    course: "",
    faculty: "",
  });
  const [editingAssignment, setEditingAssignment] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "year") {
      const newYear = Number(value);
      const validSemesters = yearToSemesters[newYear];
      setForm({
        ...form,
        year: newYear,
        semester: validSemesters[0],
      });
    } else if (name === "course") {
      const selected = courses.find((c) => c._id === value);
      setForm({ ...form, course: selected });
    } else if (name === "faculty") {
      const selected = faculties.find((f) => f._id === value);
      setForm({ ...form, faculty: selected });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!form.course || !form.faculty) {
      setError("Please select both course and faculty");
      setLoading(false);
      return;
    }

    const payload = {
      course: form.course._id,
      faculty: form.faculty._id,
      semester: form.semester,
      batch: form.batch,
    };

    try {
      const response = await apiAxios().post("/assignments/assign", payload);

      if (response.data) {
        setSuccess(response.data.message);
        // setForm({
        //   year: 1,
        //   batch: "N",
        //   semester: 1,
        //   course: courses[0] || "",
        //   faculty: faculties[0] || "",
        // });
        fetchAssignments();
      } else {
        setError(response.data.error || "Failed to assign faculty");
      }
    } catch (err) {
      setError("An error occurred while assigning faculty");
      console.error("Error assigning faculty:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment._id);
    setForm({
      year: Math.ceil(assignment.semester / 2),
      batch: assignment.batch,
      semester: assignment.semester,
      course: assignment.course,
      faculty: assignment.faculty,
    });
  };

  const handleUpdate = async () => {
    if (!editingAssignment) return;

    setLoading(true);
    setError("");
    setSuccess("");

    if (!form.course || !form.faculty) {
      setError("Please select both course and faculty");
      setLoading(false);
      return;
    }

    const payload = {
      course: form.course._id,
      faculty: form.faculty._id,
      semester: form.semester,
      batch: form.batch,
    };

    try {
      const response = await apiAxios().put(
        `/assignments/${editingAssignment}`,
        payload
      );

      if (response.data.success) {
        setSuccess("Assignment updated successfully!");
        setEditingAssignment(null);
        setForm({
          year: 1,
          batch: "N",
          semester: 1,
          course: courses[0] || "",
          faculty: faculties[0] || "",
        });
        fetchAssignments();
      } else {
        const errorData = response.data;
        setError(errorData.error || "Failed to update assignment");
      }
    } catch (err) {
      setError("An error occurred while updating assignment");
      console.error("Error updating assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiAxios().delete(`/assignments/${assignmentId}`);

      if (response.data.success) {
        setSuccess("Assignment deleted successfully!");
        fetchAssignments();
      } else {
        const errorData = response.data;
        setError(errorData.error || "Failed to delete assignment");
      }
    } catch (err) {
      setError("An error occurred while deleting assignment");
      console.error("Error deleting assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAssignment(null);
    setForm({
      year: 1,
      batch: "N",
      semester: 1,
      course: courses[0] || "",
      faculty: faculties[0] || "",
    });
  };

  const fetchAssignments = async () => {
    try {
      const response = await apiAxios().get(
        `/assignments/semester/${form.semester}/batch/${form.batch}`
      );
      if (response.data) {
        setAssignments(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } else {
        console.error("Failed to fetch assignments");
        setAssignments([]);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setAssignments([]);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      const response = await apiAxios().get(
        `/courses/semester/${form.semester}`
      );
      const data = response.data;
      setCourses(data);
      // Set default course to first available after fetch
      setForm((prev) => ({ ...prev, course: data[0] || "" }));
    };

    fetchCourses();
    fetchAssignments();
  }, [form.semester]);

  useEffect(() => {
    fetchAssignments();
  }, [form.semester, form.batch]);

  useEffect(() => {
    const fetchFaculties = async () => {
      const response = await apiAxios().get("/faculties");
      const data = response.data;
      setFaculties(data);
      // Set default faculty to first available after fetch
      setForm((prev) => ({ ...prev, faculty: data[0] || "" }));
    };
    fetchFaculties();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const validSemesters = yearToSemesters[form.year];

  return (
    <div className={styles.assignCoursesWrapper}>
      <h2 className={styles.assignCoursesTitle}>Assign Courses to Faculties</h2>

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
            border: "1px solid #f5c6cb",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#d4edda",
            color: "#155724",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
            border: "1px solid #c3e6cb",
          }}
        >
          {success}
        </div>
      )}

      <form
        onSubmit={
          editingAssignment
            ? (e) => {
                e.preventDefault();
                handleUpdate();
              }
            : handleAssign
        }
        className={styles.assignCoursesForm}
      >
        <div>
          <label>
            Year
            <br />
            <select name="year" value={form.year} onChange={handleChange}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y} Year
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Batch
            <br />
            <select name="batch" value={form.batch} onChange={handleChange}>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Semester
            <br />
            <select
              name="semester"
              value={form.semester}
              onChange={handleChange}
            >
              {validSemesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Course
            <br />
            <select
              name="course"
              value={form.course ? form.course._id : ""}
              onChange={handleChange}
            >
              {courses.length > 0 ? (
                courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="">No courses available</option>
              )}
            </select>
          </label>
        </div>
        <div>
          <label>
            Faculty
            <br />
            <select
              name="faculty"
              value={form.faculty ? form.faculty._id : ""}
              onChange={handleChange}
            >
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.designation})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ alignSelf: "end", display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            className={styles.assignCoursesButton}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : editingAssignment
              ? "Update Assignment"
              : "Assign Faculty"}
          </button>
          {editingAssignment && (
            <button
              type="button"
              className={styles.assignCoursesButton}
              style={{ background: "#e74a3b" }}
              onClick={handleCancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>Current Assignments</h3>
      <table className={styles.assignCoursesTable}>
        <thead>
          <tr>
            <th>Batch</th>
            <th>Semester</th>
            <th>Course</th>
            <th>Faculty</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(assignments) &&
            assignments.map((assignment) => (
              <tr
                key={assignment._id}
                style={
                  editingAssignment === assignment._id
                    ? { background: "#e3e6f3" }
                    : {}
                }
              >
                <td>{assignment.batch}</td>
                <td>{assignment.semester}</td>
                <td>{assignment.course?.name || assignment.course}</td>
                <td>
                  {assignment.faculty?.name || assignment.faculty}{" "}
                  {assignment.faculty?.designation &&
                    `(${assignment.faculty.designation})`}
                </td>
                <td>
                  <button
                    type="button"
                    style={{
                      marginRight: 8,
                      background: "#f6c23e",
                      color: "#222",
                      border: "none",
                      borderRadius: 6,
                      padding: "0.3rem 0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onClick={() => handleEdit(assignment)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "#e74a3b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "0.3rem 0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onClick={() => handleDelete(assignment._id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          {(!Array.isArray(assignments) || assignments.length === 0) && (
            <tr>
              <td colSpan={5} className={styles.assignCoursesNoData}>
                No assignments yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssignCourses;
