import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { UserData } from "../../context/UserContext";

export default function ODRequestForm() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const { user } = UserData();
  const [type, setType] = useState("Conduct");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numDays, setNumDays] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  function updateDays(start, end) {
    if (start && end) {
      const startObj = new Date(start);
      const endObj = new Date(end);
      const diffTime = endObj - startObj;

      if (diffTime < 0) {
        toast.error("End date cannot be before start date.");
        setNumDays(0);
        return;
      }

      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setNumDays(diffDays);
    }
  }

  const onSubmit = async (data) => {
    if (data.eventType === "Others" && data.otherEventType) {
      data.eventType = data.otherEventType;
    }
    delete data.otherEventType;

    if (new Date(data.endDate) < new Date(data.startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    const formData = new FormData();
    formData.append("requestType", data.requestType);
    formData.append("name", user.name);
    formData.append("eventType", data.eventType);
    formData.append("startDate", data.startDate);
    formData.append("endDate", data.endDate);
    formData.append("numberOfDays", Number(numDays));
    formData.append("startTime", data.startTime);
    formData.append("endTime", data.endTime);
    formData.append("topic", data.topic);
    formData.append("location", data.location);

    if (data.procurements !== undefined) {
      formData.append("procurements", data.procurements);
    }

    formData.append("days", numDays.toString());

    if (data.documents && data.documents.length > 0) {
      for (const file of data.documents) {
        formData.append("documents", file);
      }
    }
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/odrequests",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-user-email": user.email,
          },
        }
      );

      toast.success("Request submitted successfully");
      console.log("Saved ODRequest:", res.data);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed");
      console.error("Submission error:", err);
    }
  };

  const [isOther, setIsOther] = useState(false);

  const requestType = watch("requestType", "OD");

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-black p-4 flex items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-3xl space-y-6 bg-white p-8 rounded-xl shadow-xl"
      >
        <h2 className="text-2xl font-semibold text-center">OD Request Form</h2>

        <div className="space-y-1">
          <label className="block">Type of Request</label>
          <select
            {...register("requestType", { required: true })}
            className="w-full p-2 rounded bg-gray-100"
            onChange={(e) => setType(e.target.value)}
          >
            <option value="OD">OD</option>
            <option value="SCL">SCL</option>
          </select>
          {errors.requestType && <div className="h-0.5 bg-red-500"></div>}
        </div>

        <div className="space-y-1">
          <label className="block">Type of Event</label>
          <select
            {...register("eventType", { required: true })}
            className="w-full p-2 rounded bg-gray-100"
            onChange={(e) => {
              const selected = e.target.value;
              setIsOther(selected === "Others");
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Select an event type
            </option>
            <option value="Course">Course</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Conference">Conference</option>
            <option value="Industrial Visit">Industrial Visit</option>
            <option value="Others">Others</option>
          </select>
          {errors.eventType && <div className="h-0.5 bg-red-500"></div>}
        </div>

        {isOther && (
          <div className="space-y-1">
            <label className="block">Specify Event Type</label>
            <input
              {...register("otherEventType", { required: true })}
              className="w-full p-2 rounded bg-gray-100"
              placeholder="Enter event type"
            />
            {errors.otherEventType && <div className="h-0.5 bg-red-500"></div>}
          </div>
        )}

        <div className="space-y-1">
          <label className="block">Start Date</label>
          <input
            type="date"
            {...register("startDate", { required: true })}
            onChange={(e) => {
              setStartDate(e.target.value);
              updateDays(e.target.value, endDate);
            }}
            className="w-full p-3 rounded bg-gray-100 border border-gray-300"
          />
          {errors.startDate && <div className="h-0.5 bg-red-500"></div>}
        </div>

        <div className="space-y-1">
          <label className="block">End Date</label>
          <input
            type="date"
            {...register("endDate", { required: true })}
            onChange={(e) => {
              setEndDate(e.target.value);
              updateDays(startDate, e.target.value);
            }}
            className="w-full p-3 rounded bg-gray-100 border border-gray-300"
          />
          {errors.endDate && <div className="h-0.5 bg-red-500"></div>}
        </div>
        <div className="space-y-1">
          <label className="block">Number of Days</label>
          <input
            type="number"
            value={numDays}
            readOnly
            className="w-full p-3 rounded bg-gray-100 border border-gray-300"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block">Start Time</label>
            <input
              type="time"
              {...register("startTime", { required: true })}
              className="w-full p-2 rounded bg-gray-100"
            />
            {errors.startTime && <div className="h-0.5 bg-red-500"></div>}
          </div>
          <div className="space-y-1">
            <label className="block">End Time</label>
            <input
              type="time"
              {...register("endTime", { required: true })}
              className="w-full p-2 rounded bg-gray-100"
            />
            {errors.endTime && <div className="h-0.5 bg-red-500"></div>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block">Topic / Event Name</label>
          <input
            {...register("topic", { required: true })}
            className="w-full p-2 rounded bg-gray-100"
          />
          {errors.topic && <div className="h-0.5 bg-red-500"></div>}
        </div>

        <div className="space-y-1">
          <label className="block">Location</label>
          <input
            {...register("location", { required: true })}
            className="w-full p-2 rounded bg-gray-100"
          />
          {errors.location && <div className="h-0.5 bg-red-500"></div>}
        </div>

        <div className="space-y-1">
          <label className="block">Supporting Document</label>
          <input
            type="file"
            multiple
            className="w-full p-4 rounded bg-gray-100 file:text-white file:bg-[#145DA0] file:px-4 file:py-2 file:rounded"
            onChange={(e) => {
              const filesArray = Array.from(e.target.files);
              const MAX_SIZE_MB = 2;
              const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

              const validNewFiles = [];
              for (const file of filesArray) {
                if (file.size > MAX_SIZE_BYTES) {
                  toast.error(
                    `"${file.name}" exceeds ${MAX_SIZE_MB}MB limit and was not added.`
                  );
                } else {
                  // Prevent duplicates
                  const alreadyAdded = selectedFiles.some(
                    (f) => f.name === file.name && f.size === file.size
                  );
                  if (!alreadyAdded) validNewFiles.push(file);
                }
              }

              const updatedFiles = [...selectedFiles, ...validNewFiles];
              setSelectedFiles(updatedFiles);
              setValue("documents", updatedFiles); // update RHF form
              e.target.value = null; // allow re-selecting same file
            }}
          />
          <p className="text-sm text-gray-500 mt-1">Max size: 2MB per file</p>

          {selectedFiles.length > 0 && (
            <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
              {selectedFiles.map((file, idx) => (
                <li key={idx}>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          )}

          {errors.documents && <div className="h-0.5 bg-red-500"></div>}
        </div>

        <div className="w-fit mx-auto">
          <button
            type="submit"
            className="bg-[#145DA0] rounded-full p-2 px-4 mt-5 w-fit self-center text-white hover:bg-[#2E8BC0] hover:cursor-pointer font-semibold focus:ring-blue-700 "
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
