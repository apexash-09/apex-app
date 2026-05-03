import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

import CustomerLayout  from './layouts/CustomerLayout'
import OwnerLayout     from './layouts/OwnerLayout'
import AdminLayout     from './layouts/AdminLayout'

import Home            from './pages/customer/Home'
import ShopProfile     from './pages/customer/ShopProfile'
import BookingFlow     from './pages/customer/BookingFlow'
import CustomerDashboard from './pages/customer/Dashboard'
import OrderTracking   from './pages/customer/OrderTracking'
import PaymentPage     from './pages/customer/PaymentPage'

import CustomerLogin   from './pages/auth/CustomerLogin'
import OwnerLogin      from './pages/auth/OwnerLogin'
import OwnerRegister   from './pages/auth/OwnerRegister'
import AdminLogin      from './pages/auth/AdminLogin'

import OwnerDashboard  from './pages/owner/Dashboard'
import OwnerBookings   from './pages/owner/Bookings'
import OwnerServices   from './pages/owner/Services'
import OwnerSchedule   from './pages/owner/Schedule'
import OwnerAnalytics  from './pages/owner/Analytics'
import OwnerProfile    from './pages/owner/Profile'

import AdminDashboard  from './pages/admin/Dashboard'
import AdminShops      from './pages/admin/Shops'
import AdminUsers      from './pages/admin/Users'
import AdminAnalytics  from './pages/admin/Analytics'

import Privacy         from './pages/legal/Privacy'
import Terms           from './pages/legal/Terms'
import NotFound        from './pages/NotFound'

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
        {/* Auth */}
        <Route path="/login"          element={<CustomerLogin />} />
        <Route path="/owner/login"    element={<OwnerLogin />} />
        <Route path="/owner/register" element={<OwnerRegister />} />
        <Route path="/admin/login"    element={<AdminLogin />} />

        {/* Legal */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms"   element={<Terms />} />

        {/* Customer */}
        <Route element={<CustomerLayout />}>
          <Route path="/"                  element={<Home />} />
          <Route path="/shop/:shopId"       element={<ShopProfile />} />
          <Route path="/track/:orderId"     element={<OrderTracking />} />
          <Route path="/book/:shopId"       element={<RequireAuth><BookingFlow /></RequireAuth>} />
          <Route path="/pay/:bookingId"     element={<RequireAuth><PaymentPage /></RequireAuth>} />
          <Route path="/dashboard"          element={<RequireAuth><CustomerDashboard /></RequireAuth>} />
        </Route>

        {/* Owner */}
        <Route path="/owner" element={<RequireAuth role="owner"><OwnerLayout /></RequireAuth>}>
          <Route index             element={<OwnerDashboard />} />
          <Route path="bookings"   element={<OwnerBookings />} />
          <Route path="services"   element={<OwnerServices />} />
          <Route path="schedule"   element={<OwnerSchedule />} />
          <Route path="analytics"  element={<OwnerAnalytics />} />
          <Route path="profile"    element={<OwnerProfile />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
          <Route index             element={<AdminDashboard />} />
          <Route path="shops"      element={<AdminShops />} />
          <Route path="users"      element={<AdminUsers />} />
          <Route path="analytics"  element={<AdminAnalytics />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
