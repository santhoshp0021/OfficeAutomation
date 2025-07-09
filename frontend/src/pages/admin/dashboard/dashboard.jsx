import React, { useEffect, useState } from "react";
import "./dashboard.css";
import StatCard from "../../../components/statcard/statcard";
import BarChart from "../../../components/barchart.jsx";
import PieChart from "../../../components/piechart.jsx";
import { useAuth } from "../../../contexts/AuthContext";
import { apiFetch } from '../../../utils/api';
import { 
  FaUsers, 
  FaComments, 
  FaGraduationCap, 
  FaChalkboardTeacher,
  FaStar,
  FaArrowUp,
  FaTrendingDown,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaBook
} from "react-icons/fa";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    feedbacks: 0,
    grievances: 0,
    students: 0,
    faculties: 0,
    grievanceDetails: {},
    topRatedFaculty: [],
    recentGrievances: [],
    feedbackTrends: {},
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch basic stats
        const [feedbacks, grievanceStats, students, faculties, courses, grievances] = await Promise.all([
          apiFetch("http://localhost:5000/api/feedback").then((res) => res.json()),
          apiFetch("http://localhost:5000/api/grievances/stats/overview").then((res) => res.json()),
          apiFetch("http://localhost:5000/api/students").then((res) => res.json()),
          apiFetch("http://localhost:5000/api/faculties").then((res) => res.json()),
          apiFetch("http://localhost:5000/api/courses").then((res) => res.json()),
          apiFetch("http://localhost:5000/api/grievances").then((res) => res.json()),
        ]);

        // Fetch top rated faculty
        const facultiesWithRatings = await Promise.all(
          faculties.map(async (faculty) => {
            try {
              const avgResponse = await apiFetch(
                `http://localhost:5000/api/feedback/faculty/avg/${faculty._id}`
              );
              const ratingsResponse = await apiFetch(
                `http://localhost:5000/api/feedback/faculty/ratings/${faculty._id}`
              );
              
              let avgScore = 0;
              let questionRatings = [];
              
              if (avgResponse.ok) {
                const avgData = await avgResponse.json();
                avgScore = avgData.averageScore || 0;
              }
              
              if (ratingsResponse.ok) {
                const ratingsData = await ratingsResponse.json();
                questionRatings = ratingsData.ratings || [];
              }
              
              const averageRating = questionRatings.length > 0 
                ? questionRatings.reduce((sum, rating) => sum + rating, 0) / questionRatings.length 
                : 0;
              
              return {
                ...faculty,
                avgScore,
                averageRating,
                questionRatings
              };
            } catch (error) {
              console.error(`Error fetching stats for faculty ${faculty._id}:`, error);
              return {
                ...faculty,
                avgScore: 0,
                averageRating: 0,
                questionRatings: []
              };
            }
          })
        );

        // Sort faculty by average rating and get top 5
        const topRatedFaculty = facultiesWithRatings
          .filter(faculty => faculty.averageRating > 0)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 3);

        // Calculate overall average rating
        // const overallAverageRating = facultiesWithRatings.length > 0
        //   ? facultiesWithRatings.reduce((sum, faculty) => sum + faculty.averageRating, 0) / facultiesWithRatings.length
        //   : 0;

        // Get recent grievances (last 5)
        const recentGrievances = Array.isArray(grievances) 
          ? grievances.slice(0, 5).map(grievance => ({
              ...grievance,
              date: new Date(grievance.createdAt).toLocaleDateString()
            }))
          : [];

        setStats({
          feedbacks: Array.isArray(feedbacks) ? feedbacks.length : 0,
          grievances: grievanceStats.total || 0,
          students: Array.isArray(students) ? students.length : 0,
          faculties: Array.isArray(faculties) ? faculties.length : 0,
          courses: Array.isArray(courses) ? courses.length : 0,
          grievanceDetails: grievanceStats,
          topRatedFaculty,
          recentGrievances,
          totalCourses: Array.isArray(courses) ? courses.length : 0,
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard stats");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getPerformanceLevel = (score) => {
    if (score >= 4.0) return { level: "Excellent", color: "#1cc88a" };
    if (score >= 3.5) return { level: "Good", color: "#36b9cc" };
    if (score >= 3.0) return { level: "Average", color: "#f6c23e" };
    return { level: "Needs Improvement", color: "#e74a3b" };
  };

  const getGrievanceStatusIcon = (status) => {
    switch (status) {
      case "pending": return <FaClock style={{ color: "#f6c23e" }} />;
      case "inProgress": return <FaExclamationTriangle style={{ color: "#36b9cc" }} />;
      case "resolved": return <FaCheckCircle style={{ color: "#1cc88a" }} />;
      case "rejected": return <FaTimesCircle style={{ color: "#e74a3b" }} />;
      default: return <FaClock style={{ color: "#6c757d" }} />;
    }
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading dashboard stats...</p>
    </div>
  );
  
  if (error) return (
    <div className="dashboard-error">
      <FaExclamationTriangle />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Enhanced User Info Section */}
      <div className="dashboard__user-info">
        <div className="user-info__header">
          <div className="user-info__avatar">
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info__details">
            <h2>Welcome back, {currentUser?.name}!</h2>
            <p>Here's what's happening in your department today</p>
          </div>
        </div>
        <div className="user-info__badges">
          <div className="info-badge">
            <FaChalkboardTeacher />
            <span><strong>Role:</strong> {currentUser?.role?.toUpperCase()}</span>
          </div>
          <div className="info-badge">
            <FaGraduationCap />
            <span><strong>ID:</strong> {currentUser?.id}</span>
          </div>
          {currentUser?.designation && (
            <div className="info-badge">
              <FaUsers />
              <span><strong>Designation:</strong> {currentUser.designation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="dashboard__stats">
        <StatCard 
          title="Total Feedbacks" 
          value={stats.feedbacks} 
          icon={FaComments} 
          color="blue" 
        />
        <StatCard 
          title="Active Grievances" 
          value={stats.grievances} 
          icon={FaExclamationTriangle} 
          color="orange" 
          highlight={stats.grievances > 0}
        />
        <StatCard 
          title="Total Students" 
          value={stats.students} 
          icon={FaGraduationCap} 
          color="green" 
        />
        <StatCard 
          title="Faculty Members" 
          value={stats.faculties} 
          icon={FaChalkboardTeacher} 
          color="purple" 
        />
        <StatCard 
          title="Total Courses" 
          value={stats.totalCourses} 
          icon={FaBook} 
          color="teal" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard__main">
        {/* Top Rated Faculty Section */}
        <div className="dashboard__section dashboard__top-faculty">
          <div className="section-header">
            <h3><FaStar /> Top Rated Faculty</h3>
            <p>Faculty with highest student ratings</p>
          </div>
          <div className="top-faculty-list">
            {stats.topRatedFaculty.length > 0 ? (
              stats.topRatedFaculty.map((faculty, index) => {
                const performance = getPerformanceLevel(faculty.averageRating);
                return (
                  <div key={faculty._id} className="faculty-card">
                    <div className="faculty-rank">#{index + 1}</div>
                    <div className="faculty-avatar">
                      {faculty.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="faculty-info">
                      <h4>{faculty.name}</h4>
                      <p>{faculty.designation}</p>
                      <div className="faculty-stats">
                        <span className="rating">
                          <FaStar /> {faculty.averageRating.toFixed(1)}/5
                        </span>
                        <span className="score">
                          Score: {faculty.avgScore.toFixed(1)}/25
                        </span>
                      </div>
                    </div>
                    <div className="faculty-performance">
                      <span 
                        className="performance-badge"
                        style={{ backgroundColor: performance.color }}
                      >
                        {performance.level}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-data">
                <FaStar />
                <p>No faculty ratings available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Grievance Status Overview */}
        <div className="dashboard__section dashboard__grievances">
          <div className="section-header">
            <h3><FaComments /> Grievance Status Overview</h3>
            <p>Current grievance distribution</p>
          </div>
          <div className="grievance-stats">
            <div className="grievance-stat-card pending">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-content">
                <h4>Pending</h4>
                <span className="stat-number">{stats.grievanceDetails.pending || 0}</span>
              </div>
            </div>
            <div className="grievance-stat-card in-progress">
              <div className="stat-icon">
                <FaExclamationTriangle />
              </div>
              <div className="stat-content">
                <h4>In Progress</h4>
                <span className="stat-number">{stats.grievanceDetails.inProgress || 0}</span>
              </div>
            </div>
            {/* <div className="grievance-stat-card resolved">
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <h4>Resolved</h4>
                <span className="stat-number">{stats.grievanceDetails.resolved || 0}</span>
              </div>
            </div>
            <div className="grievance-stat-card rejected">
              <div className="stat-icon">
                <FaTimesCircle />
              </div>
              <div className="stat-content">
                <h4>Rejected</h4>
                <span className="stat-number">{stats.grievanceDetails.rejected || 0}</span>
              </div>
            </div> */}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard__section dashboard__recent">
          <div className="section-header">
            <h3><FaArrowUp /> Recent Grievances</h3>
            <p>Latest grievance submissions</p>
          </div>
          <div className="recent-activity">
            {stats.recentGrievances.length > 0 ? (
              stats.recentGrievances.map((grievance, index) => (
                <div key={grievance._id || index} className="activity-item">
                  <div className="activity-icon">
                    <FaExclamationTriangle />
                  </div>
                  <div className="activity-content">
                    <p><strong>New grievance</strong> submitted by {grievance.student?.name || 'Student'}</p>
                    <span className="activity-meta">
                      {grievance.date} • Status: {grievance.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <FaExclamationTriangle />
                <p>No recent grievances</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="dashboard__section dashboard__quick-actions">
          <div className="section-header">
            <h3><FaArrowUp /> Quick Actions</h3>
            <p>Common administrative tasks</p>
          </div>
          <div className="quick-actions-grid">
            <button className="action-btn">
              <FaUsers />
              <span>View All Students</span>
            </button>
            <button className="action-btn">
              <FaChalkboardTeacher />
              <span>Manage Faculty</span>
            </button>
            <button className="action-btn">
              <FaComments />
              <span>Review Grievances</span>
            </button>
            <button className="action-btn">
              <FaStar />
              <span>Faculty Performance</span>
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
