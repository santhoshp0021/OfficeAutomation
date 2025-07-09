import { useState } from "react";
import { UserData } from "../../context/UserContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = UserData();
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(form);
    if (success) {
      setForm({ email: "", password: "" });
      navigate("/");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto space-y-4 flex flex-col justify-center self-center min-h-[100vh] w-[80%]"
    >
      <h2 className="text-xl font-bold text-center">Login</h2>
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full px-3 py-2 border rounded"
        required
      />
      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
        className="w-full px-3 py-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full bg-[#145DA0] text-white py-2 rounded hover:cursor-pointer"
      >
        Log In
      </button>
      <p className="text-center mt-2">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="text-[#145DA0] font-semibold hover:underline"
        >
          Sign up here
        </Link>
      </p>
    </form>
  );
}
