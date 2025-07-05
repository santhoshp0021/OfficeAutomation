import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import jsPDF from "jspdf";
import logoPngPath from "../../assets/Anna_University_Logo.png";
import cseLogoPath from "../../assets/CSE_logo.png";
const universityLogoUrl = new URL(logoPngPath, import.meta.url).href;
const cseLogoUrl = new URL(cseLogoPath, import.meta.url).href;
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = acc[key] ? acc[key] + 1 : 1;
    return acc;
  }, {});
}
export default function ConsolidationReportFacultyAnalytics() {
  const { user } = UserData();
  const { facultyName } = useParams();
  const [faculty, setFaculty] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [odRequests, setOdRequests] = useState([]);
  const [publications, setPublications] = useState([]);
  const [crReports, setCrReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCR, setLoadingCR] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedScholarStatus, setSelectedScholarStatus] = useState("");
  const programOptions = ["UG", "PG Diploma", "M.Phil.", "Ph.D."];
  const scholarStatusOptions = [
    { value: "", label: "All Scholars" },
    { value: "current", label: "Current Working" },
    { value: "completed", label: "Completed" },
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [facRes, schRes, odRes, pubRes] = await Promise.all([
          axios.get("http://localhost:5000/api/faculty", { headers: { "x-user-email": user.email } }),
          axios.get("http://localhost:5000/api/pgscholars", { headers: { "x-user-email": user.email } }),
          axios.get("http://localhost:5000/api/odrequests", { headers: { "x-user-email": user.email } }),
          axios.get("http://localhost:5000/api/publications", { headers: { "x-user-email": user.email } }),
        ]);
        setFaculty(facRes.data);
        setScholars(schRes.data);
        setOdRequests(odRes.data);
        setPublications(pubRes.data);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.email]);

  useEffect(() => {
    async function fetchCRReports() {
      setLoadingCR(true);
      try {
        const res = await axios.get("http://localhost:5000/api/crreport", { headers: { "x-user-email": user.email } });
        setCrReports(res.data.reports || []);
      } catch (err) {
        setCrReports([]);
      } finally {
        setLoadingCR(false);
      }
    }
    fetchCRReports();
  }, [user.email]);
  const [cseLogo, setCseLogo] = useState("");
const [universityLogo, setUniversityLogo] = useState("");


