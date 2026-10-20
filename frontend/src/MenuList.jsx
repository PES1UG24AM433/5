import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";

function MenuList({ onAddToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [foodType, setFoodType] = useState("All");
  const [availability, setAvailability] = useState("All");

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/menu");
      if (!Array.isArray(data.items)) throw new Error("The menu server returned an invalid response.");
      setItems(data.items);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "Cannot connect to the menu server." : requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(term);
      const matchesFoodType = foodType === "All" || item.foodType === foodType;
      const isAvailable = item.available && item.stock > 0;
      const matchesAvailability =
        availability === "All" ||
        (availability === "Available" && isAvailable) ||
        (availability === "Unavailable" && !isAvailable);

      return matchesName && matchesFoodType && matchesAvailability;
    });
  }, [items, searchTerm, foodType, availability]);

  return (
    <div className="menu-panel">
      <div className="menu-toolbar">
        <label className="search-box" htmlFor="menu-search">
          <span>⌕</span>
          <input id="menu-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by item name..." />
        </label>
        <button className="button outline-button" type="button" onClick={loadMenu} disabled={loading}>{loading ? "Refreshing..." : "Refresh menu"}</button>
      </div>
      <div className="filter-toolbar" aria-label="Menu filters">
        <FilterSelect id="food-type-filter" label="Food type" value={foodType} onChange={setFoodType} options={["All", "Veg", "Non-Veg"]} />
        <FilterSelect id="availability-filter" label="Availability" value={availability} onChange={setAvailability} options={["All", "Available", "Unavailable"]} />
        {(foodType !== "All" || availability !== "All" || searchTerm) && (
          <button
            className="text-button clear-filters"
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFoodType("All");
              setAvailability("All");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {loading && <div className="loading-state" role="status"><span className="spinner" />Loading today&apos;s menu...</div>}
      {error && <div className="notice error" role="alert">{error}<button className="text-button" type="button" onClick={loadMenu}>Retry</button></div>}
      {!loading && !error && items.length === 0 && <div className="empty-state"><div className="empty-icon">🍽️</div><h3>No menu items yet</h3><p>The canteen menu is being prepared. Please check back soon.</p></div>}
      {!loading && !error && items.length > 0 && filteredItems.length === 0 && <div className="empty-state"><div className="empty-icon">🔎</div><h3>No matches found</h3><p>Try a different search or adjust the selected filters.</p><button className="text-button" type="button" onClick={() => { setSearchTerm(""); setFoodType("All"); setAvailability("All"); }}>Clear filters</button></div>}
      {!loading && !error && filteredItems.length > 0 && <div className="menu-grid">{filteredItems.map((item) => { const isAvailable = item.available && item.stock > 0; return <article className="food-card" key={item._id}><div className="food-card-art" aria-hidden="true">{item.name.charAt(0).toUpperCase()}</div><div className="food-card-body"><div className="food-card-heading"><h3>{item.name}</h3><strong>₹{Number(item.price).toFixed(2)}</strong></div><div className="food-meta"><span className="food-type">{item.foodType || "Type not set"}</span><p className={isAvailable ? "availability available" : "availability unavailable"}><span />{isAvailable ? `${item.stock} available` : "Currently unavailable"}</p></div><button className="button primary-button full-button" type="button" disabled={!isAvailable} onClick={() => onAddToCart(item)}>{isAvailable ? "Add to cart" : "Unavailable"}</button></div></article>; })}</div>}
    </div>
  );
}

function FilterSelect({ id, label, value, onChange, options }) {
  return (
    <label className="filter-select" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default MenuList;
