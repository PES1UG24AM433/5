import { useEffect, useState } from "react";
import "./App.css";
import MenuList from "./MenuList";
import {
  apiRequest,
  clearStaffSession,
  clearStudentSession,
  getStoredStaff,
  getStoredStudent,
  saveStaffSession,
  saveStudentSession,
  staffApiRequest
} from "./api";

const emptyForm = {
  name: "",
  email: "",
  studentId: "",
  password: ""
};

const CART_STORAGE_KEY = "campus-crave-cart";

function loadStoredCart() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter(
      (item) =>
        item &&
        typeof item._id === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

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
  const [cart, setCart] = useState(loadStoredCart);
  const [latestOrder, setLatestOrder] = useState(null);
  const [student, setStudent] = useState(getStoredStudent);
  const [staff, setStaff] = useState(getStoredStaff);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!student) {
      return;
    }

    apiRequest("/api/auth/me").catch(() => {
      clearStudentSession();
      setStudent(null);
    });
  }, [student]);

  useEffect(() => {
    if (!staff) {
      return;
    }

    staffApiRequest("/api/staff/auth/me").catch(() => {
      clearStaffSession();
      setStaff(null);

      if (window.location.pathname.startsWith("/staff")) {
        navigateTo("/staff/login");
      }
    });
  }, [staff]);

  function navigate(path) {
    setMobileMenuOpen(false);
    navigateTo(path);
  }

  function handleLogin(loginData) {
    saveStudentSession(loginData.token, loginData.student);
    setStudent(loginData.student);
    navigate("/");
  }

  function handleLogout() {
    clearStudentSession();
    setStudent(null);
    navigate("/");
  }

  function handleStaffLogin(loginData) {
    saveStaffSession(loginData.token, loginData.staff);
    setStaff(loginData.staff);
    navigate("/staff/orders");
  }

  function handleStaffLogout() {
    clearStaffSession();
    setStaff(null);
    navigate("/staff/login");
  }

  function addToCart(item) {
    if (!item.available || item.stock < 1) {
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) => cartItem._id === item._id
      );

      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem._id === item._id
            ? {
                ...cartItem,
                ...item,
                quantity: Math.min(cartItem.quantity + 1, item.stock)
              }
            : cartItem
        );
      }

      return [...currentCart, { ...item, quantity: 1 }];
    });
  }

  function updateCartQuantity(id, quantity) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === id
            ? {
                ...item,
                quantity: Math.max(1, Math.min(quantity, item.stock))
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((currentCart) =>
      currentCart.filter((item) => item._id !== id)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const isStaffRoute = route.startsWith("/staff");

  return (
    <div className="site-shell">
      {!isStaffRoute ? (
        <header className="site-header">
          <div className="container nav-wrap">
            <button
              className="brand"
              type="button"
              onClick={() => navigate("/")}
            >
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

            <nav
              className={mobileMenuOpen ? "main-nav open" : "main-nav"}
            >
              <button
                className={
                  route === "/" ? "nav-link active" : "nav-link"
                }
                type="button"
                onClick={() => navigate("/")}
              >
                Menu
              </button>

              <button
                className={
                  route === "/orders"
                    ? "nav-link active"
                    : "nav-link"
                }
                type="button"
                onClick={() => navigate("/orders")}
              >
                My orders
              </button>

              <button
                className={
                  route === "/register"
                    ? "nav-link active"
                    : "nav-link"
                }
                type="button"
                onClick={() => navigate("/register")}
              >
                Register
              </button>

              {student ? (
                <>
                  <span className="student-greeting">
                    Hi, {student.name}
                  </span>
                  <button
                    className="nav-link"
                    type="button"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <button
                  className={
                    route === "/login"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </button>
              )}

              <button
                className="cart-link"
                type="button"
                onClick={() => navigate("/cart")}
              >
                Cart <span>{cartCount}</span>
              </button>
            </nav>
          </div>
        </header>
      ) : (
        <header className="site-header staff-header">
          <div className="container nav-wrap">
            <button
              className="brand"
              type="button"
              onClick={() =>
                navigate(staff ? "/staff/orders" : "/staff/login")
              }
            >
              <span className="brand-icon">C</span>
              <span>
                <strong>Campus Crave</strong>
                <small>Staff Portal</small>
              </span>
            </button>

            {staff && (
              <nav className="main-nav staff-nav">
                <span className="student-greeting">
                  {staff.name} · {staff.role}
                </span>

                <button
                  className={
                    route === "/staff/orders"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  type="button"
                  onClick={() => navigate("/staff/orders")}
                >
                  Incoming orders
                </button>

                <button
                  className="nav-link"
                  type="button"
                  onClick={handleStaffLogout}
                >
                  Log out
                </button>
              </nav>
            )}
          </div>
        </header>
      )}

      <main>
        {route === "/" && <HomePage onAddToCart={addToCart} />}

        {route === "/register" && (
          <RegisterPage onNavigate={navigate} />
        )}

        {route === "/login" && (
          <LoginPage
            onNavigate={navigate}
            onLogin={handleLogin}
          />
        )}

        {route === "/cart" && (
          <CartPage
            cart={cart}
            onNavigate={navigate}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onOrderCreated={setLatestOrder}
            student={student}
          />
        )}

        {route === "/orders" && (
          <OrdersPage
            student={student}
            onNavigate={navigate}
          />
        )}

        {route === "/payment" && (
          <PaymentPage
            order={latestOrder}
            onNavigate={navigate}
          />
        )}

        {route.startsWith("/orders/") && (
          <OrderConfirmationPage
            orderId={route.split("/")[2]}
            fallbackOrder={latestOrder}
            onOrderLoaded={setLatestOrder}
            onNavigate={navigate}
          />
        )}

        {route === "/staff/login" && (
          <StaffLoginPage
            onNavigate={navigate}
            onLogin={handleStaffLogin}
          />
        )}

        {route === "/staff/orders" && (
          <StaffOrdersPage
            staff={staff}
            onNavigate={navigate}
          />
        )}

        {![
          "/",
          "/register",
          "/login",
          "/cart",
          "/orders",
          "/payment",
          "/staff/login",
          "/staff/orders"
        ].includes(route) &&
          !route.startsWith("/orders/") && (
            <NotFoundPage onNavigate={navigate} />
          )}
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
            <p>
              Browse today&apos;s canteen menu, pre-order your
              favourites, and skip the queue.
            </p>
            <a className="button primary-button" href="#menu">
              Explore today&apos;s menu
            </a>
          </div>

          <div className="hero-art" aria-hidden="true">
            <span>🥗</span>
            <span>🥪</span>
            <span>☕</span>
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
  const [feedback, setFeedback] = useState({
    type: "",
    text: ""
  });
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
      setFeedback({
        type: "success",
        text: data.message
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro
        eyebrow="JOIN THE COMMUNITY"
        title="Create your account"
        description="Register once and make your next campus meal a little easier."
      />

      <form className="form-card" onSubmit={handleSubmit}>
        <FormField
          id="name"
          label="Full name"
          value={form.name}
          onChange={(value) =>
            setForm({ ...form, name: value })
          }
        />

        <FormField
          id="email"
          label="Email address"
          type="email"
          value={form.email}
          onChange={(value) =>
            setForm({ ...form, email: value })
          }
        />

        <FormField
          id="studentId"
          label="Student ID"
          value={form.studentId}
          onChange={(value) =>
            setForm({ ...form, studentId: value })
          }
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) =>
            setForm({ ...form, password: value })
          }
        />

        {feedback.text && (
          <div
            className={`notice ${feedback.type}`}
            role={
              feedback.type === "error"
                ? "alert"
                : "status"
            }
          >
            {feedback.text}
          </div>
        )}

        <button
          className="button primary-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="form-footnote">
          Already registered?{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => onNavigate("/login")}
          >
            Sign in
          </button>
        </p>
      </form>
    </section>
  );
}

function LoginPage({ onNavigate, onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [feedback, setFeedback] = useState({
    type: "",
    text: ""
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback({ type: "", text: "" });

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });

      onLogin(data);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro
        eyebrow="WELCOME BACK"
        title="Student login"
        description="Sign in to manage your cart and orders."
      />

      <form className="form-card" onSubmit={handleSubmit}>
        <FormField
          id="loginEmail"
          label="Email address"
          type="email"
          value={form.email}
          onChange={(value) =>
            setForm({ ...form, email: value })
          }
        />

        <FormField
          id="loginPassword"
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) =>
            setForm({ ...form, password: value })
          }
        />

        {feedback.text && (
          <div className="notice error" role="alert">
            {feedback.text}
          </div>
        )}

        <button
          className="button primary-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="form-footnote">
          Need an account?{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => onNavigate("/register")}
          >
            Register
          </button>
        </p>

        <p className="form-footnote staff-login-link">
          Canteen staff?{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => onNavigate("/staff/login")}
          >
            Staff login
          </button>
        </p>
      </form>
    </section>
  );
}

function StaffLoginPage({ onNavigate, onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [feedback, setFeedback] = useState({
    type: "",
    text: ""
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setFeedback({ type: "", text: "" });

    try {
      const data = await apiRequest("/api/staff/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });

      onLogin(data);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro
        eyebrow="CANTEEN STAFF"
        title="Staff login"
        description="Sign in to view and process incoming student pre-orders."
      />

      <form
        className="form-card staff-login-card"
        onSubmit={handleSubmit}
      >
        <div className="staff-security-note">
          <strong>Staff-only area</strong>
          <span>
            Access is restricted to authorized staff accounts.
          </span>
        </div>

        <FormField
          id="staffLoginEmail"
          label="Staff email address"
          type="email"
          value={form.email}
          onChange={(value) =>
            setForm({ ...form, email: value })
          }
        />

        <FormField
          id="staffLoginPassword"
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) =>
            setForm({ ...form, password: value })
          }
        />

        {feedback.text && (
          <div className="notice error" role="alert">
            {feedback.text}
          </div>
        )}

        <button
          className="button primary-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Staff sign in"}
        </button>

        <p className="form-footnote">
          Student account?{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => onNavigate("/login")}
          >
            Student login
          </button>
        </p>
      </form>
    </section>
  );
}

function StaffOrdersPage({ staff, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  async function loadIncomingOrders() {
    if (!staff) {
      onNavigate("/staff/login");
      return;
    }

    setLoading(true);
    setFeedback({ type: "", text: "" });

    try {
      const data = await staffApiRequest("/api/orders/incoming");
      setOrders(data.orders);
    } catch (error) {
      setOrders([]);
      setFeedback({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId, status) {
    setUpdatingOrderId(orderId);
    setFeedback({ type: "", text: "" });

    try {
      const data = await staffApiRequest(
        `/api/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status })
        }
      );

      await loadIncomingOrders();

      setFeedback({
        type: "success",
        text: data.message || `Order status updated to ${status}.`
      });
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    } finally {
      setUpdatingOrderId("");
    }
  }

  useEffect(() => {
    if (!staff) {
      onNavigate("/staff/login");
      return;
    }

    loadIncomingOrders();
  }, [staff]);

  if (!staff) {
    return null;
  }

  return (
    <section className="container staff-page">
      <div className="staff-page-heading">
        <PageIntro
          eyebrow="STAFF QUEUE"
          title="Incoming orders"
          description="Review student pre-orders and update their status as they are processed."
        />

        <button
          className="button outline-button refresh-button"
          type="button"
          onClick={loadIncomingOrders}
          disabled={loading || Boolean(updatingOrderId)}
        >
          {loading ? "Refreshing..." : "Refresh queue"}
        </button>
      </div>

      <div className="staff-queue-summary">
        <div>
          <strong>{orders.length}</strong>
          <span>
            {orders.length === 1
              ? "incoming order"
              : "incoming orders"}
          </span>
        </div>

        <p>
          Signed in as <strong>{staff.name}</strong>
        </p>
      </div>

      {feedback.text && (
        <div className={`notice ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
          {feedback.text}
        </div>
      )}

      {loading && !orders.length ? (
        <LoadingState text="Loading incoming orders..." />
      ) : orders.length === 0 && !feedback.text ? (
        <div className="form-card empty-state">
          <div className="empty-icon">✓</div>
          <h2>No incoming orders</h2>
          <p>
            There are currently no placed student orders waiting
            to be processed.
          </p>

          <button
            className="button primary-button"
            type="button"
            onClick={loadIncomingOrders}
          >
            Check again
          </button>
        </div>
      ) : (
        <div className="staff-order-list">
          {orders.map((order) => (
            <StaffOrderCard
              key={order.id}
              order={order}
              updating={updatingOrderId === order.id}
              onStatusUpdate={updateOrderStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StaffOrderCard({ order, updating, onStatusUpdate }) {
  return (
    <article className="form-card staff-order-card">
      <div className="staff-order-top">
        <div>
          <p className="eyebrow">ORDER ID</p>
          <h2>{order.id}</h2>
        </div>

        <span className="status-pill">
          {order.status}
        </span>
      </div>

      <div className="staff-order-grid">
        <div className="staff-order-section">
          <p className="staff-order-label">Student</p>
          <strong>{order.studentName}</strong>
          <span>{order.studentId}</span>
          <span>{order.studentEmail}</span>
        </div>

        <div className="staff-order-section">
          <p className="staff-order-label">Order time</p>
          <strong>
            {new Date(order.orderTime).toLocaleString()}
          </strong>
          <span>
            Payment: {order.paymentStatus}
          </span>
        </div>

        <div className="staff-order-section">
          <p className="staff-order-label">Items</p>

          <div className="staff-items">
            {order.items.map((item) => (
              <div
                className="staff-item-row"
                key={item.productId}
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

                <strong>
                  ₹{item.subtotal.toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="staff-order-total">
        <span>Total</span>
        <strong>
          ₹{order.totalAmount.toFixed(2)}
        </strong>
      </div>

      <div className="staff-status-controls">
        <div>
          <p className="staff-order-label">Update status</p>
          <span className="staff-status-help">
            Placed orders can be marked Completed or Cancelled.
          </span>
        </div>

        <div className="staff-status-actions">
          <button
            className="button primary-button"
            type="button"
            disabled={updating}
            onClick={() => onStatusUpdate(order.id, "Completed")}
          >
            {updating ? "Updating..." : "Mark completed"}
          </button>

          <button
            className="button outline-button"
            type="button"
            disabled={updating}
            onClick={() => onStatusUpdate(order.id, "Cancelled")}
          >
            Cancel order
          </button>
        </div>
      </div>
    </article>
  );
}

function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = true
}) {
  return (
    <label className="form-field" htmlFor={id}>
      {label}

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
      />
    </label>
  );
}

function CartPage({
  cart,
  onNavigate,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
  student
}) {
  const [feedback, setFeedback] = useState({
    type: "",
    text: ""
  });

  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  async function placeOrder(event) {
    event.preventDefault();

    if (loading || !cart.length) return;

    if (!student) {
      onNavigate("/login");
      return;
    }

    setLoading(true);
    setFeedback({ type: "", text: "" });

    try {
      const validation = await apiRequest(
        "/api/cart/validate",
        {
          method: "POST",
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item._id,
              quantity: item.quantity
            }))
          })
        }
      );

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      const data = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item._id,
            quantity: item.quantity
          }))
        })
      });

      onOrderCreated(data.order);
      onClearCart();
      onNavigate(`/orders/${data.order.id}`);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container checkout-page">
      <PageIntro
        eyebrow="CHECKOUT"
        title="Your cart"
        description="Review your items and confirm availability before placing your pre-order."
      />

      {!cart.length ? (
        <div className="empty-state form-card">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>
            Pick something delicious from today&apos;s menu
            to get started.
          </p>

          <button
            className="button primary-button"
            type="button"
            onClick={() => onNavigate("/")}
          >
            Browse menu
          </button>
        </div>
      ) : (
        <div className="checkout-grid">
          <div className="form-card cart-items">
            {cart.map((item) => (
              <div className="cart-row" key={item._id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    ₹{item.price.toFixed(2)} each ·{" "}
                    {item.stock} available
                  </p>
                </div>

                <div className="quantity-control">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    onClick={() =>
                      item.quantity === 1
                        ? onRemoveItem(item._id)
                        : onUpdateQuantity(
                            item._id,
                            item.quantity - 1
                          )
                    }
                  >
                    -
                  </button>

                  <strong>{item.quantity}</strong>

                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={item.quantity >= item.stock}
                    onClick={() =>
                      onUpdateQuantity(
                        item._id,
                        item.quantity + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <strong>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </strong>

                <button
                  className="remove-item"
                  type="button"
                  onClick={() => onRemoveItem(item._id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              className="text-button"
              type="button"
              onClick={onClearCart}
            >
              Clear cart
            </button>
          </div>

          <form
            className="form-card summary-card"
            onSubmit={placeOrder}
          >
            <h2>Order details</h2>

            {student ? (
              <p className="signed-in-checkout">
                Ordering as <strong>{student.name}</strong>{" "}
                ({student.email})
              </p>
            ) : (
              <div className="notice error">
                Please log in before placing your order.
              </div>
            )}

            <div className="total-row">
              <span>Estimated total</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>

            {feedback.text && (
              <div className="notice error" role="alert">
                {feedback.text}
              </div>
            )}

            <button
              className="button primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Validating order..."
                : "Place order"}
            </button>

            <p className="helper-text">
              Final availability and total are calculated and
              validated by the server.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}

function OrderConfirmationPage({
  orderId,
  fallbackOrder,
  onOrderLoaded,
  onNavigate
}) {
  const [order, setOrder] = useState(
    fallbackOrder?.id === orderId
      ? fallbackOrder
      : null
  );

  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (order) {
      onOrderLoaded(order);
      return;
    }

    apiRequest(
      `/api/orders/${encodeURIComponent(orderId)}`
    )
      .then((data) => {
        setOrder(data.order);
        onOrderLoaded(data.order);
      })
      .catch((requestError) =>
        setError(requestError.message)
      );
  }, [onOrderLoaded, order, orderId]);

  async function cancelOrder() {
    setCancelling(true);
    setError("");

    try {
      const data = await apiRequest(
        `/api/orders/${encodeURIComponent(orderId)}/cancel`,
        {
          method: "PATCH"
        }
      );

      setOrder((currentOrder) => ({
        ...currentOrder,
        status: data.order.status
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro
        eyebrow={
          order
            ? "ORDER CONFIRMED"
            : error
              ? "ORDER UNAVAILABLE"
              : "ORDER CONFIRMATION"
        }
        title={
          order
            ? "Thanks for your order"
            : error
              ? "We could not load this order"
              : "Loading your order"
        }
        description={
          order
            ? "Your order has been recorded by the canteen."
            : error
              ? "The order confirmation could not be verified."
              : "We are verifying your order with the canteen."
        }
      />

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      {order ? (
        <div className="form-card confirmation-card">
          <div className="success-mark">✓</div>

          <p className="eyebrow">ORDER ID</p>
          <h2>{order.id}</h2>

          <OrderSummary order={order} />

          <div className="button-row">
            <button
              className="button primary-button"
              type="button"
              onClick={() => onNavigate("/payment")}
            >
              Payment simulation
            </button>

            <button
              className="button secondary-button"
              type="button"
              onClick={() => onNavigate("/")}
            >
              Back to menu
            </button>

            <button
              className="button outline-button"
              type="button"
              onClick={() => onNavigate("/orders")}
            >
              View my orders
            </button>

            {order.status === "Placed" && (
              <button
                className="text-button"
                type="button"
                disabled={cancelling}
                onClick={cancelOrder}
              >
                {cancelling
                  ? "Cancelling..."
                  : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      ) : (
        !error && (
          <LoadingState text="Loading your order..." />
        )
      )}
    </section>
  );
}

function OrderSummary({ order }) {
  return (
    <div className="order-summary">
      <div className="order-detail-row">
        <span>Order date</span>
        <strong>
          {new Date(order.orderTime).toLocaleString()}
        </strong>
      </div>

      {order.items.map((item) => (
        <div
          className="summary-line"
          key={item.productId}
        >
          <span>
            <strong>{item.name}</strong>
            <small>
              {item.quantity} × ₹{item.unitPrice.toFixed(2)}
            </small>
          </span>

          <strong>
            ₹{item.subtotal.toFixed(2)}
          </strong>
        </div>
      ))}

      <div className="total-row">
        <span>Total</span>
        <strong>
          ₹{order.totalAmount.toFixed(2)}
        </strong>
      </div>

      <div className="order-statuses">
        <p className="status-pill">Order: {order.status}</p>
        <p className="status-pill">
          Payment: {order.paymentStatus}
        </p>
      </div>
    </div>
  );
}

function OrdersPage({ student, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function findOrders(event) {
    event.preventDefault();

    if (!student) {
      onNavigate("/login");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const data = await apiRequest("/api/orders");
      setOrders(data.orders);

      if (!data.orders.length) {
        setFeedback("No orders found for these details.");
      }
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro
        eyebrow="ORDER HISTORY"
        title="My orders"
        description={
          student
            ? `Signed in as ${student.email}.`
            : "Sign in to view your order history."
        }
      />

      <form className="form-card" onSubmit={findOrders}>
        {!student && (
          <div className="notice error">
            You must be signed in to view orders.
          </div>
        )}

        {feedback && (
          <div className="notice" role="status">
            {feedback}
          </div>
        )}

        <button
          className="button primary-button"
          type="submit"
          disabled={loading || !student}
        >
          {loading ? "Searching..." : "Load my orders"}
        </button>
      </form>

      {orders.length > 0 && (
        <div className="order-history">
          {orders.map((order) => (
            <article
              className="form-card history-card"
              key={order.id}
            >
              <div>
                <p className="eyebrow">
                  ORDER {order.id}
                </p>

                <h2>
                  ₹{order.totalAmount.toFixed(2)}
                </h2>

                <p>
                  {new Date(
                    order.orderTime
                  ).toLocaleString()}
                </p>
              </div>

              <span className="status-pill">
                {order.status}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentPage({ order, onNavigate }) {
  const [outcome, setOutcome] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function simulatePayment(selectedOutcome) {
    if (!order?.id) {
      setMessage(
        "Open payment simulation from a confirmed order."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest(
        `/api/payments/${encodeURIComponent(order.id)}`,
        {
          method: "POST",
          body: JSON.stringify({
            outcome: selectedOutcome
          })
        }
      );

      setOutcome(data.paymentStatus);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container narrow-page">
      <PageIntro
        eyebrow="PAYMENT"
        title="Payment status"
        description="This is a clearly labelled simulation for development and testing. No real payment is processed."
      />

      <div className="form-card payment-card">
        <div className="simulation-badge">
          SIMULATION ONLY
        </div>

        {order ? (
          <>
            <p>
              Order <strong>{order.id}</strong> · ₹
              {order.totalAmount.toFixed(2)}
            </p>

            <div className="button-row">
              <button
                className="button primary-button"
                type="button"
                disabled={loading}
                onClick={() =>
                  simulatePayment("success")
                }
              >
                Simulate success
              </button>

              <button
                className="button outline-button"
                type="button"
                disabled={loading}
                onClick={() =>
                  simulatePayment("failure")
                }
              >
                Simulate failure
              </button>
            </div>
          </>
        ) : (
          <button
            className="button primary-button"
            type="button"
            onClick={() => onNavigate("/")}
          >
            Return to menu
          </button>
        )}

        {message && (
          <div
            className={`notice ${
              outcome === "Success"
                ? "success"
                : "error"
            }`}
            role="status"
          >
            {message}

            {outcome && (
              <strong> Status: {outcome}</strong>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function LoadingState({ text }) {
  return (
    <p className="loading-state" role="status">
      <span className="spinner" />
      {text}
    </p>
  );
}

function NotFoundPage({ onNavigate }) {
  return (
    <section className="container narrow-page">
      <div className="form-card empty-state">
        <h1>Page not found</h1>
        <p>That page does not exist.</p>

        <button
          className="button primary-button"
          type="button"
          onClick={() => onNavigate("/")}
        >
          Back to menu
        </button>
      </div>
    </section>
  );
}

export default App;
