import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
}

export interface QuoteResponse {
  quoteAmountCents: number;
  gstAmountCents: number;
  breakdown?: QuoteBreakdown;
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

interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch?: () => Promise<void>;
}

interface UseMutationResult<T> {
  mutate: (data: unknown, options?: MutateOptions<T>) => void;
  mutateAsync: (data: unknown) => Promise<T>;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  data?: T;
  error?: Error;
}

interface MutateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

export function useListBookings(params?: Record<string, string>): UseQueryResult<Booking[]> {
  const [data, setData] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function load() {
      try {
        setIsLoading(true);
        const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
        const result = await fetchApi<{ data: Booking[] }>(`/api/bookings${queryString}`);
        if (mounted) {
          setData(result.data || []);
          setIsError(false);
        }
      } catch {
        if (mounted) setIsError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    
    load();
    
    return () => { mounted = false; };
  }, [JSON.stringify(params)]);

  const refetch = async () => {
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const result = await fetchApi<{ data: Booking[] }>(`/api/bookings${queryString}`);
      setData(result.data || []);
      setIsError(false);
    } catch {
      setIsError(true);
    }
  };

  return { data, isLoading, isError, refetch };
}

export function useGetQuote() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<QuoteResponse>();
  const [error, setError] = useState<Error>();

  const mutate = (requestData: Record<string, unknown>, options?: MutateOptions<QuoteResponse>) => {
    setIsPending(true);
    setIsError(false);
    setIsSuccess(false);
    
    fetchApi<QuoteResponse>('/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
      .then((result) => {
        setData(result);
        setIsSuccess(true);
        options?.onSuccess?.(result);
      })
      .catch((err) => {
        setError(err);
        setIsError(true);
        options?.onError?.(err);
      })
      .finally(() => setIsPending(false));
  };

  const mutateAsync = async (requestData: Record<string, unknown>): Promise<QuoteResponse> => {
    setIsPending(true);
    try {
      const result = await fetchApi<QuoteResponse>('/api/pricing/quote', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      setData(result);
      setIsSuccess(true);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsError(true);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, mutateAsync, isPending, isError, isSuccess, data, error };
}

export function useCreateBooking() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<{ data: Booking }>();
  const [error, setError] = useState<Error>();

  const mutate = (bookingData: Partial<Booking>, options?: MutateOptions<{ data: Booking }>) => {
    setIsPending(true);
    setIsError(false);
    setIsSuccess(false);
    
    fetchApi<{ data: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    })
      .then((result) => {
        setData(result);
        setIsSuccess(true);
        options?.onSuccess?.(result);
      })
      .catch((err) => {
        setError(err);
        setIsError(true);
        options?.onError?.(err);
      })
      .finally(() => setIsPending(false));
  };

  const mutateAsync = async (bookingData: Partial<Booking>): Promise<{ data: Booking }> => {
    setIsPending(true);
    try {
      const result = await fetchApi<{ data: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      setData(result);
      setIsSuccess(true);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsError(true);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, mutateAsync, isPending, isError, isSuccess, data, error };
}
export function useCreateCheckoutSession() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<{ url: string }>();
  const [error, setError] = useState<Error>();

  const mutate = (checkoutData: Record<string, unknown>, options?: MutateOptions<{ url: string }>) => {
    setIsPending(true);
    setIsError(false);
    setIsSuccess(false);
    
    fetchApi<{ url: string }>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    })
      .then((result) => {
        setData(result);
        setIsSuccess(true);
        options?.onSuccess?.(result);
      })
      .catch((err) => {
        setError(err);
        setIsError(true);
        options?.onError?.(err);
      })
      .finally(() => setIsPending(false));
  };

  const mutateAsync = async (checkoutData: Record<string, unknown>): Promise<{ url: string }> => {
    setIsPending(true);
    try {
      const result = await fetchApi<{ url: string }>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutData),
      });
      setData(result);
      setIsSuccess(true);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsError(true);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, mutateAsync, isPending, isError, isSuccess, data, error };
}
