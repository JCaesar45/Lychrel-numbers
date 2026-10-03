# The Lychrel Archive

A luxury interactive instrument for exploring **Lychrel numbers** — the integers that refuse to fold into a palindrome under the reverse-and-add recurrence.

Open `index.html` in any modern browser. That's it. No build step. No server. No dependencies beyond a Google Fonts CDN link (which degrades gracefully if offline).

---

## What is a Lychrel number?

Take a positive integer `n`. Reverse its digits. Add the reversed value to the original. Repeat.

- `12` → `12 + 21 = 33` ✓ palindrome in 1 step
- `55` → `55 + 55 = 110` → `110 + 011 = 121` ✓ palindrome in 2 steps
- `196` → no palindrome has been found in **millions** of iterations

Numbers like `196` are called **Lychrel candidates**. No one has proven they never fold — but no one has found a palindrome either. For this task, we declare a number Lychrel if it survives **500 iterations** without producing a palindrome.

### Seed candidates below 10,000

`196`, `879`, `1997`, `7059`, `9999`

---

## The algorithm

The core function is `isLychrel(n)`. It returns `true` if `n` is a Lychrel candidate, `false` otherwise.

```js
isLychrel(12)    // false
isLychrel(55)    // false
isLychrel(196)   // true
isLychrel(879)   // true
isLychrel(44987) // false
isLychrel(7059)  // true
```

### Why strings, not numbers?

JavaScript's `Number` type is IEEE-754 double precision. Integers beyond `2^53 − 1` (`9007199254740991`) lose exact representation. The 196 sequence crosses that threshold within roughly 30 iterations. A `Number`-based implementation would silently produce incorrect sums and return wrong answers without any runtime error.

Every arithmetic operation in this project is therefore performed on **string representations**:

- **Reverse** — character-by-character walk from the end
- **Add** — manual right-to-left digit addition with explicit carry propagation
- **Palindrome check** — two-pointer comparison from both ends

The result is mathematically exact for sequences of arbitrary length.

---

## Architecture

Single file. All HTML, CSS, and JavaScript live inside `index.html`.

- **HTML** — semantic structure, no framework
- **CSS** — custom properties, CSS Grid, `clamp()` fluid typography, `mix-blend-mode: overlay` grain, `@keyframes` orbit and marquee animations
- **JavaScript** — vanilla ES5-compatible IIFE, no libraries

### Visual system

| Token | Value | Purpose |
|---|---|---|
| `--parchment` | `#e8e4db` | Base canvas |
| `--ink` | `#0f0e0c` | Contrast blocks |
| `--gold` | `#c9a86c` | Interactive accent |
| `--oxide` | `#8b3a2f` | Lychrel confirmation |

Typography: **Cormorant Garamond** (display), **Inter** (interface), **JetBrains Mono** (data).

The film grain is a procedurally generated `feTurbulence` SVG filter, animated with `steps()` timing and blended with `mix-blend-mode: overlay` — not a static PNG overlay.

---

## The interface

- **Hero** — orbital rings around the canonical case `196`
- **Marquee** — continuous scroll of the five seed candidates
- **Detector** — live analysis panel with iteration counter, peak digit count, runtime, and sequence preview
- **Collection** — five cards, one per seed, with 3D cursor-tracked tilt
- **Process** — four-step methodology breakdown

---

## Accessibility

- `prefers-reduced-motion` disables all animations and hides the grain layer
- Semantic HTML (`<nav>`, `<header>`, `<section>`, `<footer>`, `<article>`)
- `aria-hidden="true"` on purely decorative elements
- Keyboard support: `Enter` in the input triggers analysis
- Input sanitisation strips non-digits on paste

---

## Verification

The script logs a self-test to the console on load:

```
[Lychrel Archive] self-test:
  isLychrel(12)    = false (expect false)
  isLychrel(55)    = false (expect false)
  isLychrel(196)   = true  (expect true)
  isLychrel(879)   = true  (expect true)
  isLychrel(44987) = false (expect false)
  isLychrel(7059)  = true  (expect true)
```

Open DevTools to confirm.

---

## References

FreeCodeCamp. (n.d.). *Lychrel numbers*. Rosetta Code. https://rosettacode.org/wiki/Lychrel_numbers

MDN Web Docs. (2025). *Number.MAX_SAFE_INTEGER*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER

Wikipedia. (2025). *Lychrel number*. https://en.wikipedia.org/wiki/Lychrel_number

---

*The Lychrel Archive — where mathematics meets material.*
