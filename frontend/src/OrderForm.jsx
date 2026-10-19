
import { useState } from "react";

const TEST_PRODUCT_ID = "507f1f77bcf86cd799439011";

function OrderForm() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          studentEmail,
          items: [
            {
              productId: TEST_PRODUCT_ID,
              quantity: parsedQuantity
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.errors?.join(", ") || data.message || "Unable to place order.");
      }

      setMessage(
        `Order placed successfully! Order ID: ${data.order.id}. Total: ₹${data.order.totalAmount}`
      );
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that the server is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="register-card">
      <p className="eyebrow">CANTEEN PRE-ORDER SYSTEM</p>
      <h2>Place a pre-order</h2>
      <p className="subtitle">Select your quantity and submit your order.</p>

      {message && <div className="notice success" role="status">{message}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="orderStudentId">Student ID</label>
        <input
          id="orderStudentId"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          required
        />

        <label htmlFor="orderStudentName">Student name</label>
        <input
          id="orderStudentName"
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          required
        />

        <label htmlFor="orderStudentEmail">Student email</label>
        <input
          id="orderStudentEmail"
          type="email"
          value={studentEmail}
          onChange={(event) => setStudentEmail(event.target.value)}
          required
        />

        <label htmlFor="orderQuantity">Veg Sandwich quantity</label>
        <input
          id="orderQuantity"
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Placing order..." : "Place Pre-Order"}
        </button>
      </form>
    </section>
  );
}

export default OrderForm;
