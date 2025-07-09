import React, { useState, useEffect, useRef } from "react";
import { FaUpload, FaDownload, FaFileCsv } from "react-icons/fa";
import "./csvupload.css";
import { apiAxios } from "../../../utils/api";

const CSVUpload = ({ onUploadSuccess }) => {
  const [uploadType, setUploadType] = useState("student");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [courseSemester, setCourseSemester] = useState(1);
  const [courseFile, setCourseFile] = useState(null);
  const [courseUploading, setCourseUploading] = useState(false);
  const [courseUploadStatus, setCourseUploadStatus] = useState("");
  const [coursePreviewData, setCoursePreviewData] = useState(null);
  const [electiveFile, setElectiveFile] = useState(null);
  const [electiveUploading, setElectiveUploading] = useState(false);
  const [electiveUploadStatus, setElectiveUploadStatus] = useState("");
  const [electivePreviewData, setElectivePreviewData] = useState(null);
  const [electiveCourses, setElectiveCourses] = useState([]);
  const [selectedElective, setSelectedElective] = useState("");
  const [studentElectiveFile, setStudentElectiveFile] = useState(null);
  const [studentElectiveUploading, setStudentElectiveUploading] =
    useState(false);
  const [studentElectiveUploadStatus, setStudentElectiveUploadStatus] =
    useState("");
  const [studentElectivePreviewData, setStudentElectivePreviewData] =
    useState(null);

  // Fetch elective courses for dropdown
  useEffect(() => {
    const fetchElectives = async () => {
      const response = await apiAxios().get("/electives");
      if (response.data) {
        setElectiveCourses(response.data);
      }
    };

    fetchElectives();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError("");
      previewCSV(selectedFile);
    } else {
      setError("Please select a valid CSV file");
      setFile(null);
      setPreviewData(null);
    }
  };

  const previewCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((header) => header.trim());
      const previewRows = lines.slice(1, 6).map((line) => {
        const values = line.split(",").map((value) => value.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
      setPreviewData({ headers, rows: previewRows });
    };
    reader.readAsText(file);
  };

  const uploadUrl =
    uploadType === "student" ? "/students/upload-csv" : "/faculties/upload-csv";

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await apiAxios().post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data && response.data.message) {
        setSuccess(response.data.message);
        onUploadSuccess && onUploadSuccess();
      } else {
        setError("Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    let template = "";
    let filename = "";
    if (uploadType === "student") {
      template = `id,name,batch,joined_year\n`;
      filename = "student_template.csv";
    } else {
      template = `id,name,designation\n`;
      filename = "faculty_template.csv";
    }
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCourseFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setCourseFile(selectedFile);
      setCourseUploadStatus("");
      previewCourseCSV(selectedFile);
    } else {
      setCourseUploadStatus("Please select a valid CSV file");
      setCourseFile(null);
      setCoursePreviewData(null);
    }
  };

  const previewCourseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((header) => header.trim());
      const previewRows = lines.slice(1, 6).map((line) => {
        const values = line.split(",").map((value) => value.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
      setCoursePreviewData({ headers, rows: previewRows });
    };
    reader.readAsText(file);
  };

  const handleCourseUpload = async () => {
    if (!courseFile) {
      setCourseUploadStatus("Please select a file first");
      return;
    }
    setCourseUploading(true);
    setCourseUploadStatus("Uploading...");
    try {
      const formData = new FormData();
      formData.append("file", courseFile);
      const response = await apiAxios().post("/courses/upload-csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data && response.data.message) {
        setCourseUploadStatus(response.data.message);
        setCourseFile(null);
        setCoursePreviewData(null);
        document.getElementById("course-csv-file-input").value = "";
      } else {
        setCourseUploadStatus("Upload failed. Please try again.");
      }
    } catch (error) {
      setCourseUploadStatus(
        "Upload failed. Please check your connection and try again."
      );
    } finally {
      setCourseUploading(false);
    }
  };

  const downloadCourseTemplate = () => {
    const template = `code,name,semester\n`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "courses_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Elective Course CSV handlers
  const handleElectiveFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setElectiveFile(selectedFile);
      setElectiveUploadStatus("");
      previewElectiveCSV(selectedFile);
    } else {
      setElectiveUploadStatus("Please select a valid CSV file");
      setElectiveFile(null);
      setElectivePreviewData(null);
    }
  };
  const previewElectiveCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((header) => header.trim());
      const previewRows = lines.slice(1, 6).map((line) => {
        const values = line.split(",").map((value) => value.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
      setElectivePreviewData({ headers, rows: previewRows });
    };
    reader.readAsText(file);
  };
  const handleElectiveUpload = async () => {
    if (!electiveFile) {
      setElectiveUploadStatus("Please select a file first");
      return;
    }
    setElectiveUploading(true);
    setElectiveUploadStatus("Uploading...");
    try {
      const formData = new FormData();
      formData.append("file", electiveFile);
      const response = await apiAxios().post(
        "/electives/upload-csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data && response.data.message) {
        setElectiveUploadStatus(response.data.message);
        setElectiveFile(null);
        setElectivePreviewData(null);
        document.getElementById("elective-csv-file-input").value = "";
      } else {
        setElectiveUploadStatus("Upload failed. Please try again.");
      }
    } catch (error) {
      setElectiveUploadStatus(
        "Upload failed. Please check your connection and try again."
      );
    } finally {
      setElectiveUploading(false);
    }
  };
  const downloadElectiveTemplate = () => {
    const template = `code,name,semester\n`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "elective_courses_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Student-Elective Assignment CSV handlers
  const handleStudentElectiveFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setStudentElectiveFile(selectedFile);
      setStudentElectiveUploadStatus("");
      previewStudentElectiveCSV(selectedFile);
    } else {
      setStudentElectiveUploadStatus("Please select a valid CSV file");
      setStudentElectiveFile(null);
      setStudentElectivePreviewData(null);
    }
  };
  const previewStudentElectiveCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((header) => header.trim());
      const previewRows = lines.slice(1, 6).map((line) => {
        const values = line.split(",").map((value) => value.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });
      setStudentElectivePreviewData({ headers, rows: previewRows });
    };
    reader.readAsText(file);
  };
  const handleStudentElectiveUpload = async () => {
    if (!studentElectiveFile || !selectedElective) {
      setStudentElectiveUploadStatus(
        "Please select a file and an elective course"
      );
      return;
    }
    setStudentElectiveUploading(true);
    setStudentElectiveUploadStatus("Uploading...");
    try {
      const formData = new FormData();
      formData.append("file", studentElectiveFile);
      formData.append("electiveCourseId", selectedElective);
      const response = await apiAxios().post(
        "/elective-student-assignments/upload-csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data && response.data.message) {
        setStudentElectiveUploadStatus(response.data.message);
        setStudentElectiveFile(null);
        setStudentElectivePreviewData(null);
        document.getElementById("student-elective-csv-file-input").value = "";
      } else {
        setStudentElectiveUploadStatus("Upload failed. Please try again.");
      }
    } catch (error) {
      setStudentElectiveUploadStatus(
        "Upload failed. Please check your connection and try again."
      );
    } finally {
      setStudentElectiveUploading(false);
    }
  };
  const downloadStudentElectiveTemplate = () => {
    const template = `s_id,batch\n`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_elective_assignment_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="csv-upload">
      <div className="csv-upload__header">
        <h2>CSV Data Upload</h2>
        <p>Upload CSV file containing student or faculty information</p>
      </div>

      <div className="csv-upload__content">
        <div className="csv-upload__section">
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="upload-type-select"
              style={{ fontWeight: 500, marginRight: 8 }}
            >
              Select Upload Type:
            </label>
            <select
              id="upload-type-select"
              value={uploadType}
              onChange={(e) => {
                setUploadType(e.target.value);
                setFile(null);
                setPreviewData(null);
                setError("");
                document.getElementById("csv-file-input").value = "";
              }}
              style={{
                padding: "0.5rem",
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              <option value="student">Student Details</option>
              <option value="faculty">Faculty Details</option>
            </select>
          </div>
          <h2>Upload CSV File for student and faculty details</h2>
          <div className="csv-upload__upload-area">
            <input
              type="file"
              id="csv-file-input"
              accept=".csv"
              onChange={handleFileChange}
              className="csv-upload__file-input"
            />
            <label htmlFor="csv-file-input" className="csv-upload__file-label">
              <FaFileCsv className="csv-upload__icon" />
              <span>Choose CSV file or drag and drop</span>
            </label>
          </div>

          {file && (
            <div className="csv-upload__file-info">
              <p>
                <strong>Selected file:</strong> {file.name}
              </p>
              <p>
                <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="csv-upload__upload-btn"
          >
            <FaUpload /> {uploading ? "Uploading..." : "Upload to Database"}
          </button>

          {error && <div className="csv-upload__status error">{error}</div>}
          {success && (
            <div className="csv-upload__status success">{success}</div>
          )}
        </div>

        <div className="csv-upload__section">
          <h3>Download Template</h3>
          <p>
            Download the CSV template to see the required format for the
            selected type
          </p>
          <button
            onClick={downloadTemplate}
            className="csv-upload__template-btn"
          >
            <FaDownload /> Download Template
          </button>
        </div>

        {previewData && (
          <div className="csv-upload__section">
            <h3>Data Preview (First 5 rows)</h3>
            <div className="csv-upload__preview">
              <table>
                <thead>
                  <tr>
                    {previewData.headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {previewData.headers.map((header, colIndex) => (
                        <td key={colIndex}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="csv-upload__section">
          <h3>Instructions</h3>
          <div className="csv-upload__instructions">
            <ul>
              {uploadType === "student" ? (
                <>
                  <li>
                    CSV file should contain columns: id, name, current_semester,
                    batch, joined_year
                  </li>
                  <li>Each subsequent row should contain student data</li>
                </>
              ) : (
                <>
                  <li>
                    CSV file should contain columns: id, name, designation
                  </li>
                  <li>Each subsequent row should contain faculty data</li>
                </>
              )}
              <li>First row should contain column headers</li>
              <li>Make sure all required fields are filled</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>

        <div className="csv-upload__section">
          <h1>Upload Courses for Semester</h1>
          <div className="csv-upload__upload-area">
            <input
              type="file"
              id="course-csv-file-input"
              accept=".csv"
              onChange={handleCourseFileChange}
              className="csv-upload__file-input"
            />
            <label
              htmlFor="course-csv-file-input"
              className="csv-upload__file-label"
            >
              <FaFileCsv className="csv-upload__icon" />
              <span>Choose CSV file or drag and drop</span>
            </label>
          </div>
          {courseFile && (
            <div className="csv-upload__file-info">
              <p>
                <strong>Selected file:</strong> {courseFile.name}
              </p>
              <p>
                <strong>Size:</strong> {(courseFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
          <button
            onClick={handleCourseUpload}
            disabled={!courseFile || courseUploading}
            className="csv-upload__upload-btn"
          >
            <FaUpload /> {courseUploading ? "Uploading..." : "Upload Courses"}
          </button>
          {courseUploadStatus && (
            <div
              className={`csv-upload__status ${
                courseUploadStatus.includes("successfully")
                  ? "success"
                  : "error"
              }`}
            >
              {courseUploadStatus}
            </div>
          )}
          <div style={{ marginTop: "1rem" }}>
            <h4>Download Courses CSV Template</h4>
            <button
              onClick={downloadCourseTemplate}
              className="csv-upload__template-btn"
            >
              <FaDownload /> Download Template
            </button>
          </div>
          {coursePreviewData && (
            <div className="csv-upload__preview">
              <h4>Data Preview (First 5 rows)</h4>
              <table>
                <thead>
                  <tr>
                    {coursePreviewData.headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coursePreviewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {coursePreviewData.headers.map((header, colIndex) => (
                        <td key={colIndex}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div
            className="csv-upload__instructions"
            style={{ marginTop: "1rem" }}
          >
            <ul>
              <li>CSV file should contain columns: code, name, semester</li>
              <li>First row should contain column headers</li>
              <li>
                Each subsequent row should contain course data for the selected
                semester
              </li>
              <li>Make sure all required fields are filled</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>

        <div className="csv-upload__section">
          <h1>Upload Elective Courses</h1>
          <div className="csv-upload__upload-area">
            <input
              type="file"
              id="elective-csv-file-input"
              accept=".csv"
              onChange={handleElectiveFileChange}
              className="csv-upload__file-input"
            />
            <label
              htmlFor="elective-csv-file-input"
              className="csv-upload__file-label"
            >
              <FaFileCsv className="csv-upload__icon" />
              <span>Choose CSV file or drag and drop</span>
            </label>
          </div>
          {electiveFile && (
            <div className="csv-upload__file-info">
              <p>
                <strong>Selected file:</strong> {electiveFile.name}
              </p>
              <p>
                <strong>Size:</strong> {(electiveFile.size / 1024).toFixed(2)}{" "}
                KB
              </p>
            </div>
          )}
          <button
            onClick={handleElectiveUpload}
            disabled={!electiveFile || electiveUploading}
            className="csv-upload__upload-btn"
          >
            <FaUpload />{" "}
            {electiveUploading ? "Uploading..." : "Upload Elective Courses"}
          </button>
          {electiveUploadStatus && (
            <div
              className={`csv-upload__status ${
                electiveUploadStatus.includes("successfully")
                  ? "success"
                  : "error"
              }`}
            >
              {electiveUploadStatus}
            </div>
          )}
          <div style={{ marginTop: "1rem" }}>
            <h4>Download Elective Courses CSV Template</h4>
            <button
              onClick={downloadElectiveTemplate}
              className="csv-upload__template-btn"
            >
              <FaDownload /> Download Template
            </button>
          </div>
          {electivePreviewData && (
            <div className="csv-upload__preview">
              <h4>Data Preview (First 5 rows)</h4>
              <table>
                <thead>
                  <tr>
                    {electivePreviewData.headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {electivePreviewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {electivePreviewData.headers.map((header, colIndex) => (
                        <td key={colIndex}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div
            className="csv-upload__instructions"
            style={{ marginTop: "1rem" }}
          >
            <ul>
              <li>CSV file should contain columns: code, name, semester</li>
              <li>First row should contain column headers</li>
              <li>Each subsequent row should contain elective course data</li>
              <li>Make sure all required fields are filled</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>

        <div className="csv-upload__section">
          <h1>Assign Students to Elective Course</h1>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="elective-select"
              style={{ fontWeight: 500, marginRight: 8 }}
            >
              Select Elective Course:
            </label>
            <select
              id="elective-select"
              value={selectedElective}
              onChange={(e) => setSelectedElective(e.target.value)}
              style={{
                padding: "0.5rem",
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              <option value="">-- Select Elective --</option>
              {(Array.isArray(electiveCourses) ? electiveCourses : []).map(
                (course) => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="csv-upload__upload-area">
            <input
              type="file"
              id="student-elective-csv-file-input"
              accept=".csv"
              onChange={handleStudentElectiveFileChange}
              className="csv-upload__file-input"
            />
            <label
              htmlFor="student-elective-csv-file-input"
              className="csv-upload__file-label"
            >
              <FaFileCsv className="csv-upload__icon" />
              <span>Choose CSV file or drag and drop</span>
            </label>
          </div>
          {studentElectiveFile && (
            <div className="csv-upload__file-info">
              <p>
                <strong>Selected file:</strong> {studentElectiveFile.name}
              </p>
              <p>
                <strong>Size:</strong>{" "}
                {(studentElectiveFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
          <button
            onClick={handleStudentElectiveUpload}
            disabled={
              !studentElectiveFile ||
              !selectedElective ||
              studentElectiveUploading
            }
            className="csv-upload__upload-btn"
          >
            <FaUpload />{" "}
            {studentElectiveUploading
              ? "Uploading..."
              : "Assign Students to Elective"}
          </button>
          {studentElectiveUploadStatus && (
            <div
              className={`csv-upload__status ${
                studentElectiveUploadStatus.includes("successfully")
                  ? "success"
                  : "error"
              }`}
            >
              {studentElectiveUploadStatus}
            </div>
          )}
          <div style={{ marginTop: "1rem" }}>
            <h4>Download Student-Elective Assignment CSV Template</h4>
            <button
              onClick={downloadStudentElectiveTemplate}
              className="csv-upload__template-btn"
            >
              <FaDownload /> Download Template
            </button>
          </div>
          {studentElectivePreviewData && (
            <div className="csv-upload__preview">
              <h4>Data Preview (First 5 rows)</h4>
              <table>
                <thead>
                  <tr>
                    {studentElectivePreviewData.headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentElectivePreviewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {studentElectivePreviewData.headers.map(
                        (header, colIndex) => (
                          <td key={colIndex}>{row[header]}</td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div
            className="csv-upload__instructions"
            style={{ marginTop: "1rem" }}
          >
            <ul>
              <li>CSV file should contain columns: s_id, batch</li>
              <li>First row should contain column headers</li>
              <li>
                Each subsequent row should contain student id and batch to
                assign to the selected elective
              </li>
              <li>Batch should be a number between 1 and 5</li>
              <li>Make sure all required fields are filled</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUpload;
