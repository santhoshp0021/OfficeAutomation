import React, { useState, useEffect } from "react";
import styles from "./GrievanceTable.module.css";
import { apiFetch } from "../../../utils/api";

const statusColors = {
  Pending: styles.statusOpen,
  "In Progress": styles.statusProgress,
  Resolved: styles.statusClosed,
  Rejected: styles.statusClosed,
};

const statusIcons = {
  Pending: "🟢",
  "In Progress": "🟡",
  Resolved: "🔴",
  Rejected: "🔴",
};

function GrievanceDetail({ grievance, onBack, onUpdateStatus }) {
  const [status, setStatus] = useState(grievance.status);
  const [adminResponse, setAdminResponse] = useState(
    grievance.adminResponse || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (
      !adminResponse.trim() &&
      (status === "Resolved" || status === "Rejected")
    ) {
      alert(
        "Please provide a response when resolving or rejecting a grievance."
      );
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateStatus(grievance._id, status, adminResponse);
      setIsUpdating(false);
    } catch (error) {
      setIsUpdating(false);
      alert("Failed to update grievance status.");
    }
  };

  return (
    <div className={styles.detailWrapper}>
      <div style={{display:"flex",flexDirection:"column",gap:"1rem", flex: 2}} >
        <button className={styles.backButton} onClick={onBack}>
          &larr; Back to List
        </button>
        <div className={styles.grievanceCard + " " + styles[grievance.status]}>
          <div className={styles.detailHeader}>
            <div className={styles.detailId}>
              <span className={styles.grievanceIcon}>⚠️</span>
              Grievance #{grievance._id.slice(-6)}
            </div>
            <div
              className={styles.statusBadge + " " + styles[grievance.status]}
            >
              {statusIcons[grievance.status]} {grievance.status}
            </div>
          </div>
          <div className={styles.detailBody}>
            <div className={styles.section}>
              <strong>Student:</strong> {grievance.student?.name || "Unknown"} (
              {grievance.student?.id || "N/A"})
            </div>
            <div className={styles.section}>
              <strong>Category:</strong> {grievance.category}
            </div>
            <div className={styles.section}>
              <strong>Subject:</strong> {grievance.subject}
            </div>
            <div className={styles.section}>
              <strong>Date:</strong>{" "}
              {new Date(grievance.createdAt).toLocaleDateString()}
            </div>
            <div className={styles.section}>
              <strong>Batch:</strong> {grievance.batch}
            </div>
            <div className={styles.section}>
              <strong>Semester:</strong> {grievance.semester}
            </div>
            <div className={styles.section}>
              <strong>Description:</strong>
              <div className={styles.descriptionBox}>
                {grievance.grievanceText}
              </div>
            </div>
            {grievance.adminResponse && (
              <div className={styles.section}>
                <strong>Admin Response:</strong>
                <div className={styles.responseBox}>
                  {grievance.adminResponse}
                </div>
              </div>
            )}
            {grievance.resolvedAt && (
              <div className={styles.section}>
                <strong>Resolved At:</strong>{" "}
                {new Date(grievance.resolvedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Section */}
      <div className={styles.statusUpdateSection}>
        <h3>Update Status</h3>
        <div className={styles.statusUpdateForm}>
          <div className={styles.formGroup}>
            <label>Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={styles.statusSelect}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Admin Response:</label>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Provide a response to the student..."
              className={styles.responseTextarea}
              rows="4"
            />
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className={styles.updateButton}
          >
            {isUpdating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Grievances = () => {
  const [grievances, setGrievances] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("http://localhost:5000/api/grievances");
      if (response.ok) {
        const data = await response.json();
        setGrievances(data);
      } else {
        throw new Error("Failed to fetch grievances");
      }
    } catch (error) {
      console.error("Error fetching grievances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (grievanceId, status, adminResponse) => {
    try {
      const response = await apiFetch(
        `http://localhost:5000/api/grievances/${grievanceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, adminResponse }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update grievance");
      }

      const updatedGrievance = await response.json();

      if (status === "Resolved" || status === "Rejected") {
        // If resolved or rejected, the grievance is deleted on the backend.
        // We just need to remove it from the local state.
        setGrievances((prev) => prev.filter((g) => g._id !== grievanceId));
        setSelected(null); // Go back to the list view
        alert(updatedGrievance.message); // Show the message from the backend
      } else {
        // For other statuses, we update the item in the list.
        setGrievances((prev) =>
          prev.map((g) =>
            g._id === grievanceId ? updatedGrievance.grievance : g
          )
        );
        // Update the selected grievance if it's the one being updated
        if (selected && selected._id === grievanceId) {
          setSelected(updatedGrievance.grievance);
        }
        alert("Grievance status updated successfully!");
      }
    } catch (error) {
      console.error("Error updating grievance:", error);
      throw error;
    }
  };

  const filteredData = grievances.filter((g) => {
    const matchesSearch =
      g.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.subject?.toLowerCase().includes(search.toLowerCase()) ||
      g.category?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? g.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (selected) {
    return (
      <GrievanceDetail
        grievance={selected}
        onBack={() => setSelected(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    );
  }

  if (loading) {
    return (
      <div className={styles.grievanceTableWrapper}>
        <h2>Grievances</h2>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          Loading grievances...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.grievanceTableWrapper}>
      <h2>Grievances</h2>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.2rem",
          flexWrap: "wrap",
        }}
      >
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by student, subject, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <table className={styles.grievanceTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Student</th>
            <th>Category</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((g) => (
            <tr
              key={g._id}
              className={styles.tableRow}
              onClick={() => setSelected(g)}
              style={{ cursor: "pointer" }}
            >
              <td>#{g._id.slice(-6)}</td>
              <td>{g.student?.name || "Unknown"}</td>
              <td>{g.category}</td>
              <td>{g.subject}</td>
              <td>
                <span className={styles.status + " " + statusColors[g.status]}>
                  {statusIcons[g.status]} {g.status}
                </span>
              </td>
              <td>{new Date(g.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
          No grievances found.
        </div>
      )}
    </div>
  );
};

export default Grievances;
