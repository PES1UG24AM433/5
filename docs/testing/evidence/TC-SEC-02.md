# TC-SEC-02 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `GET /api/orders` with no bearer token → **401**.
- Same route with a valid synthetic student token → **200**.

Actual: Protected endpoint authentication was enforced. Tokens are omitted. **Status: Pass.**
