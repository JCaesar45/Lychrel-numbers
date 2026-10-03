/**
 * The Lychrel Archive — TypeScript Core
 * Strict-mode, zero-dependency, isomorphic (Node + browser).
 */

export const ITERATION_LIMIT = 500 as const;

export interface Analysis {
  readonly seed: string;
  readonly isLychrel: boolean;
  readonly iterations: number;
  readonly peakDigits: number;
  readonly palindrome: string | null;
  readonly elapsedMs: number;
  readonly preview: readonly string[];
}

export type LychrelInput = number | string;

function isPalindrome(value: string): boolean {
  let left = 0;
  let right = value.length - 1;
  while (left < right) {
    if (value.charCodeAt(left) !== value.charCodeAt(right)) return false;
    left += 1;
    right -= 1;
  }
  return true;
}

function reverseDigits(value: string): string {
  let out = "";
  for (let i = value.length - 1; i >= 0; i -= 1) {
    out += value.charAt(i);
  }
  return out;
}

function addStrings(a: string, b: string): string {
  let i = a.length - 1;
  let j = b.length - 1;
  let carry = 0;
  let out = "";
  while (i >= 0 || j >= 0 || carry > 0) {
    const da = i >= 0 ? a.charCodeAt(i) - 48 : 0;
    const db = j >= 0 ? b.charCodeAt(j) - 48 : 0;
    const total = da + db + carry;
    out = String.fromCharCode(48 + (total % 10)) + out;
    carry = Math.floor(total / 10);
    i -= 1;
    j -= 1;
  }
  return out;
}

export function analyze(
  seed: string,
  limit: number = ITERATION_LIMIT
): Analysis {
  if (!/^[0-9]+$/.test(seed) || Number(seed) <= 0) {
    throw new RangeError("seed must be a positive integer string");
  }

  const start = typeof performance !== "undefined"
    ? performance.now()
    : Date.now();

  let current = seed;
  let peak = current.length;
  const preview: string[] = [current];
  let iterations = 0;

  for (let step = 0; step < limit; step += 1) {
    iterations = step + 1;
    current = addStrings(current, reverseDigits(current));
    if (current.length > peak) peak = current.length;
    if (preview.length < 8) preview.push(current);
    if (isPalindrome(current)) {
      const end = typeof performance !== "undefined"
        ? performance.now()
        : Date.now();
      return {
        seed,
        isLychrel: false,
        iterations,
        peakDigits: peak,
        palindrome: current,
        elapsedMs: end - start,
        preview,
      };
    }
  }

  const end = typeof performance !== "undefined"
    ? performance.now()
    : Date.now();
  return {
    seed,
    isLychrel: true,
    iterations,
    peakDigits: peak,
    palindrome: null,
    elapsedMs: end - start,
    preview,
  };
}

export function isLychrel(n: LychrelInput): boolean {
  if (typeof n === "number") {
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return false;
    n = String(n);
  } else if (typeof n === "string") {
    if (!/^[0-9]+$/.test(n) || /^0+$/.test(n)) return false;
  } else {
    return false;
  }
  return analyze(n).isLychrel;
}

// Self-test when executed directly under Node.
declare const require: { main?: unknown } | undefined;
declare const module: unknown;

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (require as any).main === module
) {
  const cases: Array<[number, boolean]> = [
    [12, false], [55, false], [196, true],
    [879, true], [44987, false], [7059, true],
  ];
  for (const [value, expected] of cases) {
    const got = isLychrel(value);
    const tag = got === expected ? "ok" : "FAIL";
    // eslint-disable-next-line no-console
    console.log(`[self-test] isLychrel(${value}) = ${got}  [${tag}]`);
  }
}