useEffect(() => {
  const fetchLogos = async () => {
    const loadAsBase64 = async (url, setter) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result);
      reader.readAsDataURL(blob);
    };

    await Promise.all([
      loadAsBase64(universityLogoUrl, setUniversityLogo),
      loadAsBase64(cseLogoUrl, setCseLogo),
    ]);
  };

  fetchLogos();
}, []);

  if (loading || loadingCR) return <div className="p-10 text-center">Loading Faculty Analytics...</div>;

  // Find the selected faculty by name (case-insensitive)
  const selectedFaculty = faculty.find(f => f.name && f.name.toLowerCase() === decodeURIComponent(facultyName).toLowerCase());

  if (!selectedFaculty) {
    return <div className="p-10 text-center text-red-600">Faculty not found: {facultyName}</div>;
  }

  // Semester options: always 1 to 8
  const semesterOptions = Array.from({ length: 8 }, (_, i) => (i + 1).toString());

  // Scholars supervised by this faculty, filtered by semester, program, and scholar status if selected
  const supervisedScholars = scholars.filter(s => {
    const isSupervisor = s.supervisor?.name === selectedFaculty.name;
    const matchesSemester = !selectedSemester || s.semester === selectedSemester;
    const matchesProgram = !selectedProgram || s.program === selectedProgram;
    let matchesStatus = true;
    if (selectedScholarStatus === "current") {
      matchesStatus = !s.dateOfCompletion || new Date(s.dateOfCompletion) >= new Date();
    } else if (selectedScholarStatus === "completed") {
      matchesStatus = s.dateOfCompletion && new Date(s.dateOfCompletion) < new Date();
    }
    return isSupervisor && matchesSemester && matchesProgram && matchesStatus;
  });
  const completedScholars = supervisedScholars.filter(s => s.dateOfCompletion && new Date(s.dateOfCompletion) < new Date());
  const presentScholars = supervisedScholars.filter(s => !s.dateOfCompletion || new Date(s.dateOfCompletion) >= new Date());

  // Publications by this faculty (do not filter by semester)
  const facultyPublications = publications.filter(p => (Array.isArray(p.authors) ? p.authors.includes(selectedFaculty.name) : p.authors === selectedFaculty.name));
  // OD event history for this faculty (do not filter by semester)
  const facultyOD = odRequests.filter(r => r.name === selectedFaculty.name);
  const today = new Date();
  const eventsAttended = facultyOD.filter(ev => ev.endDate && new Date(ev.endDate) < today && (ev.status || '').toLowerCase() === 'approved');
  const ongoingEvents = facultyOD.filter(ev => ev.startDate && ev.endDate && new Date(ev.startDate) <= today && today <= new Date(ev.endDate) && (ev.status || '').toLowerCase() === 'approved');
  const upcomingEvents = facultyOD.filter(ev => ev.startDate && new Date(ev.startDate) > today);

  // PDF Export handler: include semester in title and only export filtered data
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for DOM update
    const content = document.getElementById("faculty-analytics-content");
    if (!content) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    await pdf.html(content, {
      margin: [20, 20, 20, 20],
      autoPaging: 'text',
      html2canvas: { scale: 1 },
      callback: function (doc) {
        setIsExportingPDF(false);
        doc.save(`faculty_analytics_${selectedFaculty.name.replace(/\s+/g, '_')}${selectedSemester ? `_semester_${selectedSemester}` : ''}.pdf`);
      }
    });
  };

  if (isExportingPDF) {
    // Minimal, inline-styled PDF export version
    const cellStyle = { border: '0.5px solid #333333', padding: '1px 3px', textAlign: 'center', verticalAlign: 'middle', height: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
    const lastColStyle = { ...cellStyle, borderRight: '0.5px solid #333333' };
    const completionDateHeaderStyle = { ...lastColStyle, fontWeight: 700, minWidth: '140px', fontSize: '7px' };
    const completionDateCellStyle = { ...lastColStyle, minWidth: '140px', fontSize: '7px' };
    delete completionDateHeaderStyle.whiteSpace;
    delete completionDateCellStyle.whiteSpace;
    delete completionDateHeaderStyle.overflow;
    delete completionDateCellStyle.overflow;
    delete completionDateHeaderStyle.textOverflow;
    delete completionDateCellStyle.textOverflow;
    return (
      <div id="faculty-analytics-content" style={{ width: '580px', margin: '0 auto', background: '#fff', color: '#000', fontSize: '9px', padding: 12, paddingRight: 10, fontFamily: 'Times New Roman, Times, serif' }}>
        {/* Title */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
    <img src={universityLogo} alt="University Logo" width="100" height="100"/>
    <img src={cseLogo} alt="Department Logo" width="100" height="100" />
  </div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '12px', marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>College of Engineering Guindy, Anna University</div>
          <div style={{ fontWeight: 700 }}>Department of Computer Science and Engineering</div>
          <div style={{ fontWeight: 700 }}>Faculty Consolidation Report{selectedSemester ? ` - Semester ${selectedSemester}` : ''}</div>
          <div style={{ borderTop: '0.5px solid #333333', margin: '8px 0 10px 0' }} />
        </div>
        {/* Basic Info */}
        <div style={{ marginBottom: 0.2 }}>
          <div style={{ fontWeight: 700, margin: '8px 0 16px 0', fontSize: '10px' }}>Basic Info</div>
          <table style={{ width: '320px', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', marginBottom: 8, border: '0.5px solid #333333' }}>
            <tbody>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120, borderBottom: '0.5px solid #333333' }}>Name:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333', borderBottom: '0.5px solid #333333' }}>{selectedFaculty.name || '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Department:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.department || '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Position:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.position || '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Email:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.contactInfo?.email || '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Phone:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.contactInfo?.phone || '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Gender:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.gender || '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Date of Birth:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.dob ? new Date(selectedFaculty.dob).toLocaleDateString('en-IN') : '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Date of Joining:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.dateOfJoining ? new Date(selectedFaculty.dateOfJoining).toLocaleDateString('en-IN') : '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Active:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.isActive ? "Yes" : "No"}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Years of Experience:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.dateOfJoining ? (new Date().getFullYear() - new Date(selectedFaculty.dateOfJoining).getFullYear()) : '-'}</td></tr>
              <tr><td style={{ ...cellStyle, fontWeight: 600, width: 120 }}>Areas of Expertise:</td><td style={{ ...lastColStyle, borderLeft: '0.5px solid #333333' }}>{selectedFaculty.areasOfExpertise?.join(", ") || '-'}</td></tr>
            </tbody>
          </table>
        </div>
        {/* Scholars Table */}
        <div style={{ marginBottom: 0.2 }}>
          <div style={{ fontWeight: 700, margin: '8px 0 2px 0', fontSize: '10px' }}>Scholars Supervised ({supervisedScholars.length}):</div>
          <div style={{ marginBottom: 8 }}>Total Scholars: {supervisedScholars.length}</div>
          {supervisedScholars.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', marginBottom: 8, border: '0.5px solid #333333' }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Name</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Phone Number</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333', fontSize: '7px' }}>Area of Research</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333', fontSize: '7px' }}>Email</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Semester</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Program</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Status</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Joining Date</th>
                  <th style={{ ...completionDateHeaderStyle, border: '0.5px solid #333333', fontSize: '7px' }}>Completion Date</th>
                </tr>
              </thead>
              <tbody>
                {supervisedScholars.map(s => {
                  const isCompleted = s.dateOfCompletion && new Date(s.dateOfCompletion) < new Date();
                  return (
                    <tr key={s._id}>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{s.name || '-'}</td>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{s.contactInfo?.phone || '-'}</td>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333', fontSize: '7px' }}>{s.areaOfResearch || '-'}</td>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333', fontSize: '7px' }}>{s.contactInfo?.email || '-'}</td>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{s.semester || '-'}</td>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{s.program || '-'}</td>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{isCompleted ? 'Completed' : 'Current'}</td>
                      <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString('en-IN') : '-'}</td>
                      <td style={{ ...completionDateCellStyle, border: '0.5px solid #333333' }}>{isCompleted ? (s.dateOfCompletion ? new Date(s.dateOfCompletion).toLocaleDateString('en-IN') : '-') : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <div style={{ color: '#111', fontSize: '9px', marginBottom: 0.2, marginTop: 0 }}>No scholars supervised.</div>}
        </div>
        {/* Publications */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, margin: '8px 0 2px 0', fontSize: '10px' }}>Publications ({facultyPublications.length}):</div>
          <div>Total Publications: {facultyPublications.length}</div>
          {facultyPublications.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, fontSize: '9px' }}>
              {facultyPublications.map(p => (
                <li key={p._id || p.title} style={{ marginBottom: 0.2 }}>
                  {p.title || '-'}{p.type ? ` (${p.type})` : ''}{p.publicationDate ? `, ${new Date(p.publicationDate).toLocaleDateString('en-IN')}` : ''}
                </li>
              ))}
            </ul>
          ) : <div style={{ color: '#111', fontSize: '9px', marginBottom: 0.2, marginTop: 0 }}>No publications found.</div>}
        </div>
        {/* OD Event History */}
        <div style={{ marginBottom: 0.2 }}>
          <div style={{ fontWeight: 700, margin: '8px 0 2px 0', fontSize: '10px' }}>Event History (OD Requests)</div>
          <div>Total Events: {facultyOD.length}</div>
          {/* Events Attended */}
          <div style={{ fontWeight: 700, margin: '8px 0 16px 0', fontSize: '9px' }}>Events Attended ({eventsAttended.length}):</div>
          {eventsAttended.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', marginBottom: 8, border: '0.5px solid #333333' }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Event Name</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Type</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Dates</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {eventsAttended.map(ev => (
                  <tr key={ev._id}>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.topic || '-'}</td>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.eventType || ev.requestType || '-'}</td>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-IN') : '-'}{ev.endDate ? ` - ${new Date(ev.endDate).toLocaleDateString('en-IN')}` : ''}</td>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{ color: '#111', fontSize: '9px', marginBottom: 0.2, marginTop: 0 }}>No events attended.</div>}
        </div>
        {/* Ongoing Events */}
        <div style={{ marginBottom: 0.2 }}>
          <div style={{ fontWeight: 700, margin: '8px 0 16px 0', fontSize: '9px' }}>Ongoing Events ({ongoingEvents.length}):</div>
          {ongoingEvents.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', marginBottom: 8, border: '0.5px solid #333333' }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Event Name</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Type</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Dates</th>
                  <th style={{ ...cellStyle, fontWeight: 700, border: '0.5px solid #333333' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ongoingEvents.map(ev => (
                  <tr key={ev._id}>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.topic || '-'}</td>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.eventType || ev.requestType || '-'}</td>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-IN') : '-'}{ev.endDate ? ` - ${new Date(ev.endDate).toLocaleDateString('en-IN')}` : ''}</td>
                    <td style={{ ...cellStyle, border: '0.5px solid #333333' }}>{ev.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{ color: '#111', fontSize: '9px', marginBottom: 6, marginTop: 0 }}>No ongoing events.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <h1 className="text-3xl font-bold">Analytics for {selectedFaculty.name}</h1>
          <select
            className="border rounded px-4 py-2 min-w-[160px]"
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesterOptions.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
          <select
            className="border rounded px-4 py-2 min-w-[160px]"
            value={selectedProgram}
            onChange={e => setSelectedProgram(e.target.value)}
          >
            <option value="">All Programs</option>
            {programOptions.map(prog => (
              <option key={prog} value={prog}>{prog}</option>
            ))}
          </select>
          <select
            className="border rounded px-4 py-2 min-w-[160px]"
            value={selectedScholarStatus}
            onChange={e => setSelectedScholarStatus(e.target.value)}
          >
            {scholarStatusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition font-semibold"
          onClick={handleExportPDF}
        >
          Export PDF
        </button>
      </div>
      {/* Report Title Section for PDF Export - always at the top */}
      <div className="pdf-title-section">
         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
    <img src={universityLogo} alt="University Logo" width="100" height="100"/>
    <img src={cseLogo} alt="Department Logo" width="100" height="100" />
  </div>
        <div>College of Engineering Guindy, Anna University</div>
        <div>Department of Computer Science and Engineering</div>
        <div>Faculty Consolidation Report{selectedSemester ? ` - Semester ${selectedSemester}` : ''}</div>
        <hr className="pdf-title-divider" />
      </div>
      <div id="faculty-analytics-content" className="pdf-export pdf-sample-font pdf-export-content">
        {/* Basic Info Section - compact table */}
        <section>
          <h2 className="pdf-section-heading">Basic Info</h2>
          <table className="pdf-basic-info-table">
            <tbody>
              <tr><td className="pdf-basic-info-label">Name:</td><td>{selectedFaculty.name || '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Department:</td><td>{selectedFaculty.department || '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Position:</td><td>{selectedFaculty.position || '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Email:</td><td>{selectedFaculty.contactInfo?.email || '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Phone:</td><td>{selectedFaculty.contactInfo?.phone || '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Gender:</td><td>{selectedFaculty.gender || '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Date of Birth:</td><td>{selectedFaculty.dob ? new Date(selectedFaculty.dob).toLocaleDateString('en-IN') : '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Date of Joining:</td><td>{selectedFaculty.dateOfJoining ? new Date(selectedFaculty.dateOfJoining).toLocaleDateString('en-IN') : '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Active:</td><td>{selectedFaculty.isActive ? "Yes" : "No"}</td></tr>
              <tr><td className="pdf-basic-info-label">Years of Experience:</td><td>{selectedFaculty.dateOfJoining ? (new Date().getFullYear() - new Date(selectedFaculty.dateOfJoining).getFullYear()) : '-'}</td></tr>
              <tr><td className="pdf-basic-info-label">Areas of Expertise:</td><td>{selectedFaculty.areasOfExpertise?.join(", ") || '-'}</td></tr>
            </tbody>
          </table>
        </section>
        {/* Scholars Section */}
        <section>
          <h2 className="pdf-section-heading">Scholars Supervised ({supervisedScholars.length}):</h2>
          <div style={{ marginBottom: 0.2 }}>Total Scholars: {supervisedScholars.length}</div>
          {supervisedScholars.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th style={{ fontSize: '7px' }}>Area of Research</th>
                  <th style={{ fontSize: '7px' }}>Email</th>
                  <th>Semester</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Joining Date</th>
                  <th>Completion Date</th>
                </tr>
              </thead>
              <tbody>
                {supervisedScholars.map(s => {
                  const isCompleted = s.dateOfCompletion && new Date(s.dateOfCompletion) < new Date();
                  return (
                    <tr key={s._id}>
                      <td>{s.name || '-'}</td>
                      <td>{s.contactInfo?.phone || '-'}</td>
                      <td style={{ fontSize: '7px' }}>{s.areaOfResearch || '-'}</td>
                      <td style={{ fontSize: '7px' }}>{s.contactInfo?.email || '-'}</td>
                      <td>{s.semester || '-'}</td>
                      <td>{s.program || '-'}</td>
                      <td>{isCompleted ? 'Completed' : 'Current'}</td>
                      <td>{s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString('en-IN') : '-'}</td>
                      <td>{isCompleted ? (s.dateOfCompletion ? new Date(s.dateOfCompletion).toLocaleDateString('en-IN') : '-') : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <div className="pdf-no-data">No scholars supervised.</div>}
        </section>
        {/* Publications Section */}
        <section>
          <h2 className="pdf-section-heading">Publications ({facultyPublications.length}):</h2>
          <div>Total Publications: {facultyPublications.length}</div>
          {facultyPublications.length > 0 ? (
            <ul>
              {facultyPublications.map(p => (
                <li key={p._id || p.title}>
                  {p.title || '-'}{p.type ? ` (${p.type})` : ''}{p.publicationDate ? `, ${new Date(p.publicationDate).toLocaleDateString('en-IN')}` : ''}
                </li>
              ))}
            </ul>
          ) : <div className="pdf-no-data">No publications found.</div>}
        </section>
        {/* OD Event History Section */}
        <section>
          <h2 className="pdf-section-heading">Event History (OD Requests)</h2>
          <div>Total Events: {facultyOD.length}</div>
          {/* Events Attended */}
          <div className="pdf-section-subheading">Events Attended ({eventsAttended.length}):</div>
          {eventsAttended.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {eventsAttended.map(ev => (
                  <tr key={ev._id}>
                    <td>{ev.topic || '-'}</td>
                    <td>{ev.eventType || ev.requestType || '-'}</td>
                    <td>{ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-IN') : '-'}{ev.endDate ? ` - ${new Date(ev.endDate).toLocaleDateString('en-IN')}` : ''}</td>
                    <td>{ev.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="pdf-no-data">No events attended.</div>}
          {/* Ongoing Events */}
          <div className="pdf-section-subheading">Ongoing Events ({ongoingEvents.length}):</div>
          {ongoingEvents.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ongoingEvents.map(ev => (
                  <tr key={ev._id}>
                    <td>{ev.topic || '-'}</td>
                    <td>{ev.eventType || ev.requestType || '-'}</td>
                    <td>{ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-IN') : '-'}{ev.endDate ? ` - ${new Date(ev.endDate).toLocaleDateString('en-IN')}` : ''}</td>
                    <td>{ev.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="pdf-no-data">No ongoing events.</div>}
        </section>
      </div>
    </div>
  );
}