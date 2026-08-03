import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase.js";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log('Button Clicked!', email, password);

    try {
      // Firebase দিয়ে Login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Real Firebase ID Token retrieve
      const token = await user.getIdToken();

      // Backend এ User sync করা
      await axios.post(`${API_BASE_URL}/api/auth/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // User Token হিসেবে Save                                                                                                        
      localStorage.setItem('token', token);
      console.log('Token Set successfully');

      // Dashboard এ Navigate
      navigate('/dashboard');

    } catch (err) {
      console.error("Login Error:", err.message);

      // User friendly error message
      if (err.code === 'auth/wrong-password') {
        setError("Incorrect password!");
      } else if (err.code === 'auth/user-not-found') {
        setError("No account found with this email!");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email format!");
      } else {
        setError("Login failed. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white border-gray-100 shadow-xl rounded-2xl">

        <div className="flex flex-col items-center mb-8">
          <div className="p-4 mb-4 bg-blue-600 shadow-lg rounded-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Medi<span className="text-blue-600">Track</span></h1>
          <p className="mb-6 text-sm text-center text-gray-500">Please sign in to continue</p>
        </div>        

        {error && (
          <div className="px-4 py-3 mb-4 text-sm text-red-600 border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white transition duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}