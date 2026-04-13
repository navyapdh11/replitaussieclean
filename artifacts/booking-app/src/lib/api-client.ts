import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';

// ─── Shared Types (used by components and API hooks) ─────────────────────────

export interface Booking {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  serviceType: string;
  propertyType: string;
  date: string;
  timeSlot: string;
  addressLine1: string;
  addressLine2?: string;
  suburb: string;
  state: string;
  postcode: string;
  status: string;
  quoteAmountCents: number;
  gstAmountCents: number;
  extras?: string;
  frequency?: string;
  tipAmountCents?: number;
  notes?: string;
  createdAt: string;
  tenantId?: string;
}

export interface QuoteResponse {
  quoteAmountCents: number;
  gstAmountCents: number;
  totalAmountCents: number;
  dynamicMultiplier: number;
  breakdown: QuoteBreakdown;
  factorsApplied: Record<string, number>;
  validUntil: string;
  currency: string;
}

export interface QuoteBreakdown {
  base: number;
  extras: number;
  demand: number;
  weather: number;
  traffic: number;
  staffAvailability: number;
  timeSlot: number;
}

export type ServiceType =
  | 'standard_clean'
  | 'deep_clean'
  | 'end_of_lease'
  | 'carpet_clean'
  | 'window_clean'
  | 'eco_clean'
  | 'office_clean'
  | 'strata_clean'
  | 'retail_clean'
  | 'hospitality_clean'
  | 'medical_clean'
  | 'aged_care_clean'
  | 'school_clean'
  | 'industrial_clean'
  | 'post_construction_clean'
  | 'pressure_wash'
  | 'biohazard_clean'
  | 'solar_duct_clean';

export type PropertyType =
  | 'house'
  | 'apartment'
  | 'townhouse'
  | 'unit'
  | 'flat'
  | 'studio'
  | 'office'
  | 'commercial'
  | 'warehouse';

export type BookingStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {};
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!response.ok) {
    let message = `API Error: ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorBody = await response.json();
        message = errorBody.error || errorBody.message || message;
      }
    } catch {
      // Non-JSON error response — use status text
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export function useListBookings(params?: Record<string, string>): UseQueryResult<Booking[], Error> {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const result = await fetchApi<{ data: Booking[] }>(`/api/bookings${queryString}`);
      return result.data || [];
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: true,
  });
}

export function useGetQuote() {
  return useMutation<QuoteResponse, Error, Record<string, unknown>>({
    mutationFn: (requestData) =>
      fetchApi<QuoteResponse>('/api/pricing/quote', {
        method: 'POST',
        body: JSON.stringify(requestData),
      }),
  });
}

export function useCreateBooking() {
  return useMutation<{ data: Booking }, Error, Partial<Booking>>({
    mutationFn: (bookingData) =>
      fetchApi<{ data: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      }),
  });
}

export function useCreateCheckoutSession() {
  return useMutation<{ url: string }, Error, Record<string, unknown>>({
    mutationFn: (checkoutData) =>
      fetchApi<{ url: string }>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutData),
      }),
  });
}
