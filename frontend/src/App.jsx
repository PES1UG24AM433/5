import { useEffect, useState } from "react";
import "./App.css";
import MenuList from "./MenuList";
import { apiRequest } from "./api";

const emptyForm = {
  name: "",
  email: "",
  studentId: "",
  password: ""
};

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  return path;
}

function App() {
  const route = useRoute();
  const [cart, setCart] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  function navigate(path) {
    setMobileMenuOpen(false);
    navigateTo(path);
  }

  function addToCart(item) {
    setCart((currentCart) => {
      const existing = currentCart.find((cartItem) => cartItem._id === item._id);
      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, item.stock) }
            : cartItem
        );
      }
      return [...currentCart, { ...item, quantity: 1 }];
    });
  }

  function updateCartQuantity(id, quantity) {
    setCart((currentCart) =>
      currentCart
        .map((item) => (item._id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container nav-wrap">
          <button className="brand" type="button" onClick={() => navigate("/")}>
            <span className="brand-icon">C</span>
            <span>
              <strong>Campus Crave</strong>
              <small>Fresh. Fast. Yours.</small>
            </span>
          </button>
          <button
            className="mobile-toggle"
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            ☰
          </button>
          <nav className={mobileMenuOpen ? "main-nav open" : "main-nav"}>
            <button className={route === "/" ? "nav-link active" : "nav-link"} type="button" onClick={() => navigate("/")}>
              Menu
            </button>
            <button className={route === "/orders" ? "nav-link active" : "nav-link"} type="button" onClick={() => navigate("/orders")}>
              My orders
            </button>
            <button className={route === "/register" ? "nav-link active" : "nav-link"} type="button" onClick={() => navigate("/register")}>
              Register
            </button>
            <button className="cart-link" type="button" onClick={() => navigate("/cart")}>
              Cart <span>{cartCount}</span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        {route === "/" && <HomePage onAddToCart={addToCart} />}
        {route === "/register" && <RegisterPage onNavigate={navigate} />}
        {route === "/login" && <LoginPage onNavigate={navigate} />}
        {route === "/cart" && (
          <CartPage
            cart={cart}
            onNavigate={navigate}
            onUpdateQuantity={updateCartQuantity}
            onClearCart={clearCart}
            onOrderCreated={setLatestOrder}
          />
        )}
        {route === "/orders" && <OrdersPage />}
        {route === "/payment" && <PaymentPage order={latestOrder} onNavigate={navigate} />}
        {route.startsWith("/orders/") && (
          <OrderConfirmationPage
            orderId={route.split("/")[2]}
            fallbackOrder={latestOrder}
            onNavigate={navigate}
          />
        )}
        {!["/", "/register", "/login", "/cart", "/orders", "/payment"].includes(route) &&
          !route.startsWith("/orders/") && <NotFoundPage onNavigate={navigate} />}
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <div>
            <strong>Campus Crave</strong>
            <p>Good food, less waiting, more campus life.</p>
          </div>
          <p>© 2026 Campus Crave · Student canteen pre-orders</p>
        </div>
      </footer>
    </div>
  );
}

function PageIntro({ eyebrow, title, description }) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function HomePage({ onAddToCart }) {
  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <div>
            <p className="eyebrow">YOUR CAMPUS, YOUR FLAVOUR</p>
            <h1>Good food is just a few clicks away.</h1>
            <p>Browse today&apos;s canteen menu, pre-order your favourites, and skip the queue.</p>
            <a className="button primary-button" href="#menu">Explore today&apos;s menu</a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span>🥗</span><span>🥪</span><span>☕</span>
          </div>
        </div>
      </section>
      <section className="container content-section" id="menu">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FRESH FROM THE KITCHEN</p>
            <h2>Today&apos;s menu</h2>
          </div>
          <p>Made for busy students, ready when you are.</p>
        </div>
        <MenuList onAddToCart={onAddToCart} />
      </section>
    </>
  );
}

function RegisterPage({ onNavigate }) {
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback({ type: "", text: "" });
    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm(emptyForm);
      setFeedback({ type: "success", text: data.message });
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro eyebrow="JOIN THE COMMUNITY" title="Create your account" description="Register once and make your next campus meal a little easier." />
      <form className="form-card" onSubmit={handleSubmit}>
        <FormField id="name" label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <FormField id="email" label="Email address" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <FormField id="studentId" label="Student ID" value={form.studentId} onChange={(value) => setForm({ ...form, studentId: value })} />
        <FormField id="password" label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
        {feedback.text && <div className={`notice ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.text}</div>}
        <button className="button primary-button" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        <p className="form-footnote">Already registered? <button className="text-button" type="button" onClick={() => onNavigate("/login")}>Sign in</button></p>
      </form>
    </section>
  );
}

function LoginPage({ onNavigate }) {
  return (
    <section className="container narrow-page">
      <PageIntro eyebrow="WELCOME BACK" title="Student login" description="Student login is ready for the authentication endpoint when it is added to the backend." />
      <div className="form-card unavailable-card">
        <div className="empty-icon">🔐</div>
        <h2>Student authentication is not available yet</h2>
        <p>The current backend supports student registration but does not expose a student login or token endpoint. No fake login is performed.</p>
        <button className="button primary-button" type="button" onClick={() => onNavigate("/register")}>Create an account</button>
      </div>
    </section>
  );
}

function FormField({ id, label, type = "text", value, onChange, required = true }) {
  return (
    <label className="form-field" htmlFor={id}>
      {label}
      <input id={id} name={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function CartPage({ cart, onNavigate, onUpdateQuantity, onClearCart, onOrderCreated }) {
  const [student, setStudent] = useState({ id: "", name: "", email: "" });
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  async function placeOrder(event) {
    event.preventDefault();
    if (!cart.length) return;
    setLoading(true);
    setFeedback({ type: "", text: "" });
    try {
      const validation = await apiRequest("/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({ items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })) })
      });
      if (!validation.valid) throw new Error(validation.message);
      const data = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          items: cart.map((item) => ({ productId: item._id, quantity: item.quantity }))
        })
      });
      onOrderCreated(data.order);
      onClearCart();
      onNavigate(`/orders/${data.order.id}`);
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container checkout-page">
      <PageIntro eyebrow="CHECKOUT" title="Your cart" description="Review your items and confirm availability before placing your pre-order." />
      {!cart.length ? (
        <div className="empty-state form-card"><div className="empty-icon">🛒</div><h2>Your cart is empty</h2><p>Pick something delicious from today&apos;s menu to get started.</p><button className="button primary-button" type="button" onClick={() => onNavigate("/")}>Browse menu</button></div>
      ) : (
        <div className="checkout-grid">
          <div className="form-card cart-items">
            {cart.map((item) => (
              <div className="cart-row" key={item._id}>
                <div><h3>{item.name}</h3><p>₹{item.price.toFixed(2)} each · {item.stock} available</p></div>
                <div className="quantity-control"><button type="button" onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}>-</button><strong>{item.quantity}</strong><button type="button" onClick={() => onUpdateQuantity(item._id, Math.min(item.quantity + 1, item.stock))}>+</button></div>
                <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            ))}
            <button className="text-button" type="button" onClick={onClearCart}>Clear cart</button>
          </div>
          <form className="form-card summary-card" onSubmit={placeOrder}>
            <h2>Order details</h2>
            <FormField id="checkoutStudentId" label="Student ID" value={student.id} onChange={(value) => setStudent({ ...student, id: value })} />
            <FormField id="checkoutStudentName" label="Full name" value={student.name} onChange={(value) => setStudent({ ...student, name: value })} />
            <FormField id="checkoutStudentEmail" label="Email address" type="email" value={student.email} onChange={(value) => setStudent({ ...student, email: value })} />
            <div className="total-row"><span>Estimated total</span><strong>₹{subtotal.toFixed(2)}</strong></div>
            {feedback.text && <div className="notice error" role="alert">{feedback.text}</div>}
            <button className="button primary-button" type="submit" disabled={loading}>{loading ? "Validating order..." : "Place order"}</button>
            <p className="helper-text">Final availability and total are calculated and validated by the server.</p>
          </form>
        </div>
      )}
    </section>
  );
}

function OrderConfirmationPage({ orderId, fallbackOrder, onNavigate }) {
  const [order, setOrder] = useState(fallbackOrder?.id === orderId ? fallbackOrder : null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  useEffect(() => {
    if (order) return;
    apiRequest(`/api/orders/${encodeURIComponent(orderId)}`)
      .then((data) => setOrder(data.order))
      .catch((requestError) => setError(requestError.message));
  }, [order, orderId]);

  async function cancelOrder() {
    setCancelling(true);
    setError("");
    try {
      const data = await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "PATCH"
      });
      setOrder((currentOrder) => ({ ...currentOrder, status: data.order.status }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro eyebrow="ORDER CONFIRMED" title="Thanks for your order" description="Your order has been recorded by the canteen." />
      {error && <div className="notice error" role="alert">{error}</div>}
      {order ? <div className="form-card confirmation-card"><div className="success-mark">✓</div><p className="eyebrow">ORDER ID</p><h2>{order.id}</h2><OrderSummary order={order} /><div className="button-row"><button className="button primary-button" type="button" onClick={() => onNavigate("/payment")}>Payment simulation</button><button className="button secondary-button" type="button" onClick={() => onNavigate("/")}>Back to menu</button>{order.status === "Placed" && <button className="text-button" type="button" disabled={cancelling} onClick={cancelOrder}>{cancelling ? "Cancelling..." : "Cancel order"}</button>}</div></div> : !error && <LoadingState text="Loading your order..." />}
    </section>
  );
}

function OrderSummary({ order }) {
  return <div className="order-summary">{order.items.map((item) => <div className="summary-line" key={item.productId}><span>{item.name} × {item.quantity}</span><strong>₹{item.subtotal.toFixed(2)}</strong></div>)}<div className="total-row"><span>Total</span><strong>₹{order.totalAmount.toFixed(2)}</strong></div><p className="status-pill">{order.status}</p></div>;
}

function OrdersPage() {
  const [lookup, setLookup] = useState({ studentId: "", email: "" });
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function findOrders(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");
    try {
      const query = new URLSearchParams({ studentId: lookup.studentId, studentEmail: lookup.email });
      const data = await apiRequest(`/api/orders?${query.toString()}`);
      setOrders(data.orders);
      if (!data.orders.length) setFeedback("No orders found for these details.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <section className="container narrow-page"><PageIntro eyebrow="ORDER HISTORY" title="My orders" description="Look up orders using the student details supplied at checkout. Full authenticated history will be available when student login is added." /><form className="form-card" onSubmit={findOrders}><FormField id="historyStudentId" label="Student ID" value={lookup.studentId} onChange={(value) => setLookup({ ...lookup, studentId: value })} /><FormField id="historyEmail" label="Email address" type="email" value={lookup.email} onChange={(value) => setLookup({ ...lookup, email: value })} />{feedback && <div className="notice" role="status">{feedback}</div>}<button className="button primary-button" type="submit" disabled={loading}>{loading ? "Searching..." : "Find my orders"}</button></form>{orders.length > 0 && <div className="order-history">{orders.map((order) => <article className="form-card history-card" key={order.id}><div><p className="eyebrow">ORDER {order.id}</p><h2>₹{order.totalAmount.toFixed(2)}</h2><p>{new Date(order.orderTime).toLocaleString()}</p></div><span className="status-pill">{order.status}</span></article>)}</div>}</section>;
}

function PaymentPage({ order, onNavigate }) {
  const [outcome, setOutcome] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function simulatePayment(selectedOutcome) {
    if (!order?.id) {
      setMessage("Open payment simulation from a confirmed order.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await apiRequest(`/api/payments/${encodeURIComponent(order.id)}`, { method: "POST", body: JSON.stringify({ outcome: selectedOutcome }) });
      setOutcome(data.paymentStatus);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <section className="container narrow-page"><PageIntro eyebrow="PAYMENT" title="Payment status" description="This is a clearly labelled simulation for development and testing. No real payment is processed." /><div className="form-card payment-card"><div className="simulation-badge">SIMULATION ONLY</div>{order ? <><p>Order <strong>{order.id}</strong> · ₹{order.totalAmount.toFixed(2)}</p><div className="button-row"><button className="button primary-button" type="button" disabled={loading} onClick={() => simulatePayment("success")}>Simulate success</button><button className="button outline-button" type="button" disabled={loading} onClick={() => simulatePayment("failure")}>Simulate failure</button></div></> : <button className="button primary-button" type="button" onClick={() => onNavigate("/")}>Return to menu</button>}{message && <div className={`notice ${outcome === "Success" ? "success" : "error"}`} role="status">{message}{outcome && <strong> Status: {outcome}</strong>}</div>}</div></section>;
}

function LoadingState({ text }) {
  return <p className="loading-state" role="status"><span className="spinner" />{text}</p>;
}

function NotFoundPage({ onNavigate }) {
  return <section className="container narrow-page"><div className="form-card empty-state"><h1>Page not found</h1><p>That page does not exist.</p><button className="button primary-button" type="button" onClick={() => onNavigate("/")}>Back to menu</button></div></section>;
}

export default App;
