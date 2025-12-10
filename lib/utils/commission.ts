/**
 * Utility functions for commission calculations and PayHere payment formatting
 */

/**
 * Calculate commission amount from a given amount
 * @param amount - The base amount to calculate commission from
 * @param rate - The commission rate (default: 0.1 for 10%)
 * @returns The calculated commission amount
 */
export function calculateCommission(amount: number, rate: number = 0.05): number {
    if (amount < 0) {
        throw new Error('Amount cannot be negative');
    }
    if (rate < 0 || rate > 1) {
        throw new Error('Rate must be between 0 and 1');
    }
    return amount * rate;
}

/**
 * Format amount for PayHere (requires 2 decimal places as string)
 * @param amount - The amount to format
 * @returns Formatted amount string with 2 decimal places
 */
export function formatPayHereAmount(amount: number): string {
    if (amount < 0) {
        throw new Error('Amount cannot be negative');
    }
    return amount.toFixed(2);
}

/**
 * Generate a unique order ID for commission payments
 * @param bidId - The bid ID
 * @returns Unique order ID in format: commission-{bidId}-{timestamp}
 */
export function generateCommissionOrderId(bidId: string): string {
    const timestamp = Date.now();
    return `commission-${bidId}-${timestamp}`;
}

/**
 * Parse commission order ID to extract bid ID
 * @param orderId - The order ID to parse
 * @returns Object containing bidId and timestamp, or null if invalid format
 */
export function parseCommissionOrderId(orderId: string): { bidId: string; timestamp: number } | null {
    const match = orderId.match(/^commission-([a-f0-9]+)-(\d+)$/);
    if (!match) {
        return null;
    }
    return {
        bidId: match[1],
        timestamp: parseInt(match[2], 10),
    };
}
