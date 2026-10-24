const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AUTH_TOKEN_KEY = "campus-crave-student-token";
const STUDENT_KEY = "campus-crave-student";
const STAFF_TOKEN_KEY = "campus-crave-staff-token";
const STAFF_KEY = "campus-crave-staff";

async function request(path, options, tokenKey) {
  const token = window.sessionStorage.getItem(tokenKey);
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error(
      "Cannot connect to the server. Check your connection and try again."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.errors?.join(", ") ||
        data.message ||
        "The request could not be completed."
    );
  }

  return data;
}

export function apiRequest(path, options = {}) {
  return request(path, options, AUTH_TOKEN_KEY);
}

export function staffApiRequest(path, options = {}) {
  return request(path, options, STAFF_TOKEN_KEY);
}

export function saveStudentSession(token, student) {
  window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  window.sessionStorage.setItem(STUDENT_KEY, JSON.stringify(student));
}

export function clearStudentSession() {
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(STUDENT_KEY);
}

export function getStoredStudent() {
  try {
    const storedStudent = window.sessionStorage.getItem(STUDENT_KEY);
    return storedStudent ? JSON.parse(storedStudent) : null;
  } catch {
    clearStudentSession();
    return null;
  }
}

export function saveStaffSession(token, staff) {
  window.sessionStorage.setItem(STAFF_TOKEN_KEY, token);
  window.sessionStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

export function clearStaffSession() {
  window.sessionStorage.removeItem(STAFF_TOKEN_KEY);
  window.sessionStorage.removeItem(STAFF_KEY);
}

export function getStoredStaff() {
  try {
    const storedStaff = window.sessionStorage.getItem(STAFF_KEY);
    return storedStaff ? JSON.parse(storedStaff) : null;
  } catch {
    clearStaffSession();
    return null;
  }
}

export { API_BASE_URL };
