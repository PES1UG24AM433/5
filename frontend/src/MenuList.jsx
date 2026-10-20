
import { useCallback, useEffect, useState } from "react";

function MenuList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/menu");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load menu.");
      }

      setItems(data.items);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the menu server."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return (
    <section className="register-card">
      <p className="eyebrow">CANTEEN PRE-ORDER SYSTEM</p>
      <h2>Today's Menu</h2>
      <p className="subtitle">
        Menu items and prices are loaded from the server.
      </p>

      {loading && <p>Loading menu...</p>}

      {error && (
        <div className="notice error" role="alert">
          {error}
          <button type="button" onClick={loadMenu}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p>No menu items are available yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="menu-list">
          {items.map((item) => (
            <article className="menu-item" key={item._id}>
              <div>
                <h3>{item.name}</h3>
                <p>Price: ₹{Number(item.price).toFixed(2)}</p>
                <p>Stock: {item.stock}</p>
                <p>
                  Availability:{" "}
                  {item.available && item.stock > 0
                    ? "Available"
                    : "Unavailable"}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <button type="button" onClick={loadMenu} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Menu"}
      </button>
    </section>
  );
}

export default MenuList;
