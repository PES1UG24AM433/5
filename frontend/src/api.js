const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "campus-crave-student-token";
const STUDENT_KEY = "campus-crave-student";

export async function apiRequest(path, options = {}) {
  const token = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.errors?.join(", ") || data.message || "The request could not be completed."
    );
  }

  return data;
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

export { API_BASE_URL };
