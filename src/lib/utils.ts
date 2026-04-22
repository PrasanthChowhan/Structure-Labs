import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SEGMENT_COLORS: Record<string, { bg: string, border: string, text: string, indicator: string }> = {
  "Hook": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", indicator: "bg-red-400" },
  "Context": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", indicator: "bg-blue-400" },
  "Value": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", indicator: "bg-emerald-400" },
  "Proof": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", indicator: "bg-purple-400" },
  "Story": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", indicator: "bg-indigo-400" },
  "CTA": { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", indicator: "bg-orange-400" },
  "Other": { bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-700", indicator: "bg-stone-400" },
};

export const getSegmentStyle = (type: string) => SEGMENT_COLORS[type] || SEGMENT_COLORS["Other"];
