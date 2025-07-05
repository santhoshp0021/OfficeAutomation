import React from "react";
import ConfirmedSignature from "./ConfirmedSiganture";

export default function HODSignaturesPart1({ form, setForm, user }) {
  const sig = form.hodPart1?.performanceAssessmentSignature || {};

  const confirm = (roleKey) => {
    if (window.confirm(`Sign as ${user.name.toUpperCase()} for ${roleKey}?`)) {
      const newEntry = {
        name: user.name.toUpperCase(),
        date: new Date().toISOString(),
      };

      setForm((prev) => ({
        ...prev,
        hodPart1: {
          ...prev.hodPart1,
          performanceAssessmentSignature: {
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
        Signatures – Performance Assessment (Part I)
      </h3>

      <ConfirmedSignature
        label="Signature of HOD (Reporting Officer)"
        name={sig.hod?.name}
        date={sig.hod?.date && new Date(sig.hod.date).toLocaleDateString()}
        confirmed={!!sig.hod}
        onConfirm={() => confirm("hod")}
        canSign={user.role === "hod"}
      />

      <ConfirmedSignature
        label="Signature of Reviewing Officer"
        name={sig.reviewingOfficer?.name}
        date={
          sig.reviewingOfficer?.date &&
          new Date(sig.reviewingOfficer.date).toLocaleDateString()
        }
        confirmed={!!sig.reviewingOfficer}
        onConfirm={() => confirm("reviewingOfficer")}
        canSign={user.role === "reviewingOfficer"}
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
