import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with confidence.
 *
 * Combines `clsx` (conditional class joining) with `tailwind-merge` (conflict
 * resolution for Tailwind utility classes) so you can write:
 *
 * ```tsx
 * <div className={cn("p-4 bg-red-500", isActive && "bg-blue-500")} />
 * ```
 *
 * and have the conflicting `bg-*` utilities resolved correctly.
 *
 * @param inputs - Any number of class values accepted by `clsx`.
 * @returns A deduplicated, merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
