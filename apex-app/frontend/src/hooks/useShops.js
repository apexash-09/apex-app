import { useQuery } from '@tanstack/react-query'
import { shopService } from '../services'

export function useShopList(params) {
  return useQuery({
    queryKey: ['shops', params],
    queryFn: () => shopService.list(params).then(r => r.data),
    staleTime: 60_000,
  })
}

export function useShop(shopId) {
  return useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => shopService.get(shopId).then(r => r.data),
    enabled: !!shopId,
  })
}

export function useShopServices(shopId) {
  return useQuery({
    queryKey: ['shop-services', shopId],
    queryFn: () => shopService.getServices(shopId).then(r => r.data),
    enabled: !!shopId,
  })
}

export function useAvailableSlots(shopId, serviceId, date) {
  return useQuery({
    queryKey: ['slots', shopId, serviceId, date],
    queryFn: () => shopService.getSlots(shopId, { service_id: serviceId, slot_date: date }).then(r => r.data),
    enabled: !!shopId && !!serviceId && !!date,
  })
}
