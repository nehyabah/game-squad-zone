export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";
export const CHECKOUT_URL = `${API_BASE_URL}/api/checkout/sessions`;
