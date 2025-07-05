import React, { useRef } from "react";
import { toast } from "react-hot-toast";

export default function FacultyAttachments({ form, setForm, readOnly }) {
  const fileInputRef = useRef();
  const MAX_SIZE_MB = 2;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const existingFiles = form.attachments || [];
    const newAttachments = [];

    for (const file of files) {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(
          `"${file.name}" exceeds ${MAX_SIZE_MB}MB limit and was not added.`
        );
        continue;
      }

      // Avoid duplicate files (same name and size)
      const alreadyExists = existingFiles.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (!alreadyExists) {
        newAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          file, // actual File object
        });
      }
    }

    if (newAttachments.length) {
      setForm((prev) => ({
        ...prev,
        attachments: [...existingFiles, ...newAttachments],
      }));
      toast.success(`${newAttachments.length} file(s) added`);
    }

    e.target.value = null; // allow re-selecting the same file
  };

  const removeFile = (index) => {
    const updated = [...(form.attachments || [])];
    updated.splice(index, 1);
    setForm((prev) => ({
      ...prev,
      attachments: updated,
    }));
  };

  return (
    <div className="border rounded p-4 space-y-4">
      <h3 className="text-lg font-bold text-[#145DA0]">Supporting Documents</h3>

      {!readOnly && (
        <div>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
          >
            Upload Files
          </button>
          <p className="text-sm text-gray-500 mt-1">Max size: 2MB per file</p>
        </div>
      )}

      {form.attachments?.length > 0 ? (
        <ul className="list-disc pl-5 space-y-1">
          {form.attachments.map((file, index) => {
            const isUploaded = file.url && file.filename;
            const displayName = file.name || file.filename;

            return (
              <li
                key={index}
                className="flex justify-between items-center text-sm"
              >
                {isUploaded ? (
                  <a
                    href={`http://localhost:5000${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    {displayName}
                  </a>
                ) : (
                  <span>{displayName}</span>
                )}

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 text-xs ml-2"
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No files uploaded yet.</p>
      )}
    </div>
  );
}
