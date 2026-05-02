import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (user, accessToken, refreshToken) => {
    sessionStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
    window.location.href = '/login'
  },

  setUser: (user) => set({ user }),
  setLoading: (v) => set({ isLoading: v }),

  // Role helpers
  isCustomer: () => get().user?.role === 'customer',
  isOwner:    () => get().user?.role === 'owner',
  isAdmin:    () => get().user?.role === 'admin',
}))

export default useAuthStore
