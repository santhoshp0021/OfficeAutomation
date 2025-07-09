import axios from "axios";
import { useEffect, useState } from "react";
import { UserData } from "../../context/UserContext";
import toast from "react-hot-toast";
import RequestDetails from "./RequestDetails";
import Modal from "../../ui/Modal";

export default function RequestList() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = UserData();

  useEffect(() => {
    async function fetchReqs() {
      let api =
        user.role !== "faculty"
          ? "http://localhost:5000/api/odrequests"
          : `http://localhost:5000/api/odrequests/user/${user.userId}`;
      try {
        const res = await axios.get(api, {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-user-email": user.email,
          },
        });
        setRequests(res.data);
      } catch {
        toast.error("Failed to load requests");
      }
    }
    fetchReqs();
  }, [user]);

  const filteredRequests = requests.filter((request) => {
    const searchValue = searchTerm.toLowerCase();
    switch (filterType) {
      case "name":
        return request.name.toLowerCase().includes(searchValue);
      case "status":
        return request.status.toLowerCase().includes(searchValue);
      case "eventName":
        return request.topic.toLowerCase().includes(searchValue);
      default:
        return true;
    }
  });

  let sortedRequests = filteredRequests;
  if (user.role === "hod") {
    sortedRequests = [
      ...filteredRequests.filter(r => r.status === "Pending"),
      ...filteredRequests.filter(r => r.status !== "Pending")
    ];
  }

  let pendingRequests = [];
  let approvedRequests = [];
  let pendingFilterType = "name";
  let approvedFilterType = "name";
  let pendingSearchTerm = "";
  let approvedSearchTerm = "";
  const [pendingFilter, setPendingFilter] = useState({ type: "name", term: "" });
  const [approvedFilter, setApprovedFilter] = useState({ type: "name", term: "" });
  if (user.role === "hod") {
    const allPending = filteredRequests.filter(r => r.status === "Pending");
    const allApproved = filteredRequests.filter(r => r.status === "Approved");
    // Pending filter
    pendingRequests = allPending.filter((request) => {
      const searchValue = pendingFilter.term.toLowerCase();
      switch (pendingFilter.type) {
        case "name":
          return request.name.toLowerCase().includes(searchValue);
        case "type":
          return request.requestType.toLowerCase().includes(searchValue);
        case "eventName":
          return request.topic.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });
    // Approved filter
    approvedRequests = allApproved.filter((request) => {
      const searchValue = approvedFilter.term.toLowerCase();
      switch (approvedFilter.type) {
        case "name":
          return request.name.toLowerCase().includes(searchValue);
        case "type":
          return request.requestType.toLowerCase().includes(searchValue);
        case "eventName":
          return request.topic.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });
  }

  const handleDownload = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/odrequests/${id}/generate-letter`,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "multipart/form-data",
            "x-user-email": user.email,
          },
        },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `OD_Letter_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Letter downloaded successfully");
    } catch (error) {
      toast.error("Failed to download letter");
    }
  };

  if (requests && requests.length === 0)
    return (
      <p className="mx-auto text-center text-2xl font-bold ">No record found</p>
    );
  return (
    <div className="p-10 max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-center">OD Requests</h1>

      {user.role !== "hod" && (
        <div className="flex justify-center gap-4 mb-6">
          <select
            value={filterType}
            onChange={(e) => {
              const newFilterType = e.target.value;
              setFilterType(newFilterType);
              if (user.role === "faculty" && newFilterType === "name") {
                setFilterType("status");
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {user.role !== "faculty" && <option value="name">Filter by Name</option>}
            {user.role === "faculty" && <option value="name">Filter by Name</option>}
            <option value="type">Filter by Type</option>
            <option value="eventName">Filter by Event Name</option>
            <option value="status">Filter by Status</option>
          </select>
          <input
            type="text"
            placeholder={`Search by ${
              filterType === "name"
                ? "name"
                : filterType === "type"
                ? "type"
                : filterType === "eventName"
                ? "event name"
                : "status"
            }...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {user.role === "hod" ? (
        <>
          {/* Pending filter */}
          <div className="flex justify-center gap-4 mb-6">
            <select
              value={pendingFilter.type}
              onChange={e => setPendingFilter(f => ({ ...f, type: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Filter by Name</option>
              <option value="type">Filter by Type</option>
              <option value="eventName">Filter by Event Name</option>
            </select>
            <input
              type="text"
              placeholder={`Search by ${pendingFilter.type === "name" ? "name" : pendingFilter.type === "type" ? "type" : "event name"}...`}
              value={pendingFilter.term}
              onChange={e => setPendingFilter(f => ({ ...f, term: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <h2 className="text-2xl font-extrabold font-serif text-blue-900 mt-12 mb-6">Pending Requests</h2>
          <table className="w-full table-auto bg-white shadow rounded mb-12">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Event Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No pending requests found.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2 text-center w-[20%]">{r.name}</td>
                    <td className="p-2 text-center w-[10%]">{r.requestType}</td>
                    <td className="p-2 text-center w-[30%]">{r.topic}</td>
                    <td className="p-2 text-center w-[20%]">{r.status}</td>
                    <td className="p-2 text-center flex lg:flex-row flex-col justify-center">
                      <Modal>
                        <Modal.Body close={() => setSelected(null)} opens={"view"}>
                          <button
                            onClick={() => setSelected(r)}
                            className="bg-[#145DA0] text-white px-3 py-1 rounded hover:bg-[#2E8BC0] mx-1 my-1"
                          >
                            View
                          </button>
                        </Modal.Body>
                        <Modal.Window name="view">
                          <RequestDetails
                            data={r}
                            isHod={user.role === "hod"}
                            onSuccess={(updatedReq) => {
                              setRequests((reqs) =>
                                reqs.map((r) =>
                                  r._id === updatedReq._id ? updatedReq : r
                                )
                              );
                              setSelected(updatedReq);
                            }}
                            edit={false}
                            close={() => setSelected(null)}
                          />
                        </Modal.Window>
                      </Modal>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Approved filter */}
          <div className="flex justify-center gap-4 mb-6">
            <select
              value={approvedFilter.type}
              onChange={e => setApprovedFilter(f => ({ ...f, type: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="name">Filter by Name</option>
              <option value="type">Filter by Type</option>
              <option value="eventName">Filter by Event Name</option>
            </select>
            <input
              type="text"
              placeholder={`Search by ${approvedFilter.type === "name" ? "name" : approvedFilter.type === "type" ? "type" : "event name"}...`}
              value={approvedFilter.term}
              onChange={e => setApprovedFilter(f => ({ ...f, term: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <h2 className="text-2xl font-extrabold font-serif text-green-900 mt-12 mb-6">Approved Requests</h2>
          <table className="w-full table-auto bg-white shadow rounded mb-12">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Event Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No approved requests found.
                  </td>
                </tr>
              ) : (
                approvedRequests.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2 text-center w-[20%]">{r.name}</td>
                    <td className="p-2 text-center w-[10%]">{r.requestType}</td>
                    <td className="p-2 text-center w-[30%]">{r.topic}</td>
                    <td className="p-2 text-center w-[20%]">{r.status}</td>
                    <td className="p-2 text-center flex lg:flex-row flex-col justify-center">
                      <Modal>
                        <Modal.Body close={() => setSelected(null)} opens={"view"}>
                          <button
                            onClick={() => setSelected(r)}
                            className="bg-[#145DA0] text-white px-3 py-1 rounded hover:bg-[#2E8BC0] mx-1 my-1"
                          >
                            View
                          </button>
                        </Modal.Body>
                        <Modal.Window name="view">
                          <RequestDetails
                            data={r}
                            isHod={user.role === "hod"}
                            onSuccess={(updatedReq) => {
                              setRequests((reqs) =>
                                reqs.map((r) =>
                                  r._id === updatedReq._id ? updatedReq : r
                                )
                              );
                              setSelected(updatedReq);
                            }}
                            edit={false}
                            close={() => setSelected(null)}
                          />
                        </Modal.Window>
                      </Modal>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      ) : (
        <table className="w-full table-auto bg-white shadow rounded">
          <thead>
            <tr>
              {user.role !== "faculty" && <th>Name</th>}
              <th>Type</th>
              <th>Event Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.length === 0 ? (
              <tr>
                <td colSpan={user.role !== "faculty" ? 4 : 3} className="text-center py-8 text-gray-500">
                  No requests found matching your search criteria.
                </td>
              </tr>
            ) : (
              sortedRequests.map((r) => (
                <tr key={r._id} className="border-t">
                  {user.role !== "faculty" && <td className="p-2 text-center w-[20%]">{r.name}</td>}
                  <td className="p-2 text-center w-[10%]">{r.requestType}</td>
                  <td className="p-2 text-center w-[30%]">{r.topic}</td>
                  <td className="p-2 text-center w-[20%]">{r.status}</td>
                  <td className="p-2 text-center flex lg:flex-row flex-col justify-center">
                    <Modal>
                      <Modal.Body close={() => setSelected(null)} opens={"view"}>
                        <button
                          onClick={() => setSelected(r)}
                          className="bg-[#145DA0] text-white px-3 py-1 rounded hover:bg-[#2E8BC0] mx-1 my-1"
                        >
                          View
                        </button>
                      </Modal.Body>
                      <Modal.Window name="view">
                        <RequestDetails
                          data={r}
                          isHod={user.role === "hod"}
                          onSuccess={(updatedReq) => {
                            setRequests((reqs) =>
                              reqs.map((r) =>
                                r._id === updatedReq._id ? updatedReq : r
                              )
                            );
                            setSelected(updatedReq);
                          }}
                          edit={false}
                          close={() => setSelected(null)}
                        />
                      </Modal.Window>

                      {user.role === "faculty" && r.status === "Pending" && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `http://localhost:5000/api/odrequests/${r._id}/generate-letter`,
                                {
                                  method: "GET",
                                  headers: {
                                    "x-user-email": user.email,
                                  },
                                }
                              );
                              if (!res.ok) {
                                throw new Error("Failed to fetch letter");
                              }
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              window.open(url, "_blank");
                            } catch (err) {
                              toast.error("Could not preview letter");
                            }
                          }}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mt-2 mx-1 my-1"
                        >
                          View Request Letter
                        </button>
                      )}
                      {user.role === "faculty" && r.status === "Approved" && (
                        <button
                          onClick={() => handleDownload(r._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mt-2 mx-1 my-1"
                        >
                          Download Letter
                        </button>
                      )}
                      {user.role !== "faculty" && user.role !== "admin" && (
                        <button
                          onClick={() => handleDownload(r._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mt-2 mx-1 my-1"
                        >
                          Download Letter
                        </button>
                      )}
                    </Modal>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
