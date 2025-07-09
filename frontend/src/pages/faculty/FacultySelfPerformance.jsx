import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./FacultySelfPerformance.module.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoPng from "../../assests/anna_univ_logo.png";
import LogoutButton from "../../components/LogoutButton";
import { apiFetch } from "../../utils/api";
import BarChart from "../../components/barchart";

const FacultySelfPerformance = () => {
  const { currentUser } = useAuth();
  const [facultyCourses, setFacultyCourses] = useState([]);
  const [courseBatchStats, setCourseBatchStats] = useState({});
  const [yearlyPerformance, setYearlyPerformance] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        // Fetch courses assigned to this faculty (regular)
        const coursesResponse = await apiFetch(
          `http://localhost:5000/api/assignments/faculty/${currentUser.facultyRef}`
        );
        let coursesData = [];
        if (coursesResponse.ok) {
          coursesData = await coursesResponse.json();
        }
        // Fetch elective courses assigned to this faculty
        const electiveCoursesResponse = await apiFetch(
          `http://localhost:5000/api/electiveCourseFacultyAssignment/faculty/${currentUser.facultyRef}`
        );
        let electiveCoursesData = [];
        if (electiveCoursesResponse.ok) {
          electiveCoursesData = await electiveCoursesResponse.json();
        }
        // Map elective courses to match the regular assignment structure
        const mappedElectives = electiveCoursesData.map((e) => ({
          course: e.electiveCourse,
          batch: e.batch,
          semester: e.electiveCourse?.semester,
          isElective: true,
        }));
        // Combine regular and elective courses
        const allCourses = [
          ...coursesData.map((c) => ({ ...c, isElective: false })),
          ...mappedElectives,
        ];
        setFacultyCourses(allCourses);
        // Fetch yearly performance data (already includes all feedbacks)
        const yearlyResponse = await apiFetch(
          `http://localhost:5000/api/feedback/faculty/yearly/${currentUser.facultyRef}`
        );
        if (yearlyResponse.ok) {
          const yearlyData = await yearlyResponse.json();
          setYearlyPerformance(yearlyData);
        }
        // Fetch per-course, per-batch stats for all courses
        const stats = {};
        for (const assignment of allCourses) {
          if (!assignment.course?._id || !assignment.batch) continue;
          const res = await apiFetch(
            `http://localhost:5000/api/faculties/${currentUser.facultyRef}/performance/course/${assignment.course._id}/batch/${assignment.batch}`
          );
          if (res.ok) {
            const data = await res.json();
            stats[`${assignment.course._id}_${assignment.batch}`] = data;
          }
        }
        setCourseBatchStats(stats);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFacultyData();
  }, [currentUser.facultyRef]);

  function getAcademicYear() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() is 0-based

    // If current month is June or later, academic year starts this year
    const startYear = month >= 6 ? year : year - 1;
    const endYear = String(startYear + 1);

    return `${startYear}-${endYear.substring(2, 4)}`;
  }

  // PDF Download Handler for a course+batch
  const handleDownloadPDF = (assignment, stat) => {
    const doc = new jsPDF();
    doc.addImage(logoPng, "PNG", 10, 10, 30, 28);
    doc.setFontSize(14);
    doc.text("ANNA UNIVERSITY :: CHENNAI - 600025", 105, 20, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text("STUDENTS FEEDBACK FORM", 105, 28, { align: "center" });
    doc.setFontSize(10);
    doc.text("(Based on Higher Education G.O(Ms).No.19, dt 14/1/20)", 105, 34, {
      align: "center",
    });
    // Build the body rows for the course details
    const bodyRows = [
      ["Course", ":", "B.E - COMPUTER SCIENCE ENGINEERING [FULL TIME]"],
      [
        "Academic Year & Semester",
        ":",
        getAcademicYear() + " - " + (assignment.semester || "-"),
      ],
      ["Subject", ":", assignment.course?.name || "-"],
      ["Instructor", ":", currentUser?.name || "-"],
      ["Batch", ":", assignment.batch || "-"],
    ];
    // Only add semester row if not elective
    if (!assignment.isElective) {
      bodyRows.push(["Semester", ":", assignment.semester || "-"]);
    }
    autoTable(doc, {
      startY: 40,
      theme: "plain",
      styles: { fontSize: 10 },
      body: bodyRows,
      tableLineWidth: 0.1,
      tableLineColor: [0, 0, 0],
      margin: { left: 20, right: 20 },
    });
    // Feedback table
    const feedbackRows = (stat?.questionTexts || []).map((q, i) => [
      `${i + 1}. ${q}`,
      typeof stat?.questionRatings?.[i] === "number"
        ? stat.questionRatings[i].toFixed(2)
        : "N/A",
    ]);
    feedbackRows.push([
      "Average Score",
      stat?.questionRatings
        ? (
            stat.questionRatings.reduce((sum, q) => sum + q, 0) /
            stat.questionRatings.length
          ).toFixed(2)
        : "N/A",
    ]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      head: [["", "Out of 5"]],
      body: feedbackRows,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: { 1: { halign: "center" } },
      margin: { left: 20, right: 20, top: 20 },
    });
    doc.save(
      `${currentUser?.name || "faculty"}_${
        assignment.course?.name || "course"
      }_${assignment.batch}_performance.pdf`
    );
  };

  // Helper function to get performance color
  const getPerformanceColor = (score) => {
    if (score >= 20) return "#1cc88a";
    if (score >= 15) return "#f6c23e";
    return "#e74a3b";
  };

  const years = Object.keys(yearlyPerformance).sort();

  // Compute total feedbacks given
  const totalFeedbacks = Object.values(courseBatchStats).reduce(
    (sum, stat) => sum + (stat?.totalFeedbacks || 0),
    0
  );

  // Compute overall average question-wise ratings
  const questionSums = [];
  const questionCounts = [];
  let questionTexts = [];
  Object.values(courseBatchStats).forEach((stat) => {
    if (stat?.questionRatings && stat?.questionTexts) {
      stat.questionRatings.forEach((rating, i) => {
        if (!questionSums[i]) {
          questionSums[i] = 0;
          questionCounts[i] = 0;
          questionTexts[i] = stat.questionTexts[i];
        }
        questionSums[i] += rating;
        questionCounts[i] += 1;
      });
    }
  });
  const overallQuestionAverages = questionSums.map((sum, i) =>
    questionCounts[i] ? (sum / questionCounts[i]).toFixed(2) : "N/A"
  );

  if (loading) {
    return <div className={styles.performanceViewWrapper}>Loading...</div>;
  }
  if (error) {
    return <div className={styles.performanceViewWrapper}>{error}</div>;
  }

  return (
    <div className={styles.performanceViewWrapper}>
      {/* Page Heading */}
      <div className={styles.pageHeader}>
        <img
          src={logoPng}
          alt="Anna University Logo"
          className={styles.headerLogo}
        />
        <div className={styles.headerTextGroup}>
          <h1 className={styles.pageTitle}>
            Faculty Self Performance Dashboard
          </h1>
          <div className={styles.pageSubtitle}>
            Empowering Excellence through Feedback
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <LogoutButton />
      </div>
      {/* Faculty Header */}
      <div className={styles.performanceHeader}>
        <div className={styles.performanceAvatar}>
          {currentUser?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className={styles.performanceName}>{currentUser?.name}</div>
          <div className={styles.performanceDesignation}>
            {currentUser?.designation}
          </div>
          <div className={styles.performanceId}>ID: {currentUser?.id}</div>
        </div>
      </div>
      {/* Overall Performance Score */}
      <div className={styles.overallScoreSection}>
        <h3>Overall Performance Score</h3>
        <div
          style={{
            display: "flex",
            gap: "32px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div className={styles.scoreCard}>
            <div className={styles.scoreValue}>
              {(() => {
                const scores = Object.values(yearlyPerformance || {}).filter(
                  (v) => typeof v === "number"
                );
                if (!scores.length) return "0.00";
                return (
                  scores.reduce((a, b) => a + b, 0) / scores.length
                ).toFixed(2);
              })()}
              <span className={styles.scoreMax}>/25</span>
            </div>
            <div style={{ color: "#7b8a97", fontSize: "1rem", marginTop: 4 }}>
              Overall Score
            </div>
          </div>
          <div className={styles.scoreCard}>
            <div className={styles.scoreValue}>{totalFeedbacks}</div>
            <div style={{ color: "#7b8a97", fontSize: "1rem", marginTop: 4 }}>
              Total Feedbacks
            </div>
          </div>
          <div className={styles.scoreCard}>
            <div className={styles.scoreValue}>{facultyCourses.length}</div>
            <div style={{ color: "#7b8a97", fontSize: "1rem", marginTop: 4 }}>
              Courses Taught
            </div>
          </div>
        </div>
        {overallQuestionAverages.length > 0 && (
          <div className={styles.section} style={{ marginTop: 24 }}>
            <h4>Average Question-wise Ratings (All Courses & Batches)</h4>
            <div className={styles.questionAveragesGrid}>
              {overallQuestionAverages.map((avg, i) => (
                <div key={i} className={styles.questionAverageBox}>
                  <div className={styles.questionText}>{questionTexts[i]}</div>
                  <div className={styles.ratingRow}>
                    <span className={styles.ratingValue}>{avg}/5</span>
                    <span className={styles.ratingStars}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span
                          key={j}
                          className={
                            j < Math.round(Number(avg))
                              ? styles.starFilled
                              : styles.starEmpty
                          }
                        >
                          ★
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Courses Taken */}
      {facultyCourses.length > 0 && (
        <div className={styles.section}>
          <h3>Courses Taken</h3>
          <div className={styles.coursesGrid}>
            {facultyCourses.map((assignment, index) => {
              const stat =
                courseBatchStats[
                  `${assignment.course?._id}_${assignment.batch}`
                ];
              const avgRating =
                stat && stat.questionRatings && stat.questionRatings.length > 0
                  ? stat.questionRatings.reduce((a, b) => a + b, 0) /
                    stat.questionRatings.length
                  : 0;
              const isExpanded = expandedIndex === index;
              return (
                <div
                  className={
                    styles.courseCard +
                    (isExpanded ? " " + styles.expandedCourseCard : "")
                  }
                  key={index}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  style={{
                    cursor: "pointer",
                    boxShadow: isExpanded
                      ? "0 4px 16px rgba(52, 152, 219, 0.25)"
                      : "0 2px 4px rgba(0,0,0,0.08)",
                    border: isExpanded
                      ? "2px solid #3498db"
                      : "1px solid #e0e0e0",
                    transition: "all 0.3s cubic-bezier(.4,2,.6,1)",
                    marginBottom: "1rem",
                  }}
                >
                  <div className={styles.courseHeader}>
                    <h4 style={{ color: isExpanded ? "#3498db" : undefined }}>
                      {assignment.course?.name || "Unknown Course"}
                      {assignment.isElective && (
                        <span
                          style={{
                            color: "#e67e22",
                            fontSize: 13,
                            marginLeft: 8,
                          }}
                        >
                          (Elective)
                        </span>
                      )}
                    </h4>
                    <span className={styles.courseCode}>
                      {assignment.course?.code || "N/A"}
                    </span>
                  </div>
                  <div className={styles.courseDetails}>
                    <div className={styles.courseInfo}>
                      <span>Semester: {assignment.semester}</span>
                      <span>Batch: {assignment.batch}</span>
                      <span>
                        Total Feedbacks: {stat?.totalFeedbacks ?? "N/A"}
                      </span>
                    </div>
                    <div className={styles.courseRating}>
                      <div className={styles.ratingStars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={
                              i < avgRating
                                ? styles.starFilled
                                : styles.starEmpty
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <div className={styles.ratingValue}>
                        {avgRating.toFixed(1)}/5
                      </div>
                    </div>
                  </div>
                  {/* Per-course, per-batch stats, only show if expanded */}
                  {isExpanded && stat && (
                    <div
                      className={styles.courseBatchStats}
                      style={{
                        background: "#f4faff",
                        borderRadius: "8px",
                        marginTop: "1rem",
                        padding: "1rem",
                        border: "1px solid #d0e6f7",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#2980b9" }}>
                        Batch Avg Score:{" "}
                        {stat.avgScore ? stat.avgScore.toFixed(2) : "N/A"}/25
                      </div>
                      {stat.questionRatings &&
                        stat.questionRatings.length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <strong>Question Ratings:</strong>
                            <ol style={{ margin: 0, paddingLeft: 20 }}>
                              {stat.questionRatings.map((rating, i) => (
                                <li key={i} style={{ marginBottom: 4 }}>
                                  <span style={{ color: "#34495e" }}>
                                    {stat.questionTexts[i]}
                                  </span>
                                  :
                                  <span
                                    style={{ color: "black", fontWeight: 500 }}
                                  >
                                    {"  " + rating.toFixed(1)}/5
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(assignment, stat);
                        }}
                        style={{
                          marginTop: 12,
                          background: "#4e73df",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          padding: "8px 16px",
                          cursor: "pointer",
                        }}
                      >
                        Download PDF
                      </button>
                    </div>
                  )}
                  <div style={{ textAlign: "right", marginTop: 8 }}>
                    <span style={{ color: "#3498db", fontSize: 13 }}>
                      {isExpanded ? "Click to collapse ▲" : "Click to expand ▼"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Yearly Performance Section */}
      <div className={styles.yearlyPerformanceSection}>
        <h3>Yearly Performance</h3>
        {/* Show average or latest year as a number */}
        {/* <div className={styles.yearlyPerformanceNumber}>
          {(() => {
            const vals = Object.values(yearlyPerformance).filter(
              (v) => typeof v === "number"
            );
            if (vals.length === 0) return "N/A";
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            return "Average: " + avg.toFixed(2);
          })()}
        </div> */}
        {/* Show the bar chart for yearly performance */}
        <BarChart
          labels={Object.keys(yearlyPerformance)}
          data={Object.values(yearlyPerformance)}
          label="Performance"
          backgroundColor="#4e73df"
        />
      </div>
      {/* No Data Message */}
      {facultyCourses.length === 0 && years.length === 0 && (
        <div className={styles.noDataMessage}>
          <p>No course assignments or performance data available for you.</p>
        </div>
      )}
    </div>
  );
};

export default FacultySelfPerformance;
