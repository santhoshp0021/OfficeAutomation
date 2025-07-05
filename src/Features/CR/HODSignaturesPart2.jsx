import React from "react";
import ConfirmedSignature from "./ConfirmedSiganture";

export default function HODSignaturesPart2({ form, setForm, user }) {
  const sig = form.hodPart2?.potentialAssessmentSignature || {};

  const confirm = (roleKey) => {
    if (window.confirm(`Sign as ${user.name.toUpperCase()} for ${roleKey}?`)) {
      const newEntry = {
        name: user.name.toUpperCase(),
        date: new Date().toISOString(),
      };

      setForm((prev) => ({
        ...prev,
        hodPart2: {
          ...prev.hodPart2,
          potentialAssessmentSignature: {
            ...sig,
            [roleKey]: newEntry,
          },
        },
      }));
    }
  };

  return (
    <div className="mt-6 border rounded p-4">
      <h3 className="text-lg font-bold text-[#145DA0] mb-2">
        Signatures – Potential Assessment (Part II)
      </h3>

      <ConfirmedSignature
        label="Signature of HOD"
        name={sig.hod?.name}
        date={sig.hod?.date && new Date(sig.hod.date).toLocaleDateString()}
        confirmed={!!sig.hod}
        onConfirm={() => confirm("hod")}
        canSign={user.role === "hod"}
      />

      <ConfirmedSignature
        label="Signature of Faculty"
        name={sig.faculty?.name}
        date={
          sig.faculty?.date && new Date(sig.faculty.date).toLocaleDateString()
        }
        confirmed={!!sig.faculty}
        onConfirm={() => confirm("faculty")}
        canSign={user.role === "faculty"}
      />
    </div>
  );
}
