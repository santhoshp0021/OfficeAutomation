import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { UserData } from "../../context/UserContext";

export default function FacultyPart3Potential({ form, setForm, readOnly, faculty }) {
  const { user } = UserData();
  const [scholars, setScholars] = useState([]);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch scholars and publications on mount or when user changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [scholarsRes, pubsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/pgscholars", {
            headers: { "x-user-email": user.email },
          }),
          axios.get("http://localhost:5000/api/publications", {
            headers: { "x-user-email": user.email },
          }),
        ]);
        const scholarsData = scholarsRes.data.map(s => ({
          ...s,
          supervisorId: s.supervisor?._id || s.supervisor,
          supervisorEmail: s.supervisor?.email || null,
        }));
        setScholars(scholarsData);
        setPublications(pubsRes.data);
      } catch (err) {
        toast.error("Failed to fetch scholars or publications");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.email]);

  // Filtering logic for scholars and publications
  const year = form.year;
  const period = form.period;
  const start = new Date(`${year}-01-01`);
  const mid = new Date(`${year}-07-01`);
  const end = new Date(`${year}-12-31`);
  let periodStart, periodEnd;
  if (period === "june") {
    periodStart = start;
    periodEnd = new Date(`${year}-06-30`);
  } else {
    periodStart = start;
    periodEnd = end;
  }

  // Get facultyEmail and facultyId robustly
  const facultyEmail = user.email || faculty?.email;
  const facultyId = user.facultyId || user.userId || user._id || faculty?.facultyId || faculty?._id;
  const facultyIdStr = String(facultyId);

  // Helper to robustly extract supervisor ID as string
  function getSupervisorId(s) {
    if (!s.supervisor) return "";
    if (typeof s.supervisor === "string") return s.supervisor;
    if (typeof s.supervisor === "object" && s.supervisor._id) return s.supervisor._id;
    if (typeof s.supervisor === "object" && s.supervisor.toString) return s.supervisor.toString();
    return String(s.supervisor);
  }

  // Detailed debug logs for scholar matching
  console.log("facultyId:", facultyId, "| String(facultyId):", String(facultyId));
  scholars.forEach(s => {
    console.log(
      'Scholar:', s.name,
      '| supervisor:', s.supervisor,
      '| getSupervisorId:', getSupervisorId(s),
      '| facultyId:', facultyId,
      '| match:', getSupervisorId(s) === String(facultyId),
      '| dateOfCompletion:', s.dateOfCompletion,
      '| dateOfJoining:', s.dateOfJoining,
      '| program:', s.program,
      '| normalized:', getScholarDegreeType(s)
    );
  });

  // 7(a): Scholars who have ever completed under this staff member (no date filter)
  const obtained = scholars.filter(s =>
    s.dateOfCompletion &&
    (
      getSupervisorId(s) === String(facultyId) ||
      s.supervisor?.email === facultyEmail
    )
  );

  // 7(b): Scholars registered in period and not completed (keep period filter)
  const registered = scholars.filter(s =>
    new Date(s.dateOfJoining) >= periodStart &&
    new Date(s.dateOfJoining) <= periodEnd &&
    (!s.dateOfCompletion || new Date(s.dateOfCompletion) > periodEnd) &&
    (
      getSupervisorId(s) === String(facultyId) ||
      s.supervisor?.email === facultyEmail
    )
  );

  // 7(c): Publications in period (list)
  const filteredPublications = publications.filter(pub =>
    pub.authors &&
    pub.authors.some(
      author => author === faculty?.name || author === user.name
    ) &&
    new Date(pub.publicationDate) >= periodStart &&
    new Date(pub.publicationDate) <= periodEnd
  );

  // Debug logs to diagnose why counts are 0
  console.log('DEBUG: user', user);
  console.log('DEBUG: faculty', faculty);
  console.log('DEBUG: form.period', form.period, 'form.year', form.year);
  console.log('DEBUG: scholars', scholars);
  console.log('DEBUG: publications', publications);
  console.log('DEBUG: obtained', obtained);
  console.log('DEBUG: registered', registered);
  console.log('DEBUG: filteredPublications', filteredPublications);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleArrayChange = (field, index, value) => {
    const updated = [...(form[field] || [])];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  };

  const addArrayItem = (field) => {
    setForm({ ...form, [field]: [...(form[field] || []), ""] });
  };

  const removeArrayItem = (field, index) => {
    const updated = [...(form[field] || [])];
    updated.splice(index, 1);
    setForm({ ...form, [field]: updated });
  };

  const handleTableChange = (index, field, value) => {
    const updated = [...(form.subjectsTaught || [])];
    const currentRow = updated[index] || {};

    // Allow empty string for user to clear input
    if (["studentsAppeared", "studentsPassed"].includes(field)) {
      if (value === "") {
        updated[index] = { ...currentRow, [field]: "" };
        setForm({ ...form, subjectsTaught: updated });
        return;
      }

      const numericValue = parseInt(value, 10);
      if (isNaN(numericValue) || numericValue < 0) {
        toast.error("Please enter a valid non-negative number");
        return;
      }

      if (field === "studentsPassed") {
        const appeared = parseInt(currentRow.appeared || 0);
        if (!isNaN(appeared) && numericValue > appeared) {
          toast.error("Passed students cannot exceed students appeared");
          return;
        }
      }

      if (field === "studentsAppeared") {
        const passed = parseInt(currentRow.passed || 0);
        if (!isNaN(passed) && passed > numericValue) {
          toast.error("Students passed cannot be more than appeared");
          return;
        }
      }
    }

    updated[index] = { ...currentRow, [field]: value };
    setForm({ ...form, subjectsTaught: updated });
  };

  const addSubjectRow = () => {
    setForm({
      ...form,
      subjectsTaught: [
        ...(form.subjectsTaught || []),
        {
          subject: "",
          contactHours: "",
          studentsAppeared: "",
          studentsPassed: "",
          remarks: "",
        },
      ],
    });
  };

  const removeSubjectRow = (index) => {
    const updated = [...(form.subjectsTaught || [])];
    updated.splice(index, 1);
    setForm({ ...form, subjectsTaught: updated });
  };

  const rc = form.researchGuidance || { qualified: {}, registered: {} };

  // Degree types for 7(a) and 7(b) - include all normalized keys
  const degreeTypesA = [
    { key: "phd", label: "PhD." },
    { key: "mphil", label: "MPhil." },
    { key: "pg", label: "PG" },
    { key: "ug", label: "UG" },
    { key: "pgdiploma", label: "PG Diploma" },
  ];
  const degreeTypesB = degreeTypesA;

  // Helper to get degree type from scholar (robust normalization)
  function getScholarDegreeType(s) {
    // Lowercase and remove non-letters for robust matching
    return (s.program || "").toLowerCase().replace(/[^a-z]/g, "");
  }

  // Debug: print each scholar's relevant fields
  scholars.forEach(s => {
    console.log('Scholar:', s.name, 'program:', s.program, 'normalized:', getScholarDegreeType(s), 'dateOfJoining:', s.dateOfJoining, 'dateOfCompletion:', s.dateOfCompletion, 'supervisor:', s.supervisor);
  });

  // 7(a): Scholars who completed in period, by degree type
  const obtainedCounts = degreeTypesA.reduce((acc, d) => {
    acc[d.key] = obtained.filter(s => getScholarDegreeType(s) === d.key).length;
    return acc;
  }, {});

  // 7(b): Scholars registered in period and not completed, by degree type
  const registeredCounts = degreeTypesB.reduce((acc, d) => {
    acc[d.key] = registered.filter(s => getScholarDegreeType(s) === d.key).length;
    return acc;
  }, {});

  return (
    <div className="border rounded p-4 space-y-6">
      <h3 className="text-lg font-bold mb-2">
        Part III: Examination & Contributions
      </h3>

      {/* 5(a) Subjects Taught Table */}
      <div>
        <label className="font-semibold">
          5(a) Subjects Taught (Semester-wise)
        </label>
        <div className="overflow-auto mt-2">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">S.No</th>
                <th className="border p-1">Subjects Taught</th>
                <th className="border p-1">Contact Hours/Week</th>
                <th className="border p-1">Students Appeared</th>
                <th className="border p-1">Students Passed</th>
                <th className="border p-1">Remarks</th>
                {!readOnly && <th className="border p-1">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(form.subjectsTaught || []).map((row, i) => (
                <tr key={i}>
                  <td className="border p-1 text-center">{i + 1}</td>
                  <td className="border p-1">
                    <input
                      disabled={readOnly}
                      className="w-full p-1"
                      value={row.subject}
                      onChange={(e) =>
                        handleTableChange(i, "subject", e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      disabled={readOnly}
                      className="w-full p-1"
                      value={row.contactHours}
                      onChange={(e) =>
                        handleTableChange(i, "contactHours", e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={readOnly}
                      className="w-full p-1"
                      value={row.studentsAppeared}
                      onChange={(e) =>
                        handleTableChange(i, "studentsAppeared", e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={readOnly}
                      className="w-full p-1"
                      value={row.studentsPassed}
                      onChange={(e) =>
                        handleTableChange(i, "studentsPassed", e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      disabled={readOnly}
                      className="w-full p-1"
                      value={row.remarks}
                      onChange={(e) =>
                        handleTableChange(i, "remarks", e.target.value)
                      }
                    />
                  </td>
                  {!readOnly && (
                    <td className="border p-1 text-center">
                      <button
                        type="button"
                        className="text-red-500 text-xs"
                        onClick={() => removeSubjectRow(i)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!readOnly && (
            <button
              type="button"
              className="mt-2 text-sm text-blue-600"
              onClick={addSubjectRow}
            >
              + Add Row
            </button>
          )}
        </div>
      </div>

      {/* 5(b) Additional Info */}
      <div>
        <label className="font-semibold">
          5(b) Any Other Information to item 5
        </label>
        <textarea
          disabled={readOnly}
          className="w-full border p-2 rounded mt-1"
          name="examResults"
          value={form.examResults || ""}
          onChange={handleChange}
        />
      </div>

      {/* 6 - Contributions */}
      <div>
        <label className="font-semibold block">6. Contributions</label>
        {[
          {
            name: "labDevelopment",
            label: "i) Laboratory or workshop development",
          },
          {
            name: "modelsAndAids",
            label: "ii) Preparation of models, demo equipment, teaching aids",
          },
          { name: "shortCourses", label: "iii) Short courses conducted" },
        ].map((item) => (
          <div key={item.name} className="mt-1">
            <label className="text-sm">{item.label}</label>
            <textarea
              disabled={readOnly}
              name={item.name}
              value={form[item.name] || ""}
              onChange={handleChange}
              className="w-full border rounded p-2 mt-1"
            />
          </div>
        ))}
      </div>

      {/* 7(a) Students who obtained degrees */}
      <div>
        <label className="font-semibold block mb-2">
          7(a) No. of students who have obtained research degrees
        </label>
        <div className="grid grid-cols-3 gap-4">
          {degreeTypesA.map((d) => (
            <div key={d.key}>
              <label className="text-sm font-semibold">{d.label}</label>
              <input
                type="number"
                min="0"
                step="1"
                readOnly
                className="w-full border rounded p-2 text-lg text-center bg-gray-50"
                value={loading ? "" : obtainedCounts[d.key] || 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 7(b) Students registered */}
      <div>
        <label className="font-semibold block mt-4 mb-2">
          7(b) Students registered for research
        </label>
        <div className="grid grid-cols-5 gap-4">
          {degreeTypesB.map((d) => (
            <div key={d.key}>
              <label className="text-sm font-semibold">{d.label}</label>
              <input
                type="number"
                min="0"
                step="1"
                readOnly
                className="w-full border rounded p-2 text-lg text-center bg-gray-50"
                value={loading ? "" : registeredCounts[d.key] || 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 7(c) Papers Published */}
      <div className="mt-4">
        <label className="font-semibold">7(c) Papers Published</label>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div>
            <ul className="list-disc ml-6">
              {filteredPublications.map(pub => (
                <li key={pub._id}>
                  {pub.title} ({new Date(pub.publicationDate).toLocaleDateString()})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 7(d) Research Instruments */}
      <div className="mt-4">
        <label className="font-semibold">
          7(d) Instrumentation / Innovations
        </label>
        {(form.researchInstruments || []).map((item, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <input
              type="text"
              disabled={readOnly}
              className="w-full border p-1 rounded"
              value={item}
              onChange={(e) =>
                handleArrayChange("researchInstruments", index, e.target.value)
              }
            />
            {!readOnly && (
              <button
                type="button"
                className="text-red-500 text-sm"
                onClick={() => removeArrayItem("researchInstruments", index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button
            type="button"
            className="mt-2 text-sm text-blue-600"
            onClick={() => addArrayItem("researchInstruments")}
          >
            + Add Instrument
          </button>
        )}
      </div>
    </div>
  );
}
