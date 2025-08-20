import { type ClassValue } from 'clsx';
export declare function cn(...inputs: ClassValue[]): string;
export declare function formatDate(date: Date | string): string;
export declare function formatRelativeTime(date: Date | string): string;
export declare const formatTimeAgo: typeof formatRelativeTime;
/**
 * 숫자를 축약된 형태로 변환 (1K, 1.2M 등)
 */
export declare function formatNumber(num: number): string;
export declare function truncateText(text: string, maxLength: number): string;
