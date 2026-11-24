import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHash(hash: string): string {
  if (!hash) return '';
  return hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;
}

export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-ok bg-okt';
  if (confidence >= 0.6) return 'text-pri bg-pt';
  return 'text-mut bg-line';
}
