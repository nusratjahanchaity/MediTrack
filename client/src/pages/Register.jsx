import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase.js";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";


function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Real Firebase ID Token retrieve
      const token = await user.getIdToken();

      // Backend এ User sync করা
      await axios.post(`${API_BASE_URL}/api/auth/sync`, { role }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Token LocalStorage এ Save করা
      localStorage.setItem('token', token);

      navigate("/dashboard");
    } catch (err) {
      console.error("Registration Error:", err);
      if (err.code) {
        if (err.code === 'auth/email-already-in-use') {
          setError("This email is already in use.");
        } else if (err.code === 'auth/weak-password') {
          setError("Password is too weak. Must be at least 6 characters.");
        } else if (err.code === 'auth/invalid-email') {
          setError("Invalid email format.");
        } else {
          setError(`Registration failed: ${err.message}`);
        }
      } else {
        setError(err.response?.data?.message || err.message || "Registration Failed.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-2xl">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Medi<span className="text-blue-600">Track</span></h1>
          <p className="text-gray-500 mt-2">Hospital Management System</p>
        </div>

        <h2 className="mb-6 text-2xl font-bold text-center text-blue-600">
          Create MediTrack Account
        </h2>

        {error && <p className="mb-4 text-sm text-center text-red-500">{error}</p>}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Create Password - min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">I want to register as a:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="user">Patient / Normal User</option>
              <option value="caregiver">Caregiver</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;