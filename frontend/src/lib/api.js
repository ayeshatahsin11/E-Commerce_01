export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = "GET", body, query, signal } = {}) {
  let url = `${API_URL}/api${path}`;

  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.append(key, value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: "include", // sends the login cookie
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Cannot reach the server. Please check your connection.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON response
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

// api.get("/products", { search: "tomato" })   api.post("/cart/items", { productId, quantity })
export const api = {
  get: (path, query, options) => request(path, { query, ...options }),
  post: (path, body, options) => request(path, { method: "POST", body, ...options }),
  put: (path, body, options) => request(path, { method: "PUT", body, ...options }),
  patch: (path, body, options) => request(path, { method: "PATCH", body, ...options }),
  delete: (path, options) => request(path, { method: "DELETE", ...options }),
};

// Works for both full URLs (Cloudinary) and paths like /uploads/abc.jpg
export const imageUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};