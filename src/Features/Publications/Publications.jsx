import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";
import Modal from "../../ui/Modal";
import AddPublication from "./AddPublication";
import { UserData } from "../../context/UserContext";

function Publications() {
  const { user } = UserData();
  const isAdmin = user.position === "Admin";
  const [publicationsList, setPublicationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState("title");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/publications",
          {
            headers: {
              "x-user-email": user.email,
            },
          }
        );
        setPublicationsList(response.data);
      } catch (error) {
        console.error("Error fetching publications:", error);
        toast.error("Failed to fetch publications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublications();
  }, [user.email]);

  const updatePublicationInList = (id, updatedPublication) => {
    setPublicationsList((prev) =>
      prev.map((publication) =>
        publication._id === id ? updatedPublication : publication
      )
    );
  };

  const deletePublication = async (id) => {
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:5000/api/publications/${id}`, {
        headers: {
          "x-user-email": user.email,
        },
      });
      setPublicationsList((prev) =>
        prev.filter((publication) => publication._id !== id)
      );
      toast.success("Publication deleted successfully");
    } catch (error) {
      console.error("Error deleting publication:", error);
      toast.error("Failed to delete the selected publication");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPublications = publicationsList.filter((publication) => {
    const searchValue = searchTerm.toLowerCase();
    switch (filterType) {
      case "title":
        return publication.title.toLowerCase().includes(searchValue);
      case "author":
        return (
          publication.authors?.some((author) =>
            author.toLowerCase().includes(searchValue)
          ) || false
        );
      case "journal":
        return (publication.journal || "").toLowerCase().includes(searchValue);
      default:
        return true;
    }
  });

  const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPublications = filteredPublications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (isLoading) return <Spinner />;

  return (
    <div className="p-4 text-base w-full min-h-screen bg-[#f5f7fa]">
      <h2 className="font-bold text-2xl text-center mt-8 mb-6">
        Publications List
      </h2>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="title">Filter by Title</option>
          <option value="author">Filter by Author</option>
          <option value="journal">Filter by Journal/Publisher</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${
            filterType === "title"
              ? "title"
              : filterType === "author"
              ? "author"
              : "journal/publisher"
          }...`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm sm:text-base bg-white rounded-lg shadow border border-gray-300">
          <thead className="bg-blue-100">
            <tr>
              <th className="py-3 px-2 sm:px-4 text-center">Title</th>
              <th className="py-3 px-2 sm:px-4 text-center">Author</th>
              <th className="py-3 px-2 sm:px-4 text-center">
                Publication Date
              </th>
              <th className="py-3 px-2 sm:px-4 text-center">
                Journal/Publisher
              </th>
              <th className="py-3 px-2 sm:px-4 text-center">DOI</th>
              {isAdmin && (
                <th className="py-3 px-2 sm:px-4 text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentPublications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No publications found matching your search criteria.
                </td>
              </tr>
            ) : (
              currentPublications.map((publication) => (
                <tr
                  key={publication._id}
                  className="border-t border-gray-200 hover:bg-blue-50"
                >
                  <td className="py-2 px-2 sm:px-4 text-center break-words max-w-xs">
                    {publication.title}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center break-words max-w-xs">
                    {publication.authors?.join(", ") || "-"}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center">
                    {new Date(publication.publicationDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center break-words max-w-xs">
                    {publication.journal || "-"}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center break-words max-w-xs">
                    {publication.doi || "-"}
                  </td>
                  {isAdmin && (
                    <td className="py-2 px-2 sm:px-4 flex flex-col sm:flex-row gap-2 justify-center items-center">
                      <Modal>
                        <Modal.Body opens="form">
                          <button className="bg-yellow-300 hover:bg-yellow-400 text-black rounded-full px-3 py-1 text-sm font-semibold">
                            Update
                          </button>
                        </Modal.Body>
                        <Modal.Window name="form">
                          <AddPublication
                            formData={publication}
                            onUpdate={updatePublicationInList}
                            onFetchPublications={() => {}}
                          />
                        </Modal.Window>
                      </Modal>
                      <button
                        onClick={() => deletePublication(publication._id)}
                        className="bg-red-400 hover:bg-red-500 text-white rounded-full px-3 py-1 text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-blue-200 hover:bg-blue-300 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 rounded-md ${
                num === currentPage
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 hover:bg-blue-200"
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-blue-200 hover:bg-blue-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Publications;
