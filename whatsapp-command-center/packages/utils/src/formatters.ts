/**
 * Formatting utilities
 */

import { format, formatDistanceToNow, formatRelative } from 'date-fns';

/**
 * Format phone number to WhatsApp ID format
 * @param phoneNumber - Phone number with country code
 * @returns Formatted WhatsApp ID (e.g., "1234567890@c.us")
 */
export function formatWhatsAppId(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  return `${cleaned}@c.us`;
}

/**
 * Format WhatsApp ID to phone number
 * @param whatsappId - WhatsApp ID (e.g., "1234567890@c.us")
 * @returns Phone number
 */
export function formatPhoneNumber(whatsappId: string): string {
  return whatsappId.replace(/@c\.us$/, '');
}

/**
 * Format timestamp to human-readable date
 * @param timestamp - Unix timestamp or Date
 * @param formatStr - Date format string
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number | Date,
  formatStr: string = 'PPpp'
): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
  return format(date, formatStr);
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param timestamp - Unix timestamp or Date
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Format currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format percentage
 * @param value - Value to format (0-1 or 0-100)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}
