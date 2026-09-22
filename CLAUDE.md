# Working rules for AnihanOS

Standing instructions for any Claude Code session working in this repo. These were established across prior sessions building this project — follow them without needing to be re-told.

## Database / Supabase

- **Never execute writes or DDL directly against Supabase** (INSERT/UPDATE/DELETE/ALTER/CREATE/etc). Always hand over raw SQL for the user to run themselves in the Supabase SQL Editor.
- Read-only queries (SELECT, `information_schema`, `pg_policies` checks) are fine to run directly — via the service-role key if needed — for diagnostics/verification, without asking first.
- **Never create migration files.** Present schema SQL directly in the chat message only.
- When proposing a schema change, present the **entire** proposal's SQL complete in **one message** — never split a schema proposal across multiple turns.
- Even with service-role access, never execute destructive operations (deletes, account wipes, etc.) yourself. Investigate read-only, then hand over the exact SQL to run. For things like deleting Supabase Auth users, point to the Dashboard rather than raw SQL.

## Code workflow

- **Always run `npm run build`** (client and/or server — whichever was touched) after making code changes, and confirm it passes **before** telling the user it's ready.
- Default to backend-only changes unless frontend work is specifically requested.
- **Wait for explicit go-ahead before editing files** — even after presenting a plan, don't start implementing until told to proceed.
- **Never commit or push to git unless explicitly asked.** The user self-commits.
- Delete dead/unused code once it's fully unreferenced after a change, rather than leaving orphaned files around.
- When asked to **hide** a feature (as opposed to delete/remove it), take it out of the UI but keep the underlying supporting code/API intact — "hide" implies it may come back later.

## Modeling / accuracy

(Especially relevant to the sugarcane weather/fertilizer forecast engine, but applies generally.)

- **Never fabricate false precision.** Don't invent numbers (e.g. an alternate harvest date) that the source data or formulas don't actually support.
- Every assumption baked into a calculation must be **clearly labeled in the UI itself** (not just a code comment) — e.g. "assumes no disease pressure," "no soil test on file — assumes medium fertility."
- If a reference document the user provides is internally inconsistent, **flag it rather than silently resolving it**, and ask before propagating a fix at scale (e.g. before correcting a buggy default across every farm's data).

## Communication style

- For schema-affecting or destructive decisions where different interpretations would produce materially different results, **ask a clarifying question first** rather than guessing.
- For "is this possible?" / exploratory questions, answer with a grounded recommendation and the main tradeoff — don't just start building.
- Keep forecast/explanatory UI copy terse — cut filler words and sentences, state only the important information.
