# TC-AUTH-02 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/auth/login` with synthetic valid credentials → **200**.
- Same account with an incorrect password → **401**.
- The returned JWT was used only in-memory and is not saved here.

Actual: Valid login returned an authenticated session; invalid credentials were rejected. **Status: Pass.**
