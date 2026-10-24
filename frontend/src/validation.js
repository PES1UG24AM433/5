const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidObjectId(value) {
  return OBJECT_ID_PATTERN.test(value);
}

export function validateRegistration(form) {
  const errors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const studentId = form.studentId.trim();

  if (!name) errors.name = "Full name is required.";
  if (!email) errors.email = "Email address is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!studentId) errors.studentId = "Student ID is required.";
  if (!form.password) errors.password = "Password is required.";
  else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  return errors;
}

export function validateLogin(form) {
  const errors = {};
  const email = form.email.trim();

  if (!email) errors.email = "Email address is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!form.password) errors.password = "Password is required.";

  return errors;
}

export function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Your cart is empty. Add items before checkout.";
  }

  for (const item of items) {
    if (!item || !isValidObjectId(item._id)) {
      return "A cart item is invalid. Please refresh the menu and try again.";
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return "Each cart quantity must be a positive whole number.";
    }
    if (!Number.isInteger(item.stock) || item.quantity > item.stock) {
      return `${item.name || "This item"} does not have enough stock. Please adjust your quantity.`;
    }
  }

  return "";
}
