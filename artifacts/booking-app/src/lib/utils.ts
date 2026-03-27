import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number | undefined | null) {
  if (cents === undefined || cents === null) return "$0.00";
  return (cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}
