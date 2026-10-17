import { VoterCategory } from '../types/election';

/**
 * Robust 5-character Token Generator for OSIS Election
 * Guarantees 100% Unique, Non-Colliding Tokens
 * 
 * Format: [Prefix 1 char][Group/Unit 2 chars][Unique Sequence 2 chars]
 * Examples:
 * - Kelas 7A: S7A01, S7A02, S7A03 ... S7A36
 * - Kelas 8B: S8B01, S8B02, S8B03 ... S8B36
 * - Guru: G5001, G5002, G5003 ... G5045
 * - Tata Usaha: T5001, T5002 ...
 * - Tendik: K5001, K5002 ...
 */

export function getCategoryPrefix(category?: string, classGroup?: string, customPrefix = 'S'): { pfx: string; code: string } {
  const cleanCat = (category || '').toLowerCase();
  const cleanGroup = (classGroup || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();

  if (cleanCat.includes('guru') || cleanGroup.includes('GURU')) {
    return { pfx: 'G', code: '50' };
  }
  if (cleanCat.includes('tata usaha') || cleanCat.includes('tu') || cleanGroup.includes('TU') || cleanGroup.includes('TATA')) {
    return { pfx: 'T', code: '50' };
  }
  if (cleanCat.includes('tendik') || cleanCat.includes('kependidikan') || cleanCat.includes('staf') || cleanGroup.includes('TENDIK') || cleanGroup.includes('STAF')) {
    return { pfx: 'K', code: '50' };
  }

  // Standard student prefix
  let pfx = 'S';
  if (customPrefix && customPrefix.length > 0) {
    pfx = customPrefix.replace(/[^A-Z0-9]/gi, '').charAt(0).toUpperCase() || 'S';
  }

  let code = '7A';
  if (cleanGroup.length >= 2) {
    code = cleanGroup.slice(0, 2);
  } else if (cleanGroup.length === 1) {
    code = cleanGroup + '0';
  }

  return { pfx, code };
}

/**
 * Converts a sequence number into 2-character alphanumeric code
 * 1..99 -> "01".."99"
 * 100..125 -> "A0".."AZ"
 * 126..151 -> "B0".."BZ", etc.
 */
function sequenceToTwoChars(num: number): string {
  if (num <= 99) {
    return String(num).padStart(2, '0');
  }
  const overflow = num - 100;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const firstLetter = letters[Math.floor(overflow / 10) % letters.length] || 'X';
  const digit = overflow % 10;
  return `${firstLetter}${digit}`;
}

/**
 * Generate a guaranteed unique 5-digit token against an existing set of tokens
 */
export function generateUniqueToken(
  classGroup: string,
  category: VoterCategory | string = 'Siswa',
  existingTokensSet: Set<string>,
  customPrefix = 'S',
  preferredIndex?: number
): string {
  const { pfx, code } = getCategoryPrefix(category, classGroup, customPrefix);

  // Try preferred index first if given
  let counter = preferredIndex && preferredIndex > 0 ? preferredIndex : 1;

  while (counter < 2000) {
    const seq = sequenceToTwoChars(counter);
    const candidate = `${pfx}${code}${seq}`.toUpperCase().slice(0, 5);

    if (!existingTokensSet.has(candidate)) {
      existingTokensSet.add(candidate);
      return candidate;
    }
    counter++;
  }

  // Fallback random hash if counter ever overflows 2000
  while (true) {
    const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
    const candidate = `${pfx}${code}${rand}`.toUpperCase().slice(0, 5);
    if (!existingTokensSet.has(candidate)) {
      existingTokensSet.add(candidate);
      return candidate;
    }
  }
}
