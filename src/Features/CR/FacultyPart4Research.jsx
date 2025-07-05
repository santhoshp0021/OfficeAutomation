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

      {fields.map((field) => (
        <div key={field}>
          <label className="font-semibold capitalize">
            {field.replace(/([A-Z])/g, " $1")}
          </label>
          {/* OD-derived Conferences */}
          {field === "conferences" && odConferences.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-500">OD Requests (auto-filled):</div>
              <ul className="list-disc ml-6">
                {odConferences.map(r => (
                  <li key={r._id}>
                    {r.topic} ({new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()})
                    <span className="ml-2 text-xs text-blue-500">(OD)</span>
                    {r.supportingDocuments && r.supportingDocuments.length > 0 && (
                      <ul className="ml-4 mt-1 text-xs text-gray-700">
                        {r.supportingDocuments.map((doc, idx) => {
                          let fileUrl = doc;
                          if (!doc.startsWith('http')) {
                            if (!doc.startsWith('/uploads/')) {
                              fileUrl = `http://localhost:5000/uploads/${doc}`;
                            } else {
                              fileUrl = `http://localhost:5000${doc}`;
                            }
                          }
                          return (
                            <li key={idx}>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                                Supporting Document {idx + 1}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* OD-derived Other Contributions */}
          {field === "otherContributions" && odOther.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-500">OD Requests (auto-filled):</div>
              <ul className="list-disc ml-6">
                {odOther.map(r => (
                  <li key={r._id}>
                    {r.eventType}: {r.topic} ({new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()})
                    <span className="ml-2 text-xs text-blue-500">(OD)</span>
                    {r.supportingDocuments && r.supportingDocuments.length > 0 && (
                      <ul className="ml-4 mt-1 text-xs text-gray-700">
                        {r.supportingDocuments.map((doc, idx) => {
                          let fileUrl = doc;
                          if (!doc.startsWith('http')) {
                            if (!doc.startsWith('/uploads/')) {
                              fileUrl = `http://localhost:5000/uploads/${doc}`;
                            } else {
                              fileUrl = `http://localhost:5000${doc}`;
                            }
                          }
                          return (
                            <li key={idx}>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                                Supporting Document {idx + 1}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {form[field].map((item, idx) => (
            <div key={idx} className="flex gap-2 mt-1">
              <input
                type="text"
                disabled={readOnly}
                value={item}
                onChange={(e) => handleListChange(field, idx, e.target.value)}
                className="w-full border p-1 rounded"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeRow(field, idx)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
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
      ))}
    </div>
  );
}
