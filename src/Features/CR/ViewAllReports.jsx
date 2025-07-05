import React, { useEffect, useState } from "react";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function AllCRReports() {
  const { user } = UserData();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    if (!user) return;

    const params = new URLSearchParams();

    if (user.role === "faculty") {
      const facultyId = user.facultyId || user.userId || user._id;
      params.append("facultyId", facultyId);
    } else {
      if (statusFilter) params.append("status", statusFilter);
      if (selectedYear) params.append("year", selectedYear);
      if (selectedPeriod) params.append("period", selectedPeriod);
      if (searchTerm) params.append("search", searchTerm);
    }

    setLoading(true);
    axios
      .get(`http://localhost:5000/api/crreport?${params.toString()}`, {
        headers: { "x-user-email": user.email },
      })
      .then((res) => {
        setReports(res.data.reports);
        setTotal(res.data.total || 0);
      })
      .catch(() => {
        toast.error("Failed to load CR Reports");
        setReports([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, [user, selectedYear, selectedPeriod, statusFilter, searchTerm, page]);

  const handleCreateReport = async () => {
    if (!selectedPeriod || !selectedYear) {
      toast.error("Please select both period and year");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/crreport/${
          user.facultyId || user.userId || user._id
        }?year=${selectedYear}&period=${selectedPeriod}`,
        {
          headers: { "x-user-email": user.email },
        }
      );
      // console.log(res);
      if (res.data.created) {
        toast.success(res.data.message);
        navigate(`/CR/fullReport/${res.data.report._id}`);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Could not create or fetch CR Report");
    }
  };

  const handleDelete = async (reportId) => {
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/crreport/${reportId}`,
        {
          headers: { "x-user-email": user.email },
        }
      );
      // console.log(res);
      if (res.data.deleted) {
        toast.success(res.data.message);
        fetchReports();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to delete the report");
    }
  };
  const handleActionClick = async (report) => {
    if (report.status === "finalized") {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/crreport/${report._id}/download`,
          {
            headers: { "x-user-email": user.email },
            responseType: "blob",
          }
        );
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `CR_Report_${report._id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        toast.error("Download failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-black p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-[#145DA0]">
          All CR Reports
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by faculty name"
            value={searchTerm}
            onChange={(e) => {
              setPage(1);
              setSearchTerm(e.target.value);
            }}
            className="border border-gray-300 rounded p-2"
          />

          <select
            value={selectedYear}
            onChange={(e) => {
              setPage(1);
              setSelectedYear(e.target.value);
            }}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">All Years</option>
            {[...Array(10)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => {
              setPage(1);
              setSelectedPeriod(e.target.value);
            }}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">All Periods</option>
            <option value="december">December 31</option>
            <option value="june">June 30</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="faculty-filled">Faculty Filled</option>
            <option value="pending_hod_review">Pending HOD Review</option>
            <option value="hod-signed">HOD Signed</option>
            <option value="finalized">Finalized</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            Loading reports...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded bg-white shadow text-sm">
              <thead className="bg-[#145DA0] text-white">
                <tr>
                  <th className="p-3 text-left">Faculty Name</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">Year</th>
                  <th className="p-3 text-left">Period</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <tr
                      key={report._id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-3">{report.faculty?.name}</td>
                      <td className="p-3">{report.faculty?.department}</td>
                      <td className="p-3">{report.year}</td>
                      <td className="p-3 capitalize">{report.period}</td>
                      <td className="p-3 capitalize">
                        {report.status.replace(/_/g, " ")}
                      </td>
                      {/* <td className="p-3">
                        {(report.status !== "draft" ||
                          user.role === "faculty") && (
                          <button
                            onClick={() => handleActionClick(report)}
                            className="bg-[#145DA0] text-white px-3 py-1 rounded hover:opacity-90 transition"
                          >
                            {report.status === "finalized"
                              ? "Download"
                              : "View"}
                          </button>
                        )}
                      </td> */}
                      <td className="p-3 flex gap-2">
                        {report.status === "finalized" && (
                          <button
                            onClick={() => handleActionClick(report)}
                            className="bg-[#145DA0] text-white px-3 py-1 rounded hover:opacity-90 transition"
                          >
                            {report.status === "finalized"
                              ? "Download"
                              : "View Full Report"}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/CR/fullReport/${report._id}`)
                          }
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                        >
                          Full Report
                        </button>
                        {user.role === "faculty" && (
                          <button
                            onClick={() => handleDelete(report._id)}
                            className="bg-[#145DA0] text-white px-3 py-1 rounded hover:opacity-90 transition"
                          >
                            delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-600">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > limit && (
          <div className="flex justify-between items-center mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="bg-[#145DA0] text-white px-4 py-1 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Showing page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="bg-[#145DA0] text-white px-4 py-1 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {user.role === "faculty" && (
          <div className="mt-10 max-w-lg mx-auto border rounded p-4 bg-white shadow space-y-4">
            <h3 className="text-lg font-bold text-[#145DA0]">
              Create New CR Report
            </h3>

            <div className="space-y-2 text-sm flex lg:flex-row flex-col">
              <label className="font-semibold block">
                Report for the Year / Half-year ending:
              </label>

              <div className="flex lg:flex-row flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border rounded px-3 py-2 bg-gray-100"
                >
                  <option value="">Select Period</option>
                  <option value="december">December 31</option>
                  <option value="june">June 30</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border rounded px-3 py-2 bg-gray-100"
                >
                  <option value="">Select Year</option>
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleCreateReport}
                className="bg-green-600 text-white px-6 py-2 rounded shadow hover:opacity-90 w-full sm:w-auto"
              >
                Create New Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
