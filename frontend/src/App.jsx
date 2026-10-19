
import { useState } from "react";
import "./App.css";
import CartValidator from "./CartValidator";
import OrderForm from "./OrderForm";
import PaymentStatus from "./PaymentStatus";

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.errors?.join(", ") ||
          data.message ||
          "Registration failed."
        );
      }

      setMessage(data.message);
      setForm({ name: "", email: "", studentId: "", password: "" });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check that the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="register-card">
        <div className="brand-mark">C</div>
        <p className="eyebrow">CANTEEN PRE-ORDER SYSTEM</p>
        <h1>Create your account</h1>
        <p className="subtitle">
          Register as a student to get started.
        </p>

        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="studentId">Student ID</label>
          <input
            id="studentId"
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            placeholder="Enter your student ID"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="footer-note">
          Your account details are handled securely.
        </p>
      </section>
     <CartValidator />
     <OrderForm />
     <PaymentStatus />
    </main>
  );
}

export default App;
