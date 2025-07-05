import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function ConsolidationReportFaculty() {
  const { user } = UserData();
  const [faculty, setFaculty] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [odRequests, setOdRequests] = useState([]);
  const [publications, setPublications] = useState([]);
  const [crReports, setCrReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCR, setLoadingCR] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");

  const facultyByDept = useMemo(() => groupBy(faculty, f => f.department || "Unknown"), [faculty]);
  const facultyByPosition = useMemo(() => groupBy(faculty, f => f.position || "Unknown"), [faculty]);
  const facultyByGender = useMemo(() => groupBy(faculty, f => (f.gender ? f.gender.charAt(0).toUpperCase() + f.gender.slice(1) : "Unknown")), [faculty]);

  const navigate = useNavigate();

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

  // Fetch all CR Reports for all faculty (for conference extraction)
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

  if (loading || loadingCR) return <div className="p-10 text-center">Loading Faculty Statistics...</div>;

  // --- Extract Conferences from CR Reports ---
  // Map: facultyId -> { name, conferences: [] }
  const facultyConferences = {};
  crReports.forEach(r => {
    const facultyId = r.facultyId || r.faculty?._id || r.faculty;
    const facultyName = r.facultyName || r.faculty?.name || "Unknown";
    if (!facultyConferences[facultyId]) facultyConferences[facultyId] = { name: facultyName, conferences: [] };
    if (Array.isArray(r.selfAssessment?.conferences)) {
      facultyConferences[facultyId].conferences.push(...r.selfAssessment.conferences);
    }
  });

  // --- Extract OD requests with eventType 'Conference' ---
  const odConferenceRequests = odRequests.filter(r => (r.eventType && r.eventType.toLowerCase() === 'conference'));

  // --- Extract FDPs from OD Requests ---
  const odFDPRequests = odRequests.filter(r => (r.eventType && r.eventType.toLowerCase().includes('fdp')));

  // --- Faculty Demographics & Overview ---
  const totalFaculty = faculty.length;
  const activeFaculty = faculty.filter(f => f.isActive).length;
  const inactiveFaculty = totalFaculty - activeFaculty;

  // --- Experience & Tenure ---
  const today = new Date();
  const facultyWithExperience = faculty.map(f => ({
    ...f,
    years: f.dateOfJoining ? (today.getFullYear() - new Date(f.dateOfJoining).getFullYear() - (today < new Date(new Date(f.dateOfJoining).setFullYear(today.getFullYear())) ? 1 : 0)) : null
  })).filter(f => f.years !== null);
  const avgExperience = facultyWithExperience.length ? (facultyWithExperience.reduce((sum, f) => sum + f.years, 0) / facultyWithExperience.length).toFixed(1) : '-';
  const experienceBuckets = [
    { label: '0-5', min: 0, max: 5 },
    { label: '6-10', min: 6, max: 10 },
    { label: '11-15', min: 11, max: 15 },
    { label: '16-20', min: 16, max: 20 },
    { label: '21+', min: 21, max: 100 }
  ];
  const experienceDist = experienceBuckets.map(bucket => ({
    ...bucket,
    count: facultyWithExperience.filter(f => f.years >= bucket.min && f.years <= bucket.max).length
  }));
  const longestServing = [...facultyWithExperience].sort((a, b) => a.dateOfJoining - b.dateOfJoining).slice(0, 3);
  const recentJoinees = [...facultyWithExperience].sort((a, b) => b.dateOfJoining - a.dateOfJoining).slice(0, 3);

  // --- Export PDF for a particular faculty ---
  const facultyOptions = faculty.map(f => ({ id: f._id, name: f.name }));
  const selectedFaculty = faculty.find(f => f._id === selectedFacultyId);

  async function handleExportFacultyPDF() {
    if (!selectedFaculty) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    let y = 40;
    // Title Section (as in other consolidated reports)
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text("Anna University", 300, y, { align: 'center' });
    y += 28;
    pdf.setFontSize(16);
    pdf.text("College of Engineering Guindy", 300, y, { align: 'center' });
    y += 22;
    pdf.setFontSize(14);
    pdf.text("Department of Computer Science and Engineering", 300, y, { align: 'center' });
    y += 30;
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Consolidated Faculty Report`, 300, y, { align: 'center' });
    y += 36;
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(12);
    // Faculty Info
    pdf.text(`Name: ${selectedFaculty.name}`, 40, y);
    y += 22;
    pdf.text(`Department: ${selectedFaculty.department || "-"}`, 40, y);
    y += 18;
    pdf.text(`Position: ${selectedFaculty.position || "-"}`, 40, y);
    y += 18;
    pdf.text(`Email: ${selectedFaculty.contactInfo?.email || "-"}`, 40, y);
    y += 18;
    pdf.text(`Phone: ${selectedFaculty.contactInfo?.phone || "-"}`, 40, y);
    y += 18;
    pdf.text(`Gender: ${selectedFaculty.gender || "-"}`, 40, y);
    y += 18;
    pdf.text(`Date of Birth: ${selectedFaculty.dob ? new Date(selectedFaculty.dob).toLocaleDateString('en-IN') : '-'}`, 40, y);
    y += 18;
    pdf.text(`Date of Joining: ${selectedFaculty.dateOfJoining ? new Date(selectedFaculty.dateOfJoining).toLocaleDateString('en-IN') : '-'}`, 40, y);
    y += 18;
    pdf.text(`Active: ${selectedFaculty.isActive ? "Yes" : "No"}`, 40, y);
    y += 24;
    // Experience
    const yearsExp = selectedFaculty.dateOfJoining ? (new Date().getFullYear() - new Date(selectedFaculty.dateOfJoining).getFullYear()) : '-';
    pdf.text(`Years of Experience: ${yearsExp}`, 40, y);
    y += 24;
    // Areas of Expertise
    if (selectedFaculty.areasOfExpertise && selectedFaculty.areasOfExpertise.length > 0) {
      pdf.text(`Areas of Expertise: ${selectedFaculty.areasOfExpertise.join(", ")}`, 40, y);
      y += 22;
    }
    // --- CR Report Self-Assessment Details ---
    // Robustly match CR reports for this faculty
    const facultyCRs = crReports.filter(r => {
      // Try to match by facultyId (string, unique)
      const reportFacultyId = r.facultyId || r.faculty?.facultyId || r.faculty?._id || r.faculty;
      return (
        reportFacultyId === selectedFaculty.facultyId ||
        reportFacultyId === selectedFaculty._id ||
        r.faculty?.name === selectedFaculty.name
      );
    });
    const latestCR = facultyCRs.length > 0 ? facultyCRs.reduce((a, b) => new Date(a.facultySignDate || a.hodSignDate || 0) > new Date(b.facultySignDate || b.hodSignDate || 0) ? a : b) : null;
    if (latestCR && latestCR.selfAssessment) {
      // Section Title
      y += 10;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(14);
      pdf.text("Annual Faculty Activity Summary", 40, y);
      y += 18;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(12);
      const crDate = latestCR.facultySignDate || latestCR.hodSignDate;
      if (crDate) {
        pdf.setFont(undefined, 'italic');
        pdf.text(`CR Report Date: ${new Date(crDate).toLocaleDateString('en-IN')}`, 40, y);
        y += 16;
        pdf.setFont(undefined, 'normal');
      }
      const sa = latestCR.selfAssessment;
      // Courses Taught
      if (Array.isArray(sa.coursesTaught) && sa.coursesTaught.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Courses Taught:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.coursesTaught.forEach(c => {
          pdf.text(`• ${c.title || ''} (${c.level || ''}), Hours/Week: ${c.hoursPerWeek || '-'}, Students Registered: ${c.studentsRegistered || '-'}`, 50, y);
          y += 13;
        });
        y += 6;
      }
      // Subjects Taught
      if (Array.isArray(sa.subjectsTaught) && sa.subjectsTaught.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Subjects Taught:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.subjectsTaught.forEach(sj => {
          pdf.text(`• ${sj.subject || ''}, Contact Hours: ${sj.contactHours || '-'}, Appeared: ${sj.studentsAppeared || '-'}, Passed: ${sj.studentsPassed || '-'}, Remarks: ${sj.remarks || '-'}`, 50, y);
          y += 13;
        });
        y += 6;
      }
      // Exam Results
      if (sa.examResults) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Exam Results:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        pdf.text(sa.examResults, 50, y);
        y += 13;
      }
      // Contributions
      if (sa.contributions) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Contributions:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        pdf.text(sa.contributions, 50, y);
        y += 13;
      }
      // Research Supervised
      if (sa.researchCounts && (sa.researchCounts.phd || sa.researchCounts.mphil || sa.researchCounts.pg || sa.researchCounts.ug)) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Research Supervised:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        pdf.text(`PhD: ${sa.researchCounts.phd || 0}, MPhil: ${sa.researchCounts.mphil || 0}, PG: ${sa.researchCounts.pg || 0}, UG: ${sa.researchCounts.ug || 0}`, 50, y);
        y += 13;
      }
      // Papers Published
      if (Array.isArray(sa.papersPublished) && sa.papersPublished.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Papers Published:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.papersPublished.forEach(p => {
          pdf.text(`• ${p}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Books/Guides Authored
      if (Array.isArray(sa.booksOrGuides) && sa.booksOrGuides.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Books/Guides Authored:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.booksOrGuides.forEach(b => {
          pdf.text(`• ${b}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Memberships
      if (Array.isArray(sa.memberships) && sa.memberships.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Memberships:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.memberships.forEach(m => {
          pdf.text(`• ${m}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Conferences Attended
      if (Array.isArray(sa.conferences) && sa.conferences.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Conferences Attended:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.conferences.forEach(c => {
          pdf.text(`• ${c}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Consulting Work
      if (Array.isArray(sa.consultingWork) && sa.consultingWork.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Consulting Work:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.consultingWork.forEach(c => {
          pdf.text(`• ${c}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Additional Qualifications
      if (Array.isArray(sa.additionalQualifications) && sa.additionalQualifications.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Additional Qualifications:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.additionalQualifications.forEach(aq => {
          pdf.text(`• ${aq}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Research Instruments
      if (Array.isArray(sa.researchInstruments) && sa.researchInstruments.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Research Instruments:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.researchInstruments.forEach(ri => {
          pdf.text(`• ${ri}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Pastoral Functions
      if (Array.isArray(sa.pastoralFunctions) && sa.pastoralFunctions.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Pastoral Functions:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.pastoralFunctions.forEach(pf => {
          pdf.text(`• ${pf}`, 50, y);
          y += 12;
        });
        y += 4;
      }
      // Other Contributions
      if (Array.isArray(sa.otherContributions) && sa.otherContributions.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text("Other Contributions:", 40, y);
        y += 14;
        pdf.setFont(undefined, 'normal');
        sa.otherContributions.forEach(oc => {
          pdf.text(`• ${oc}`, 50, y);
          y += 12;
        });
        y += 4;
      }
    }
    // Scholars Supervised
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(13);
    pdf.text("Scholars Supervised", 40, y);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(12);
    y += 18;
    const scholarsSupervised = scholars.filter(s => s.supervisor && (s.supervisor._id === selectedFaculty._id || s.supervisor === selectedFaculty._id));
    if (scholarsSupervised.length > 0) {
      autoTable(pdf, {
        startY: y,
        head: [["Name", "Area", "Semester", "Program", "Joining", "Completion"]],
        body: scholarsSupervised.map(s => [
          s.name,
          s.areaOfResearch || '-',
          s.semester || '-',
          s.program || '-',
          s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString('en-IN') : '-',
          s.dateOfCompletion ? new Date(s.dateOfCompletion).toLocaleDateString('en-IN') : '-'
        ]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 40, right: 40 },
        tableWidth: 480,
      });
      y = pdf.lastAutoTable.finalY + 24;
    } else {
      pdf.text("No scholars supervised.", 40, y);
      y += 24;
    }
    // OD Requests
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(13);
    pdf.text("OD Requests", 40, y);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(12);
    y += 18;
    const facultyOD = odRequests.filter(r => r.name === selectedFaculty.name);
    if (facultyOD.length > 0) {
      autoTable(pdf, {
        startY: y,
        head: [["Type", "Event", "Dates", "Status"]],
        body: facultyOD.map(r => [r.requestType, r.topic || '-', r.startDate ? `${new Date(r.startDate).toLocaleDateString('en-IN')}${r.endDate ? ' - ' + new Date(r.endDate).toLocaleDateString('en-IN') : ''}` : '-', r.status]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 40, right: 40 },
        tableWidth: 480,
      });
      y = pdf.lastAutoTable.finalY + 24;
    } else {
      pdf.text("No OD requests.", 40, y);
      y += 24;
    }
    // FDPs
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(13);
    pdf.text("Faculty Development Programs (FDPs)", 40, y);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(12);
    y += 18;
    const facultyFDP = odRequests.filter(r => r.name === selectedFaculty.name && r.eventType && r.eventType.toLowerCase().includes('fdp'));
    if (facultyFDP.length > 0) {
      autoTable(pdf, {
        startY: y,
        head: [["FDP Name", "Dates", "Status"]],
        body: facultyFDP.map(r => [r.topic || '-', r.startDate ? `${new Date(r.startDate).toLocaleDateString('en-IN')}${r.endDate ? ' - ' + new Date(r.endDate).toLocaleDateString('en-IN') : ''}` : '-', r.status]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 40, right: 40 },
        tableWidth: 480,
      });
      y = pdf.lastAutoTable.finalY + 24;
    } else {
      pdf.text("No FDPs found.", 40, y);
      y += 24;
    }
    // Conferences
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(13);
    pdf.text("Conferences", 40, y);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(12);
    y += 18;
    const facultyConfsOD = odRequests.filter(r => r.name === selectedFaculty.name && r.eventType && r.eventType.toLowerCase() === 'conference');
    const facultyConfsCR = Object.values(facultyConferences).find(f => f.name === selectedFaculty.name)?.conferences || [];
    if (facultyConfsOD.length > 0 || facultyConfsCR.length > 0) {
      if (facultyConfsOD.length > 0) {
        autoTable(pdf, {
          startY: y,
          head: [["Conference Name", "Dates", "Status"]],
          body: facultyConfsOD.map(r => [r.topic || '-', r.startDate ? `${new Date(r.startDate).toLocaleDateString('en-IN')}${r.endDate ? ' - ' + new Date(r.endDate).toLocaleDateString('en-IN') : ''}` : '-', r.status]),
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 4 },
          margin: { left: 40, right: 40 },
          tableWidth: 480,
        });
        y = pdf.lastAutoTable.finalY + 12;
      }
      if (facultyConfsCR.length > 0) {
        autoTable(pdf, {
          startY: y,
          head: [["Conference Name"]],
          body: facultyConfsCR.map(c => [c]),
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 4 },
          margin: { left: 40, right: 40 },
          tableWidth: 480,
        });
        y = pdf.lastAutoTable.finalY + 12;
      }
    } else {
      pdf.text("No conferences found.", 40, y);
      y += 24;
    }
    // Publications
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(13);
    pdf.text("Publications", 40, y);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(12);
    y += 18;
    const facultyPubs = publications.filter(p => {
      if (Array.isArray(p.authors)) return p.authors.includes(selectedFaculty.name);
      return p.authors === selectedFaculty.name;
    });
    if (facultyPubs.length > 0) {
      autoTable(pdf, {
        startY: y,
        head: [["Title", "Type", "Date"]],
        body: facultyPubs.map(p => [p.title || '-', p.type || '-', p.publicationDate ? new Date(p.publicationDate).toLocaleDateString('en-IN') : '-']),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 40, right: 40 },
        tableWidth: 480,
      });
      y = pdf.lastAutoTable.finalY + 24;
    } else {
      pdf.text("No publications found.", 40, y);
      y += 24;
    }
    pdf.save(`consolidated_report_${selectedFaculty.name.replace(/\s+/g, '_')}.pdf`);
  }

  // Publications statistics
  const totalPublications = selectedFacultyId
    ? publications.filter(p => (Array.isArray(p.authors) ? p.authors.includes(selectedFaculty?.name) : p.authors === selectedFaculty?.name)).length
    : publications.length;

  // --- UI Components ---
  function StatCard({ title, value, color }) {
    return (
      <div className={`bg-white rounded-lg shadow p-3 flex flex-col items-center justify-center border-t-4 ${color} mb-2 min-h-[80px] max-w-[170px] mx-auto aspect-[5/3]`}> 
        <div className="text-2xl font-bold mb-0.5">{value}</div>
        <div className="text-base font-medium text-gray-700 text-center leading-tight">{title}</div>
      </div>
    );
  }

  // --- UI Section: FDP Participation ---
  // function FacultyFDPSection() {
  //   const hasFDPs = odFDPRequests.length > 0;
  //   return (
  //     <section className="bg-white rounded-xl shadow p-6 mt-10">
  //       <h2 className="text-2xl font-semibold mb-4">Faculty Development Programs (FDPs)</h2>
  //       {!hasFDPs && (
  //         <div className="text-gray-500 mb-4">
  //           No Faculty Development Program data available.<br />
  //           <span className="text-yellow-700 font-semibold">Recommendation:</span> Please add structured FDP records in the faculty management section for better analytics.<br />
  //           <span className="text-xs">(Recommended: Add a dedicated FDP model and entry form in the admin panel.)</span>
  //         </div>
  //       )}
  //       {hasFDPs && (
  //         <div className="mb-4">
  //           <div className="overflow-x-auto">
  //             <table className="min-w-[400px] bg-gray-50 rounded shadow text-sm">
  //               <thead className="bg-indigo-100">
  //                 <tr>
  //                   <th className="px-3 py-2 text-left">Faculty</th>
  //                   <th className="px-3 py-2 text-left">FDP Name</th>
  //                   <th className="px-3 py-2 text-left">Dates</th>
  //                   <th className="px-3 py-2 text-left">Status</th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {odFDPRequests.map((r, idx) => (
  //                   <tr key={r._id || idx} className="border-b">
  //                     <td className="px-3 py-2">{r.name}</td>
  //                     <td className="px-3 py-2">{r.topic || '-'}</td>
  //                     <td className="px-3 py-2">{r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : '-'}{r.endDate ? ' - ' + new Date(r.endDate).toLocaleDateString('en-IN') : ''}</td>
  //                     <td className="px-3 py-2">{r.status}</td>
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </table>
  //           </div>
  //         </div>
  //       )}
  //     </section>
  //   );
  // }

  // --- UI Section: FDP/Conference Participation ---
  function FacultyConferenceSection() {
    const hasCRConfs = Object.values(facultyConferences).some(f => f.conferences.length > 0);
    const hasODConfs = odConferenceRequests.length > 0;
    return (
      <section className="bg-white rounded-xl shadow p-6 mt-10">
        <h2 className="text-2xl font-semibold mb-4">Faculty Development Programs & Conferences</h2>
        {(!hasCRConfs && !hasODConfs) && (
          <div className="text-gray-500 mb-4">
            No Faculty Development Program or Conference data available.<br />
            <span className="text-yellow-700 font-semibold">Recommendation:</span> Please add structured FDP and Conference records in the faculty management section for better analytics.
          </div>
        )}
        {hasCRConfs && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">Conferences (from Self-Assessment Reports)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-[400px] bg-gray-50 rounded shadow text-sm">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Faculty</th>
                    <th className="px-3 py-2 text-left">Conference Name</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(facultyConferences).flatMap(f =>
                    f.conferences.map((conf, idx) => (
                      <tr key={f.name + idx} className="border-b">
                        <td className="px-3 py-2">{f.name}</td>
                        <td className="px-3 py-2">{conf}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {hasODConfs && (
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Conferences (from OD Requests)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-[400px] bg-gray-50 rounded shadow text-sm">
                <thead className="bg-green-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Faculty</th>
                    <th className="px-3 py-2 text-left">Conference Name</th>
                    <th className="px-3 py-2 text-left">Dates</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {odConferenceRequests.map((r, idx) => (
                    <tr key={r._id || idx} className="border-b">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.topic || '-'}</td>
                      <td className="px-3 py-2">{r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : '-'}{r.endDate ? ' - ' + new Date(r.endDate).toLocaleDateString('en-IN') : ''}</td>
                      <td className="px-3 py-2">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-10">
      <h1 className="text-3xl font-bold mb-6">Faculty Statistics</h1>
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <label className="font-semibold text-lg">Export Consolidated Report for</label>
        <select
          className="border rounded px-4 py-2 min-w-[200px]"
          value={selectedFacultyId}
          onChange={e => setSelectedFacultyId(e.target.value)}
        >
          <option value="">Select Faculty</option>
          {facultyOptions.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <button
          className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition font-semibold disabled:opacity-50"
          onClick={() => {
            const facultyObj = faculty.find(f => f._id === selectedFacultyId);
            if (facultyObj) {
              navigate(`/admin/consolidation-report/faculty/${encodeURIComponent(facultyObj.name)}`);
            }
          }}
          disabled={!selectedFacultyId}
        >
          Show Analytics
        </button>
      </div>
      {/* Analytics for Selected Faculty */}
      {selectedFaculty && (
        <section className="bg-white rounded-xl shadow p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Analytics for {selectedFaculty.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-bold mb-2">Basic Info</h3>
              <ul className="text-base space-y-1">
                <li><b>Department:</b> {selectedFaculty.department || '-'}</li>
                <li><b>Position:</b> {selectedFaculty.position || '-'}</li>
                <li><b>Email:</b> {selectedFaculty.contactInfo?.email || '-'}</li>
                <li><b>Phone:</b> {selectedFaculty.contactInfo?.phone || '-'}</li>
                <li><b>Gender:</b> {selectedFaculty.gender || '-'}</li>
                <li><b>Date of Birth:</b> {selectedFaculty.dob ? new Date(selectedFaculty.dob).toLocaleDateString('en-IN') : '-'}</li>
                <li><b>Date of Joining:</b> {selectedFaculty.dateOfJoining ? new Date(selectedFaculty.dateOfJoining).toLocaleDateString('en-IN') : '-'}</li>
                <li><b>Active:</b> {selectedFaculty.isActive ? "Yes" : "No"}</li>
                <li><b>Years of Experience:</b> {selectedFaculty.dateOfJoining ? (new Date().getFullYear() - new Date(selectedFaculty.dateOfJoining).getFullYear()) : '-'}</li>
                <li><b>Areas of Expertise:</b> {selectedFaculty.areasOfExpertise?.join(", ") || '-'}</li>
              </ul>
            </div>
            {/* Publications */}
            <div>
              <h3 className="font-bold mb-2">Publications</h3>
              <div>Total Publications: {publications.filter(p => (Array.isArray(p.authors) ? p.authors.includes(selectedFaculty.name) : p.authors === selectedFaculty.name)).length}</div>
            </div>
            {/* OD Requests */}
            <div>
              <h3 className="font-bold mb-2">OD Requests</h3>
              <div>Total OD Requests: {odRequests.filter(r => r.name === selectedFaculty.name).length}</div>
            </div>
            {/* CR Reports */}
            <div>
              <h3 className="font-bold mb-2">CR Reports</h3>
              <div>Total CR Reports: {crReports.filter(r => (r.facultyId === selectedFaculty.facultyId || r.faculty?._id === selectedFaculty._id || r.faculty?.name === selectedFaculty.name)).length}</div>
            </div>
            {/* Scholars Supervised */}
            <div>
              <h3 className="font-bold mb-2">Scholars Supervised</h3>
              <div className="overflow-x-auto">
                <table className="min-w-[600px] bg-gray-50 rounded shadow text-sm mt-2">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Area</th>
                      <th className="px-3 py-2 text-left">Semester</th>
                      <th className="px-3 py-2 text-left">Program</th>
                      <th className="px-3 py-2 text-left">Joining</th>
                      <th className="px-3 py-2 text-left">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scholars.filter(s => s.supervisor?.name === selectedFaculty.name).map((s, idx) => (
                      <tr key={s._id || idx} className="border-b">
                        <td className="px-3 py-2">{s.name}</td>
                        <td className="px-3 py-2">{s.areaOfResearch || '-'}</td>
                        <td className="px-3 py-2">{s.semester || '-'}</td>
                        <td className="px-3 py-2">{s.program || '-'}</td>
                        <td className="px-3 py-2">{s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="px-3 py-2">{s.dateOfCompletion ? new Date(s.dateOfCompletion).toLocaleDateString('en-IN') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
      <FacultyConferenceSection />
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold mb-4">Demographics & Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 mb-6">
          <StatCard title="Total Faculty" value={totalFaculty} color="border-blue-600" />
          <StatCard title="Active Faculty" value={activeFaculty} color="border-green-500" />
          <StatCard title="Inactive Faculty" value={inactiveFaculty} color="border-red-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Active vs Inactive Pie */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-lg">Active vs. Inactive</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[{ name: 'Active', value: activeFaculty }, { name: 'Inactive', value: inactiveFaculty }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  <Cell fill="#34d399" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* By Department Bar */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-lg">Faculty by Department</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={Object.entries(facultyByDept).map(([dept, count]) => ({ dept, count }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="dept" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* By Position Bar */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-lg">Faculty by Position</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={Object.entries(facultyByPosition).map(([pos, count]) => ({ pos, count }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="pos" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e42" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Gender Pie */}
          {Object.keys(facultyByGender).length > 1 && (
            <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
              <h3 className="font-semibold mb-2 text-lg">Gender Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={Object.entries(facultyByGender).map(([gender, value]) => ({ name: gender, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    <Cell fill="#60a5fa" />
                    <Cell fill="#fbbf24" />
                    <Cell fill="#a3e635" />
                    <Cell fill="#f472b6" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
      <section className="space-y-8 mt-10">
        <h2 className="text-2xl font-semibold mb-4">Experience & Tenure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Experience Distribution */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-lg">Experience Distribution (Years)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={experienceDist} margin={{ left: 20, right: 20 }}>
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Longest-Serving Faculty */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-lg">Longest-Serving Faculty</h3>
            <ul className="w-full text-sm">
              {longestServing.map(f => (
                <li key={f._id} className="flex justify-between border-b py-1">
                  <span>{f.name}</span>
                  <span>{f.years} yrs (Joined {f.dateOfJoining ? new Date(f.dateOfJoining).getFullYear() : '-'})</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Recent Joinees */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-lg">Recent Joinees</h3>
            <ul className="w-full text-sm">
              {recentJoinees.map(f => (
                <li key={f._id} className="flex justify-between border-b py-1">
                  <span>{f.name}</span>
                  <span>Joined {f.dateOfJoining ? new Date(f.dateOfJoining).toLocaleDateString('en-IN') : '-'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <div className="text-gray-500">(Statistics and analytics coming soon...)</div>
    </div>
  );
}

// Helper: groupBy
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    acc[key] = acc[key] ? acc[key] + 1 : 1;
    return acc;
  }, {});
} 