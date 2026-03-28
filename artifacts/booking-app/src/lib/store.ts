import { create } from "zustand";

export interface BookingState {
  serviceType?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  extras: string[];
  date?: string;
  timeSlot?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  quoteAmountCents?: number;
  gstAmountCents?: number;
  bookingId?: string;
}

interface BookingStore extends BookingState {
  step: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (data: Partial<BookingState>) => void;
  reset: () => void;
}

const initialState: BookingState = {
  extras: [],
  state: "NSW",
  bedrooms: 1,
  bathrooms: 1,
  propertyType: undefined,
};

export const TOTAL_STEPS = 8;

export const useBookingStore = create<BookingStore>((set) => ({
  ...initialState,
  step: 1,
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(TOTAL_STEPS, state.step + 1) })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  updateData: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set({ ...initialState, step: 1 }),
}));
