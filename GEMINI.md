# Andrej Karpathy Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from Andrej Karpathy's observations on AI coding pitfalls.

**Tradeoff:** These guidelines bias toward caution and precision over unconsidered speed. For trivial tasks, use pragmatic judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- **State your assumptions explicitly:** If uncertain, ask. Never guess silently.
- **Surface tradeoffs:** If multiple interpretations or approaches exist, present them with pros/cons—don't pick silently.
- **Push back when warranted:** If a simpler, more robust approach exists, say so.
- **Stop on confusion:** If requirements or code behaviors are unclear, stop immediately. Name what's confusing and ask.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- **No speculative features:** Deliver only what was requested, not what might be needed in the future.
- **No premature abstractions:** Do not create classes, interfaces, or factories for single-use code.
- **No unrequested configurability:** Avoid adding config flags, parameters, or knobs that were not asked for.
- **No over-defensive code:** Avoid elaborate error handling for impossible scenarios.
- **Code conciseness:** If 200 lines can be written cleanly in 50 lines, rewrite it to 50 lines.

> *Ask yourself:* "Would a senior engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- **Never touch adjacent code:** Do not "improve" adjacent formatting, comments, or styling.
- **Never refactor working code:** Do not refactor things that aren't broken unless explicitly instructed.
- **Match existing style:** Respect the repository's idioms, naming, and patterns even if you prefer otherwise.
- **Traceable diffs:** Every changed line must be directly traceable to the user's request.
- **Check for side-effects:** Ensure your change doesn't break dependencies or call sites.

---

## 4. Goal-Driven Execution

**Define clear, verifiable success criteria before acting. Iterate with proof.**

- **Define verification up front:** How will you prove the fix or feature works before writing code?
- **Verify with tests or commands:** Always run unit tests, type checks, or live commands to verify correctness.
- **Do not assume it works:** Check output, status codes, and error logs.
- **Iterate toward the goal:** If something fails, analyze the root cause from first principles instead of random guessing or hacking.
