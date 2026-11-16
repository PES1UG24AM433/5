# TC-SEC-03 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- Student `POST /api/menu` → **403**.
- Authorized synthetic staff `POST /api/menu` → **201**.

Actual: Staff-only authorization was enforced. **Status: Pass.**
