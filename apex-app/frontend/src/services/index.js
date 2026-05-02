import api from './api'

// ── Auth — Customer (OTP) ────────────────────────────────────────────────────
export const authService = {
  sendOtp:    (phone)            => api.post('/auth/send-otp', { phone }),
  verifyOtp:  (phone, otp, name) => api.post('/auth/verify-otp', { phone, otp, name }),
  refresh:    (refresh_token)    => api.post('/auth/refresh', { refresh_token }),
  me:         ()                 => api.get('/auth/me'),
}

// ── Auth — Owner (email+password) ────────────────────────────────────────────
export const ownerAuthService = {
  register: (data) => api.post('/owner/auth/register', data),
  login:    (data) => api.post('/owner/auth/login', data),
}

// ── Auth — Admin (founder) ────────────────────────────────────────────────────
export const adminAuthService = {
  login: (data) => api.post('/admin/auth/login', data),
}

// ── Shops ─────────────────────────────────────────────────────────────────────
export const shopService = {
  list:          (params)           => api.get('/shops', { params }),
  get:           (id)               => api.get(`/shops/${id}`),
  create:        (data)             => api.post('/shops', data),
  update:        (id, data)         => api.put(`/shops/${id}`, data),
  toggle:        (id)               => api.patch(`/shops/${id}/toggle`),
  getServices:   (id)               => api.get(`/shops/${id}/services`),
  addService:    (id, data)         => api.post(`/shops/${id}/services`, data),
  updateService: (svcId, data)      => api.put(`/shops/services/${svcId}`, data),
  deleteService: (svcId)            => api.delete(`/shops/services/${svcId}`),
  getSlots:      (id, params)       => api.get(`/shops/${id}/slots`, { params }),
  setSchedule:   (id, data)         => api.post(`/shops/${id}/schedule`, data),
  blockDate:     (id, data)         => api.post(`/shops/${id}/block-dates`, data),
  getReviews:    (id)               => api.get(`/shops/${id}/reviews`),
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingService = {
  create:       (data)   => api.post('/bookings', data),
  myBookings:   ()       => api.get('/bookings/my'),
  shopBookings: (shopId, date) => api.get(`/bookings/shop/${shopId}`, { params: { target_date: date } }),
  get:          (id)     => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancel:       (id)     => api.delete(`/bookings/${id}`),
  review:       (id, data)   => api.post(`/bookings/${id}/review`, data),
}

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentService = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify:      (data) => api.post('/payments/verify', data),
  history:     ()     => api.get('/payments/history'),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsService = {
  overview: (shopId)         => api.get('/analytics/overview', { params: { shop_id: shopId } }),
  revenue:  (shopId, period) => api.get('/analytics/revenue', { params: { shop_id: shopId, period } }),
  popular:  (shopId)         => api.get('/analytics/popular', { params: { shop_id: shopId } }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminService = {
  pendingShops:  ()       => api.get('/admin/shops/pending'),
  approveShop:   (id)     => api.post(`/admin/shops/${id}/approve`),
  suspendShop:   (id, reason) => api.post(`/admin/shops/${id}/suspend`, null, { params: { reason } }),
  listUsers:     (role)   => api.get('/admin/users', { params: { role } }),
  stats:         ()       => api.get('/admin/stats'),
  revenue:       ()       => api.get('/admin/analytics/revenue'),
}
