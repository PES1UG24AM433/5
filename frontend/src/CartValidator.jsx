
import { useState } from "react";

function CartValidator() {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleValidate(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!productId.trim()) {
      setError("Please enter a product ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/cart/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [
              {
                productId: productId.trim(),
                quantity: parsedQuantity
              }
            ]
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.message || "Cart validation failed.");
      }

      setMessage(data.message);
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
      <h2>Validate your cart</h2>
      <p className="subtitle">
        Check item availability before proceeding to checkout.
      </p>

      {message && (
        <div className="notice success" role="status">{message}</div>
      )}

      {error && (
        <div className="notice error" role="alert">{error}</div>
      )}

      <form onSubmit={handleValidate}>
        <label htmlFor="productId">Product ID</label>
        <input
          id="productId"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          placeholder="Enter a menu item's MongoDB ID"
          required
        />

        <label htmlFor="quantity">Quantity</label>
        <input
          id="quantity"
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Validate Cart"}
        </button>
      </form>
    </section>
  );
}

export default CartValidator;
