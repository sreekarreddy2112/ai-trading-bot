# CLAUDE.md
Project: MarketMind India, AI analysis app for Indian stocks (educational, not advice).
Structure: /frontend (Next.js, TypeScript, Tailwind, shadcn/ui, Recharts), /backend (FastAPI, pandas, Pydantic), /docs/SOW.md

Rules:
- Read /docs/SOW.md before any task. Build one phase at a time and stop for my review.
- Write simple, readable code. Avoid clever one-liners and heavy list comprehensions. Add short comments.
- All API keys only in backend .env. Never expose keys to the browser. Never commit .env.
- Every endpoint needs input validation (Pydantic) and error handling with clear messages.
- Indicator math must have unit tests (pytest).
- Every page needs loading, empty and error states, and must work on mobile.
- Claude API output must be validated JSON. Never let the model invent prices.
- Show the not-investment-advice disclaimer on all analysis views.
- After each phase: run tests, tell me how to run the app, and list what to check.

