import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getActiveVariant(variant: Record<string, any>): string | undefined {
    return Object.keys(variant).find(key => variant[key] !== undefined)
}
