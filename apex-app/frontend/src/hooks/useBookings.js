import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '../services'

export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingService.myBookings().then(r => r.data),
  })
}

export function useShopBookings(shopId, date) {
  return useQuery({
    queryKey: ['shop-bookings', shopId, date],
    queryFn: () => bookingService.shopBookings(shopId, date).then(r => r.data),
    enabled: !!shopId,
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => bookingService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  })
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => bookingService.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['shop-bookings'] })
    },
  })
}
