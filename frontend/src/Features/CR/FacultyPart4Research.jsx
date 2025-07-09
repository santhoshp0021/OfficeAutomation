import React from "react";
export default function FacultyPart4Research({
  form,
  setForm,
  fileUploads,
  setFileUploads,
  readOnly,
  odConferences = [],
  odOther = [],
}) {
  console.log(form);
  const handleListChange = (field, index, value) => {
    const updated = [...form[field]];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  };

  const addRow = (field) => {
    setForm((f) => ({ ...f, [field]: [...f[field], ""] }));
  };

  const removeRow = (field, index) => {
    const updated = [...form[field]];
    updated.splice(index, 1);
    setForm({ ...form, [field]: updated });
  };

  const fields = [
    "additionalQualifications",
    "booksOrGuides",
    "memberships",
    "conferences",
    "consultingWork",
    "pastoralFunctions",
    "otherContributions",
  ];

  return (
    <div className="border rounded p-4 space-y-6">
      <h3 className="text-lg font-bold mb-2">
        Part IV: Publications & Activities
      </h3>

      {fields.map((field) => {
        // Merge OD and manual entries for conferences and otherContributions
        let mergedEntries = [];
        if (field === "conferences") {
          mergedEntries = [
            ...odConferences.map(r => ({
              value: `${r.topic} (${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()})`,
              isOD: true,
              _id: r._id,
              supportingDocuments: r.supportingDocuments,
            })),
            ...form[field].map((item, idx) => ({
              value: item,
              isOD: false,
              idx,
            })),
          ];
        } else if (field === "otherContributions") {
          mergedEntries = [
            ...odOther.map(r => ({
              value: `${r.eventType}: ${r.topic} (${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()})`,
              isOD: true,
              _id: r._id,
              supportingDocuments: r.supportingDocuments,
            })),
            ...form[field].map((item, idx) => ({
              value: item,
              isOD: false,
              idx,
            })),
          ];
        } else {
          mergedEntries = form[field].map((item, idx) => ({
            value: item,
            isOD: false,
            idx,
          }));
        }
        return (
          <div key={field}>
            <label className="font-semibold capitalize">
              {field.replace(/([A-Z])/g, " $1")}
            </label>
            {mergedEntries.map((entry, idx) => (
              <div key={entry.isOD ? entry._id : idx} className="flex flex-col gap-1 mt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={readOnly || entry.isOD}
                    value={entry.value}
                    onChange={e => {
                      if (!entry.isOD) handleListChange(field, entry.idx, e.target.value);
                    }}
                    className="w-full border p-1 rounded"
                  />
                  {!readOnly && !entry.isOD && (
                    <button
                      type="button"
                      onClick={() => removeRow(field, entry.idx)}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {/* Render supporting docs for OD entries */}
                {entry.isOD && entry.supportingDocuments && entry.supportingDocuments.length > 0 && (
                  <ul className="ml-4 mt-1 text-xs text-gray-700">
                    {entry.supportingDocuments.map((doc, i) => {
                      let fileUrl = doc;
                      if (!doc.startsWith('http')) {
                        if (!doc.startsWith('/uploads/')) {
                          fileUrl = `http://localhost:5000/uploads/${doc}`;
                        } else {
                          fileUrl = `http://localhost:5000${doc}`;
                        }
                      }
                      return (
                        <li key={i}>
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                            Supporting Document {i + 1}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
            {!readOnly && (
              <button
                type="button"
                onClick={() => addRow(field)}
                className="text-blue-600 text-sm mt-1"
              >
                + Add {field.replace(/([A-Z])/g, " $1")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
