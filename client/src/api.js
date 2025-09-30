// src/api.js
const BASE_URL = import.meta.env.VITE_API_URL

// Send verification code
export async function sendVerificationCode(email) {
  const res = await fetch(`${BASE_URL}/sendVerificationCode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

// Verify code
export async function verifyCode(email, code) {
  const res = await fetch(`${BASE_URL}/verifyCode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return res.json();
}

// Send complete contact form
export async function sendContactEmail(data) {
  const res = await fetch(`${BASE_URL}/sendContactEmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Send partial form data
export async function sendPartialFormData(data) {
  const res = await fetch(`${BASE_URL}/sendPartialFormData`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}