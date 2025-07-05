import { useState } from "react";
import { UserData } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function Signup({ onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "faculty",
    position: "Assistant Professor",
    department: "",
    dob: "",
    dateOfJoining: "",
    phone: "",
    gender: "",
    qualifications: "",
    scaleOfPay: "",
    presentPay: "",
    natureOfAppointment: ""
  });
  const [step, setStep] = useState(1); // 1: basic, 2: faculty details
  const { signup } = UserData();
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (form.role === "faculty" || form.role === "hod") {
      setStep(2);
    } else {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await signup(form);
    if (success) {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "faculty",
        position: "Assistant Professor",
        department: "",
        dob: "",
        dateOfJoining: "",
        phone: "",
        gender: "",
        qualifications: "",
        scaleOfPay: "",
        presentPay: "",
        natureOfAppointment: ""
      });
      navigate("/login");
    }
  };

  return (
    <form
      onSubmit={step === 1 ? handleNext : handleSubmit}
      className="max-w-sm mx-auto space-y-4 flex flex-col justify-center my-auto min-h-[100vh] w-[80%]"
    >
      <h2 className="text-xl font-bold text-center">Signup</h2>
      {step === 1 && (
        <>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="faculty">Faculty</option>
            <option value="hod">HOD</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="w-full bg-[#145DA0] text-white py-2 rounded"
          >
            {form.role === "faculty" ? "Next" : "Sign Up"}
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <label htmlFor="position">Position</label>
          <select
            id="position"
            name="position"
            value={form.position}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Professor">Professor</option>
            <option value="HOD">HOD</option>
            <option value="Guest Faculty">Guest Faculty</option>
            <option value="Emeritus Professor">Emeritus Professor</option>
            <option value="Other">Other</option>
          </select>
          <label htmlFor="department">Department</label>
          <input
            type="text"
            id="department"
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="Department"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            placeholder="Date of Birth"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <label htmlFor="dateOfJoining">Date of Joining</label>
          <input
            type="date"
            id="dateOfJoining"
            name="dateOfJoining"
            value={form.dateOfJoining}
            onChange={handleChange}
            placeholder="Date of Joining"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <label htmlFor="phone">Phone Number</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
          <label htmlFor="qualifications">Qualifications</label>
          <input
            type="text"
            id="qualifications"
            name="qualifications"
            value={form.qualifications}
            onChange={handleChange}
            placeholder="Qualifications"
            className="w-full px-3 py-2 border rounded"
            required
          />
          {form.role === "faculty" && (
            <>
              <label htmlFor="scaleOfPay">Scale of Pay</label>
              <input
                type="text"
                id="scaleOfPay"
                name="scaleOfPay"
                value={form.scaleOfPay}
                onChange={handleChange}
                placeholder="Scale of Pay"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <label htmlFor="presentPay">Present Pay</label>
              <input
                type="text"
                id="presentPay"
                name="presentPay"
                value={form.presentPay}
                onChange={handleChange}
                placeholder="Present Pay"
                className="w-full px-3 py-2 border rounded"
                required
              />
              <label htmlFor="natureOfAppointment">Nature of Appointment</label>
              <select
                id="natureOfAppointment"
                name="natureOfAppointment"
                value={form.natureOfAppointment}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select Nature of Appointment</option>
                <option value="Temporary">Temporary</option>
                <option value="Probationer">Probationer</option>
                <option value="Approved Probationer">Approved Probationer</option>
                <option value="Permanent">Permanent</option>
              </select>
            </>
          )}
          <button
            type="submit"
            className="w-full bg-[#145DA0] text-white py-2 rounded"
          >
            Sign Up
          </button>
        </>
      )}
    </form>
  );
}
