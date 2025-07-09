import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";

function Scholars() {
  const [scholarsList, setScholarsList] = useState([]);
  const [currentScholar, setCurrentScholar] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    registrationNumber: "",
    contactInfo: { email: "", phone: "" },
    areaOfResearch: "",
    supervisor: "",
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchScholars = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/pgscholars"
        );
        console.log(response.data)
        setScholarsList(response.data);
      } catch (error) {
        console.error("Error fetching scholars:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScholars();
  }, []);

  const deleteScholar = async (id) => {
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:5000/api/pgscholars/${id}`);
      setScholarsList((prev) => prev.filter((scholar) => scholar._id !== id));
      toast.success("Scholar details deleted successfully");
    } catch (error) {
      console.error("Error deleting scholar:", error);
      toast.error("Failed to delete the selected Scholar details");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditForm = (scholar) => {
    setCurrentScholar(scholar);
    setFormData({
      name: scholar.name || "",
      registrationNumber: scholar.registrationNumber || "",
      contactInfo: {
        email: scholar.contactInfo?.email || "",
        phone: scholar.contactInfo?.phone || "",
      },
      areaOfResearch: scholar.areaOfResearch || "",
      supervisor: scholar.supervisor || "",
    });
    setIsModalVisible(true);
  };

  const updateFormField = (event) => {
    const { name, value } = event.target;
    if (name === "email" || name === "phone") {
      setFormData((prev) => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const submitUpdate = async (event) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/pgscholars/${currentScholar._id}`,
        formData
      );

      setScholarsList((prev) =>
        prev.map((scholar) =>
          scholar._id === currentScholar._id ? response.data : scholar
        )
      );

      setIsModalVisible(false);
      setCurrentScholar(null);
    } catch (error) {
      console.error("Error updating scholar:", error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) return <Spinner />;

  return (
    <div className="p-5 text-lg flex w-full min-h-screen flex-col bg-[#edf4fb]">
      <h2 className="font-bold text-3xl text-center mt-10 mb-8">
        Scholars List
      </h2>
      <div className="overflow-x-auto flex justify-center">
        <table className="min-w-[800px] bg-white rounded-xl shadow-lg border border-gray-300">
          <thead>
            <tr className="bg-blue-100 text-black">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Registration Number</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Area of Research</th>
              <th className="py-3 px-4 text-left">Supervisor</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scholarsList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No scholars available.
                </td>
              </tr>
            ) : (
              scholarsList.map((scholar) => (
                <tr
                  key={scholar._id}
                  className="border-t border-gray-200 hover:bg-blue-50 transition"
                >
                  <td className="py-2 px-4">{scholar.name}</td>
                  <td className="py-2 px-4">{scholar.registrationNumber}</td>
                  <td className="py-2 px-4">{scholar.contactInfo?.email}</td>
                  <td className="py-2 px-4">{scholar.contactInfo?.phone}</td>
                  <td className="py-2 px-4">{scholar.areaOfResearch}</td>
                  <td className="py-2 px-4">{scholar.supervisor}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      onClick={() => openEditForm(scholar)}
                      className="bg-yellow-300 hover:bg-yellow-400 text-black rounded-full px-3 py-1 text-sm font-semibold"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => deleteScholar(scholar._id)}
                      className="bg-red-400 hover:bg-red-500 text-white rounded-full px-3 py-1 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalVisible && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={submitUpdate}
            className="bg-white p-8 rounded-xl shadow-lg min-w-[320px] flex flex-col gap-3"
          >
            <h3 className="font-bold text-xl mb-2">Edit Scholar</h3>
            <label className="font-semibold">
              Name:
              <input
                name="name"
                value={formData.name}
                onChange={updateFormField}
                required
                className="rounded-full bg-stone-200 px-3 py-1 w-full mt-1"
              />
            </label>
            <label className="font-semibold">
              Registration Number:
              <input
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={updateFormField}
                required
                className="rounded-full bg-stone-200 px-3 py-1 w-full mt-1"
              />
            </label>
            <label className="font-semibold">
              Email:
              <input
                name="email"
                value={formData.contactInfo.email}
                onChange={updateFormField}
                className="rounded-full bg-stone-200 px-3 py-1 w-full mt-1"
              />
            </label>
            <label className="font-semibold">
              Phone:
              <input
                name="phone"
                value={formData.contactInfo.phone}
                onChange={updateFormField}
                className="rounded-full bg-stone-200 px-3 py-1 w-full mt-1"
              />
            </label>
            <label className="font-semibold">
              Area of Research:
              <input
                name="areaOfResearch"
                value={formData.areaOfResearch}
                onChange={updateFormField}
                required
                className="rounded-full bg-stone-200 px-3 py-1 w-full mt-1"
              />
            </label>
            <label className="font-semibold">
              Supervisor:
              <input
                name="supervisor"
                value={formData.supervisor}
                onChange={updateFormField}
                className="rounded-full bg-stone-200 px-3 py-1 w-full mt-1"
              />
            </label>
            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                className="bg-blue-400 hover:bg-blue-500 text-white rounded-full px-4 py-2 font-semibold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsModalVisible(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black rounded-full px-4 py-2 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Scholars;
