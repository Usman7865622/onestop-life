/**
 * Normalises a Pakistani mobile number to E.164 (+923XXXXXXXXX).
 * Accepts: 03001234567, 3001234567, 923001234567, +92 300 1234567, 0092-300-1234567.
 * Returns null for anything that is not a Pakistani mobile number (landlines included).
 */
export function normalizePkMobile(input: string): string | null {
  if (typeof input !== 'string') return null;

  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith('0092')) {
    digits = digits.slice(2); // 0092300... -> 92300...
  } else if (digits.startsWith('92')) {
    // already has the country code
  } else if (digits.startsWith('0')) {
    digits = '92' + digits.slice(1); // 0300... -> 92300...
  } else if (digits.startsWith('3')) {
    digits = '92' + digits; // 300... -> 92300...
  }

  return /^923\d{9}$/.test(digits) ? `+${digits}` : null;
}
