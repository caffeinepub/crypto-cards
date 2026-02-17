/**
 * BigInt-safe utilities for parsing and formatting ETH balances
 * Avoids Number/parseInt overflow for very large balances
 */

/**
 * Parse hex wei value to ETH string with fixed decimals
 * Uses BigInt to avoid precision/overflow issues
 */
export function parseWeiToEth(weiHex: string, decimals: number = 4): string {
  try {
    // Remove 0x prefix if present
    const cleanHex = weiHex.startsWith('0x') ? weiHex.slice(2) : weiHex;
    
    // Parse as BigInt to avoid overflow
    const weiBigInt = BigInt('0x' + cleanHex);
    
    // Convert to ETH (divide by 10^18)
    const ethWei = 1000000000000000000n; // 10^18 as BigInt
    const ethWhole = weiBigInt / ethWei;
    const ethRemainder = weiBigInt % ethWei;
    
    // Format with fixed decimals
    const remainderStr = ethRemainder.toString().padStart(18, '0');
    const decimalPart = remainderStr.slice(0, decimals);
    
    return `${ethWhole}.${decimalPart}`;
  } catch (err) {
    console.error('[ethFormat] Failed to parse wei to ETH:', err);
    return '0.0000';
  }
}

/**
 * Format ETH balance string to fixed decimals
 */
export function formatEthBalance(balance: string, decimals: number = 4): string {
  try {
    const num = parseFloat(balance);
    if (isNaN(num) || !isFinite(num)) {
      return '0.0000';
    }
    return num.toFixed(decimals);
  } catch (err) {
    console.error('[ethFormat] Failed to format balance:', err);
    return '0.0000';
  }
}
