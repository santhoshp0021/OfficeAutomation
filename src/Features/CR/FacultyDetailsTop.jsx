export default function FacultyDetailsTop({ faculty }) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="grid grid-cols-[350px_1fr] items-center">
        <span className="font-semibold">1. (a) Name (in block letters)</span>
        <span>: {faculty?.name}</span>
      </div>
      <div className="grid grid-cols-[350px_1fr] items-center">
        <span className="font-semibold">&nbsp;&nbsp;&nbsp;(b) Date of Birth and Age</span>
        <span>: {faculty?.dob ? `${new Date(faculty.dob).toLocaleDateString()} / ${new Date().getFullYear() - new Date(faculty.dob).getFullYear()} years` : ""}</span>
      </div>
      <div className="grid grid-cols-[350px_1fr] items-center">
        <span className="font-semibold">&nbsp;&nbsp;&nbsp;(c) Qualifications</span>
        <span>: {faculty?.qualifications}</span>
      </div>
      <div className="grid grid-cols-[350px_1fr] items-center">
        <span className="font-semibold">2. Designation</span>
        <span>: {faculty?.designation}</span>
      </div>
      <div className="grid grid-cols-[350px_1fr] items-center">
        <span className="font-semibold">3. Scale of pay and present pay</span>
        <span>: {faculty?.scaleOfPay} / {faculty?.presentPay}</span>
      </div>
      <div className="grid grid-cols-[350px_1fr] items-start">
        <span className="font-semibold leading-tight">4. Post or posts held and nature of appointment <br /><span className="text-sm font-normal">(i.e. Temporary / Probationer / Approved Probationer / Permanent)</span></span>
        <span>: {faculty?.postHeld}</span>
      </div>
    </div>
  );
} 