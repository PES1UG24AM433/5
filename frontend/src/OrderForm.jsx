
import { useEffect, useState } from "react";

function OrderForm() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch("http://localhost:5000/api/menu");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load menu.");
        }

        const availableItems = data.items.filter(
          (item) => item.available && item.stock > 0
        );

        setItems(availableItems);
        setSelectedId(availableItems[0]?._id || "");
      } catch (err) {
        setError(err.message || "Unable to load menu.");
      } finally {
        setMenuLoading(false);
      }
    }

    loadMenu();
  }, []);

  const selectedItem = items.find((item) => item._id === selectedId);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const parsedQuantity = Number(quantity);

    if (!selectedItem) {
      setError("Please select an available menu item.");
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (parsedQuantity > selectedItem.stock) {
      setError(`Only ${selectedItem.stock} portion(s) are available.`);
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
              productId: selectedItem._id,
              quantity: parsedQuantity
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.errors?.join(", ") ||
          data.message ||
          "Unable to place order."
        );
      }

      setMessage(
        `Order placed successfully! Order ID: ${data.order.id}. Total: ₹${data.order.totalAmount}`
      );
      setQuantity("1");
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
      <p className="subtitle">
        Choose an available item from the current menu.
      </p>

      {message && (
        <div className="notice success" role="status">{message}</div>
      )}
      {error && (
        <div className="notice error" role="alert">{error}</div>
      )}

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

        <label htmlFor="menuItem">Menu item</label>
        {menuLoading ? (
          <p>Loading menu items...</p>
        ) : (
          <select
            id="menuItem"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            required
            disabled={items.length === 0}
          >
            <option value="" disabled>Select a menu item</option>
            {items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} — ₹{item.price} ({item.stock} available)
              </option>
            ))}
          </select>
        )}

        {!menuLoading && items.length === 0 && (
          <p>No menu items are currently available.</p>
        )}

        <label htmlFor="orderQuantity">Quantity</label>
        <input
          id="orderQuantity"
          type="number"
          min="1"
          max={selectedItem?.stock || 1}
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />

        {selectedItem && (
          <p>
            Estimated total: ₹
            {(selectedItem.price * Number(quantity || 0)).toFixed(2)}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || menuLoading || items.length === 0}
        >
          {loading ? "Placing order..." : "Place Pre-Order"}
        </button>
      </form>
    </section>
  );
}

export default OrderForm;
