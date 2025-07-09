import React from "react";
import ConfirmedSignature from "./ConfirmedSiganture";

export default function FacultySignatures({ form, setForm, user }) {
  const confirm = () => {
    if (
      window.confirm(
        `Clicking OK will digitally sign this report as ${user.name.toUpperCase()}. This action cannot be undone. Proceed?`
      )
    ) {
      const now = new Date().toISOString();
      setForm((prev) => ({
        ...prev,
        facultySignature: user.name.toUpperCase(),
        facultySignatureDate: now,
      }));
    }
  };
  console.log(form,form.facultySignatureDate);
  return (
    <div className="border rounded p-4 space-y-4 mt-6">
      <h3 className="text-lg font-bold mb-2 text-[#145DA0]">
        Final Signature by Faculty
      </h3>

      <ConfirmedSignature
        label="Faculty Signature"
        name={form.facultySignature}
        date={
          form.facultySignatureDate &&
          new Date(form.facultySignatureDate).toLocaleDateString()
        }
        confirmed={!!form.facultySignature}
        onConfirm={confirm}
        canSign={user.role === "faculty"}
      />
    </div>
  );
}
