
import { useState } from "react";

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
      const response = await fetch(
        `http://localhost:5000/api/payments/${encodeURIComponent(
          orderId.trim()
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ outcome }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update payment status."
        );
      }

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
