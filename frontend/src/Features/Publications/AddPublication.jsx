import axios from "axios";
import { useForm } from "react-hook-form";
import FormRow from "../Scholars/FormRow";
import toast from "react-hot-toast";
import { useState } from "react";
import Spinner from "../../ui/Spinner";
import { UserData } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function AddPublication({ formData = {}, onClose, onUpdate, onFetchPublications }) {
  const navigate = useNavigate();
  const { _id: editId, ...data } = formData;
  const { user } = UserData();
  const editData = Object.keys(formData).length ? data : null;
  const isEditing = Boolean(editId);
  const { register, reset, formState, handleSubmit } = useForm({
    defaultValues: isEditing ? editData : {},
  });
  const { errors } = formState;
  const [isLoading, setIsLoading] = useState(false);
  const [authorId, setAuthorId] = useState("");

  async function handleAddPublication(payload) {
    try {
      setIsLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/publications",
        payload,
        {
          headers: {
            "x-user-email": user.email,
          },
        }
      );
      toast.success("Publication added successfully");
      reset();
      if (onClose) {
        onClose();
      } else {
        navigate("/publications");
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      if (err.response?.data?.message?.includes("Duplicate citation_id")) {
        toast.error("A publication with this DOI already exists. Please use a different DOI or leave it empty.");
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to add new publication");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate(payload) {
    try {
      setIsLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/publications/${editId}`,
        payload,
        {
          headers: {
            "x-user-email": user.email,
          },
        }
      );
      toast.success("Updated Publication Successfully");
      reset();
      if (onUpdate) {
        onUpdate(editId, payload);
      }
      if (onClose) {
        onClose();
      } else {
        navigate("/publications");
      }
    } catch (error) {
      console.error("Error updating publication:", error);
      if (error.response?.data?.message?.includes("Duplicate citation_id")) {
        toast.error("A publication with this DOI already exists. Please use a different DOI or leave it empty.");
      } else {
        toast.error(error.response?.data?.message || "Failed to update Publication");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFetchFromGoogleScholar() {
    if (!authorId) {
      toast.error("Please enter an author ID");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/publications/fetch-and-store?authorId=${authorId}`,
        {
          headers: {
            "x-user-email": user.email,
          },
        }
      );
      toast.success("Publications fetched successfully");
      reset();
      if (onClose) {
        onClose();
      } else if (onFetchPublications) {
        onFetchPublications();
      } else {
        navigate("/publications");
      }
    } catch (error) {
      console.error("Error fetching publications:", error);
      toast.error(error.response?.data?.message || "Failed to fetch publications from Google Scholar");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data) {
    const payload = {
      title: data.title,
      authors: data.author.split(",").map((a) => a.trim()),
      publicationDate: data.publicationDate,
      journal: data.journalOrPublisher,
      doi: data.doi || undefined,
    };

    if (isEditing) {
      handleUpdate(payload);
    } else {
      handleAddPublication(payload);
    }
  }

  function onError(error) {
    console.log(error);
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="text-lg min-h-screen bg-[#f5f7fa] flex items-center justify-center py-10">
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="w-full max-w-2xl border border-gray-300 rounded-xl bg-white shadow-md p-10"
      >
        <h1 className="text-3xl font-bold text-center text-[#145DA0]">
          {isEditing ? "Edit Publication" : "Add Publication"}
        </h1>

        <FormRow label="title" error={errors?.title?.message}>
          <input
            name="title"
            className="w-full p-2 rounded bg-gray-100 border border-gray-300"
            {...register("title", { required: "This is required field" })}
          />
        </FormRow>

        <FormRow label="author" error={errors?.author?.message}>
          <input
            name="author"
            className="w-full p-2 rounded bg-gray-100 border border-gray-300"
            {...register("author", { required: "This is required field" })}
          />
        </FormRow>

        <FormRow label="publicationDate" error={errors?.publicationDate?.message}>
          <input
            name="publicationDate"
            type="date"
            className="w-full p-2 rounded bg-gray-100 border border-gray-300"
            {...register("publicationDate", { required: "This is required field" })}
          />
        </FormRow>

        <FormRow label="journalOrPublisher" error={errors?.journalOrPublisher?.message}>
          <input
            name="journalOrPublisher"
            className="w-full p-2 rounded bg-gray-100 border border-gray-300"
            {...register("journalOrPublisher", { required: "This is required field" })}
          />
        </FormRow>

        <FormRow label="doi" error={errors?.doi?.message}>
          <input
            name="doi"
            placeholder="Optional"
            className="w-full p-2 rounded bg-gray-100 border border-gray-300"
            {...register("doi")}
          />
        </FormRow>

        <div className="space-y-1">
          <label className="block font-medium">Google Scholar Author ID</label>
          <div className="flex gap-2">
            <input
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              placeholder="Enter author ID"
              className="w-full p-2 rounded bg-gray-100 border border-gray-300"
            />
            <button
              type="button"
              onClick={handleFetchFromGoogleScholar}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Fetch
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-fit mx-auto block bg-[#145DA0] text-white px-6 py-2 mt-5 rounded hover:bg-[#2E8BC0] transition duration-200"
        >
          {isEditing ? "Update Publication" : "Add Publication"}
        </button>
      </form>
    </div>
  );
}
