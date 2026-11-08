import { useState } from "react";
import { apiRequest } from "./api";

function PaymentStatus() {
  const [orderId, setOrderId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async (outcome) => {
    if (!orderId.trim()) {
      setMessage("Please enter an order ID.");
      setPaymentStatus("");
      return;
    }

    setLoading(true);
    setMessage("");
    setPaymentStatus("");

    try {
      const data = await apiRequest(
        `/api/payments/${encodeURIComponent(orderId.trim())}`,
        {
          method: "POST",
          body: JSON.stringify({ outcome })
        }
      );

      setPaymentStatus(data.paymentStatus);
      setMessage(data.message);
    } catch (error) {
      setMessage(
        error.message || "Could not connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="payment-status">
      <h2>Payment Status</h2>
      <p>Enter your order ID to simulate a payment.</p>

      <input
        type="text"
        placeholder="Enter order ID"
        value={orderId}
        onChange={(event) => setOrderId(event.target.value)}
      />

      <div className="payment-actions">
        <button
          type="button"
          disabled={loading}
          onClick={() => handlePayment("success")}
        >
          Simulate Successful Payment
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handlePayment("failure")}
        >
          Simulate Failed Payment
        </button>
      </div>

      {loading && <p>Processing payment...</p>}

      {message && (
        <p
          role="status"
          className={`payment-result ${
            paymentStatus === "Success"
              ? "success"
              : paymentStatus === "Failed"
              ? "failed"
              : ""
          }`}
        >
          {message}
          {paymentStatus && (
            <>
              <br />
              Payment status: <strong>{paymentStatus}</strong>
            </>
          )}
        </p>
      )}
    </section>
  );
}

export default PaymentStatus;