import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://10.0.2.2:5000"; // Android emulator default

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = await AsyncStorage.getItem("authToken");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// --------------------
// PUBLIC (no auth)
// --------------------
export const publicApi = {
  listRestaurants: ({ page = 1, limit = 20, q = "" } = {}) => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (q) qs.set("q", q);
    return request(`/public/restaurants?${qs.toString()}`);
  },

  getRestaurantMenu: (businessId) => {
    return request(`/public/restaurants/${businessId}/menu`);
  },
};

// --------------------
// CUSTOMER AUTH
// --------------------
export const customerAuthApi = {
  register: (payload) =>
    request(`/customer/auth/register`, { method: "POST", body: payload }),

  login: (payload) =>
    request(`/customer/auth/login`, { method: "POST", body: payload }),
};

// --------------------
// ORDERS (auth required)
// --------------------
export const ordersApi = {
  createOrder: (payload) =>
    request(`/orders`, { method: "POST", body: payload, auth: true }),

  myOrders: () => request(`/orders/my`, { auth: true }),
};