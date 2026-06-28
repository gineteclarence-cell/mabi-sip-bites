import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely, resolving conflicts (e.g. px-2 vs px-4)
 * the way `tailwind-merge` intends, while allowing conditional classes via clsx.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
