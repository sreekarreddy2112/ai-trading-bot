import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatLargeNumber(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return "N/A";
  if (val >= 1e12) return `₹${(val / 1e12).toFixed(2)} Lakh Cr`;
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} Lakh`;
  return val.toLocaleString("en-IN");
}

export function formatPercent(val?: number | null, includePlus: boolean = false): string {
  if (val === undefined || val === null || isNaN(val)) return "0.00%";
  const prefix = includePlus && val > 0 ? "+" : "";
  return `${prefix}${val.toFixed(2)}%`;
}
