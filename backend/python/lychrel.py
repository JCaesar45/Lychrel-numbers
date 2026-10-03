"""
The Lychrel Archive — Python Core
Pure-stdlib implementation with a CLI harness.
"""
from __future__ import annotations

import sys
import time
from dataclasses import dataclass, field
from typing import List, Optional

ITERATION_LIMIT = 500


@dataclass
class Analysis:
    seed: str
    is_lychrel: bool
    iterations: int
    peak_digits: int
    palindrome: Optional[str] = None
    elapsed_ms: float = 0.0
    preview: List[str] = field(default_factory=list)


def is_palindrome(value: str) -> bool:
    left, right = 0, len(value) - 1
    while left < right:
        if value[left] != value[right]:
            return False
        left += 1
        right -= 1
    return True


def reverse_digits(value: str) -> str:
    return value[::-1]


def add_strings(a: str, b: str) -> str:
    """Right-to-left addition with explicit carry propagation."""
    i, j, carry = len(a) - 1, len(b) - 1, 0
    out: List[str] = []
    while i >= 0 or j >= 0 or carry:
        da = ord(a[i]) - 48 if i >= 0 else 0
        db = ord(b[j]) - 48 if j >= 0 else 0
        total = da + db + carry
        out.append(chr(48 + (total % 10)))
        carry = total // 10
        i -= 1
        j -= 1
    out.reverse()
    return "".join(out)


def analyze(seed: str, limit: int = ITERATION_LIMIT) -> Analysis:
    if not seed.isdigit() or int(seed) <= 0:
        raise ValueError("seed must be a positive integer string")

    start = time.perf_counter()
    current = seed
    peak = len(current)
    preview = [current]
    iterations = 0

    for step in range(limit):
        iterations = step + 1
        current = add_strings(current, reverse_digits(current))
        peak = max(peak, len(current))
        if len(preview) < 8:
            preview.append(current)
        if is_palindrome(current):
            elapsed = (time.perf_counter() - start) * 1000.0
            return Analysis(
                seed=seed,
                is_lychrel=False,
                iterations=iterations,
                peak_digits=peak,
                palindrome=current,
                elapsed_ms=elapsed,
                preview=preview,
            )

    elapsed = (time.perf_counter() - start) * 1000.0
    return Analysis(
        seed=seed,
        is_lychrel=True,
        iterations=iterations,
        peak_digits=peak,
        palindrome=None,
        elapsed_ms=elapsed,
        preview=preview,
    )


def is_lychrel(n) -> bool:
    """Public contract — mirrors the freeCodeCamp signature."""
    if isinstance(n, bool):
        return False
    if isinstance(n, int):
        if n <= 0:
            return False
        n = str(n)
    elif isinstance(n, str):
        if not n.isdigit():
            return False
    else:
        return False
    return analyze(n).is_lychrel


def _cli(argv: List[str]) -> int:
    if len(argv) < 2:
        print("usage: python lychrel.py <integer> [<integer> ...]")
        return 2
    for arg in argv[1:]:
        try:
            result = analyze(arg)
        except ValueError as exc:
            print(f"{arg}: invalid — {exc}")
            continue
        verdict = "LYCHREL" if result.is_lychrel else "not lychrel"
        print(
            f"{arg:>12}  {verdict:<12}  "
            f"iter={result.iterations:<3}  "
            f"peak_digits={result.peak_digits:<3}  "
            f"time={result.elapsed_ms:6.1f}ms"
        )
    return 0


if __name__ == "__main__":
    # Self-test on canonical cases before running the CLI.
    cases = {
        12: False, 55: False, 196: True,
        879: True, 44987: False, 7059: True,
    }
    for value, expected in cases.items():
        got = is_lychrel(value)
        status = "ok" if got == expected else "FAIL"
        print(f"[self-test] is_lychrel({value}) = {got}  [{status}]")
    print()
    sys.exit(_cli(sys.argv))
