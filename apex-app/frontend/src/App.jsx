import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Layouts
import CustomerLayout from './layouts/CustomerLayout'
import OwnerLayout from './layouts/OwnerLayout'
import AdminLayout from './layouts/AdminLayout'

// Customer pages
import Home from './pages/customer/Home'
import ShopProfile from './pages/customer/ShopProfile'
import BookingFlow from './pages/customer/BookingFlow'
import CustomerDashboard from './pages/customer/Dashboard'
import OrderTracking from './pages/customer/OrderTracking'

// Auth pages
import CustomerLogin from './pages/auth/CustomerLogin'
import OwnerLogin from './pages/auth/OwnerLogin'
import OwnerRegister from './pages/auth/OwnerRegister'
import AdminLogin from './pages/auth/AdminLogin'

// Owner pages
import OwnerDashboard from './pages/owner/Dashboard'
import OwnerBookings from './pages/owner/Bookings'
import OwnerServices from './pages/owner/Services'
import OwnerSchedule from './pages/owner/Schedule'
import OwnerAnalytics from './pages/owner/Analytics'
import OwnerProfile from './pages/owner/Profile'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminShops from './pages/admin/Shops'
import AdminUsers from './pages/admin/Users'
import AdminAnalytics from './pages/admin/Analytics'


// ── Route guards ───────────────────────────────────────────────────────────────
function RequireAuth({ children, role }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public auth routes ─────────────────────────────────────── */}
        <Route path="/login"          element={<CustomerLogin />} />
        <Route path="/owner/login"    element={<OwnerLogin />} />
        <Route path="/owner/register" element={<OwnerRegister />} />
        <Route path="/admin/login"    element={<AdminLogin />} />

        {/* ── Customer routes ────────────────────────────────────────── */}
        <Route element={<CustomerLayout />}>
          <Route path="/"                   element={<Home />} />
          <Route path="/shop/:shopId"        element={<ShopProfile />} />
          <Route path="/book/:shopId"        element={
            <RequireAuth><BookingFlow /></RequireAuth>
          } />
          <Route path="/track/:orderId"      element={<OrderTracking />} />
          <Route path="/dashboard"           element={
            <RequireAuth><CustomerDashboard /></RequireAuth>
          } />
        </Route>

        {/* ── Owner routes ───────────────────────────────────────────── */}
        <Route path="/owner" element={
          <RequireAuth role="owner"><OwnerLayout /></RequireAuth>
        }>
          <Route index              element={<OwnerDashboard />} />
          <Route path="bookings"    element={<OwnerBookings />} />
          <Route path="services"    element={<OwnerServices />} />
          <Route path="schedule"    element={<OwnerSchedule />} />
          <Route path="analytics"   element={<OwnerAnalytics />} />
          <Route path="profile"     element={<OwnerProfile />} />
        </Route>

        {/* ── Admin routes ───────────────────────────────────────────── */}
        <Route path="/admin" element={
          <RequireAuth role="admin"><AdminLayout /></RequireAuth>
        }>
          <Route index              element={<AdminDashboard />} />
          <Route path="shops"       element={<AdminShops />} />
          <Route path="users"       element={<AdminUsers />} />
          <Route path="analytics"   element={<AdminAnalytics />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
