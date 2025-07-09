import axios from "axios";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  TbId,
  TbUser,
  TbCheck,
  TbCalendarTime,
  TbCalendarEvent,
  TbBulb,
  TbFlag,
  TbMessage,
  TbFile,
  TbUpload,
  TbUserCheck,
  TbUserX,
  TbX,
} from "react-icons/tb";
import { UserData } from "../../context/UserContext";
import { useState } from "react";
import Spinner from "../../ui/Spinner";
import ConfirmationModal from "../../ui/ConfirmationModal";

export default function RequestDetails({
  data,
  isHod,
  onSuccess,
  close,
  edit,
}) {
  const { user } = UserData();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
    watch,
  } = useForm({
    defaultValues: {
      requestType: data.requestType || "",
      eventType: data.eventType || "",
      startDate: data.startDate ? data.startDate.slice(0, 10) : "",
      endDate: data.endDate ? data.endDate.slice(0, 10) : "",
      startTime: data.startTime || "",
      endTime: data.endTime || "",
    },
  });

  const submitDocs = async (formData) => {
    setIsLoading(true);
    try {
      const fd = new FormData();
      if (formData.documents && formData.documents.length > 0) {
        for (const file of formData.documents) {
          fd.append("documents", file);
        }
      }

      const res = await axios.put(
        `http://localhost:5000/api/odrequests/${data._id}/docs`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-user-email": user.email,
          },
        }
      );

      toast.success("Documents uploaded");
      onSuccess(res.data);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequest = async (formData) => {
    setIsLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/odrequests/update-details/${data._id}`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user.email,
          },
        }
      );
      toast.success("Update successful");
      onSuccess(res.data);
    } catch {
      toast.error("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const approve = async (status) => {
    setIsLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/odrequests/${data._id}/${status}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user.email,
          },
        }
      );
      toast.success(`${status} successful`);
      onSuccess(res.data);
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };

  const editable = edit && data.status === "Pending";
  console.log(edit, editable);
  if (isLoading) return <Spinner />;

  return (
    <div className="bg-[#fbfbfb] rounded text-lg max-w-xl mx-auto p-4 flex flex-col h-[100vh] my-auto justify-center items-center-safe">
      <h2 className="text-xl text-center flex items-center gap-2 justify-center mb-2 font-bold capitalize">
        <TbUser className="text-[#145DA0]" />
        {data.name}'s Request
      </h2>
      <form
        onSubmit={handleSubmit(editable ? updateRequest : submitDocs)}
        className="flex flex-col space-y-3 text-black overflow-y-auto max-h-[80vh] px-2 justify-center items-center w-full pt-10 "
      >
        {editable ? (
          <div className="">
            <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center ">
              <TbFlag />
              <strong>Request Type:</strong>
              <input
                {...register("requestType")}
                className="border p-1 rounded w-full"
              />
            </div>

            <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
              <TbCalendarEvent />
              <strong>Event Type:</strong>
              <input
                {...register("eventType")}
                className="border p-1 rounded w-full"
              />
            </div>

            <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
              <TbCalendarTime />
              <strong>Start Date:</strong>
              <input
                type="date"
                {...register("startDate")}
                className="border p-1 rounded w-full"
              />
            </div>
            <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
              <TbCalendarTime />
              <strong>End Date:</strong>
              <input
                type="date"
                {...register("endDate", {
                  validate: (value) =>
                    !watch("startDate") ||
                    new Date(value) >= new Date(watch("startDate")) ||
                    "End Date must be after Start Date",
                })}
                className="border p-1 rounded w-full"
              />
            </div>

            <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
              <TbCalendarTime />
              <strong>Start Time:</strong>
              <input
                type="time"
                {...register("startTime")}
                className="border p-1 rounded w-full"
              />
            </div>

            <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
              <TbCalendarTime />
              <strong>End Time:</strong>
              <input
                type="time"
                {...register("endTime")}
                className="border p-1 rounded w-full"
              />
            </div>
          </div>
        ) : (
          <>
            {data.requestType && (
              <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
                <TbFlag /> <strong>Request Type:</strong> {data.requestType}
              </div>
            )}
            {data.eventType && (
              <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
                <TbCalendarEvent /> <strong>Event Type:</strong>{" "}
                {data.eventType}
              </div>
            )}

            {data.startDate && (
              <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
                <TbCalendarTime /> <strong>Start Date:</strong>{" "}
                {new Date(data.startDate).toLocaleDateString()}
              </div>
            )}
            {data.endDate && (
              <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
                <TbCalendarTime /> <strong>End Date:</strong>{" "}
                {new Date(data.endDate).toLocaleDateString()}
              </div>
            )}
            {data.startTime && (
              <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
                <TbCalendarTime /> <strong>Start Time:</strong>{" "}
                {new Date(`1970-01-01T${data.startTime}`).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            )}
            {data.endTime && (
              <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
                <TbCalendarTime /> <strong>End Time:</strong>{" "}
                {new Date(`1970-01-01T${data.endTime}`).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </>
        )}

        {data.status && (
          <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded flex gap-2 items-center">
            <TbCheck /> <strong>Status:</strong> {data.status}
          </div>
        )}

        {data.supportingDocuments?.length > 0 && (
          <div className="w-full bg-[#fbfbfb] px-4 py-2 rounded">
            <div className="flex items-center gap-2">
              <TbFile /> <strong>Supporting Documents:</strong>
            </div>
            <ul className="list-disc ml-6 mt-2 text-blue-700 underline">
              {data.supportingDocuments.map((f, idx) => (
                <li key={idx}>
                  <a
                    href={`http://localhost:5000/uploads/${f}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Document {idx + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!isHod || edit || data.status !== "Pending") &&
          data.status !== "Approved" && edit && (
            <div className="flex flex-col w-full gap-2 mt-3">
              <input
                type="file"
                {...register("documents")}
                multiple
                className="w-full text-sm file:bg-[#145DA0] file:text-white file:p-2"
              />
              <button
                type="button"
                onClick={handleSubmit(submitDocs)}
                className="bg-[#145DA0] text-white px-4 py-2 rounded flex items-center justify-center gap-2"
              >
                <TbUpload /> Upload Docs
              </button>
            </div>
          )}

        {editable && (
          <div className="w-full flex justify-center mt-4">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <TbCheck /> Save Changes
            </button>
          </div>
        )}

        {isHod && data.status === "Pending" && !edit && (
          <div className="w-full flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <button
              type="button"
              onClick={() => setConfirmAction("approve")}
              className="bg-[#145DA0] text-white px-4 py-2 rounded flex items-center justify-center gap-2"
            >
              <TbUserCheck /> Approve
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction("reject")}
              className="bg-red-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
            >
              <TbUserX /> Reject
            </button>
          </div>
        )}
      </form>

      {confirmAction && (
        <ConfirmationModal
          title="Are you sure?"
          description={
            confirmAction === "approve"
              ? "Approving this will digitally sign the request letter with your name and the current date."
              : `This will ${confirmAction} the request.`
          }
          onConfirm={() => approve(confirmAction)}
          onCancel={() => setConfirmAction(null)}
          onView={
            confirmAction === "approve"
              ? async () => {
                  try {
                    const res = await fetch(
                      `http://localhost:5000/api/odrequests/${data._id}/generate-letter`,
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
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
