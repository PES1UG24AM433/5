# TC-STAFF-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- A directly seeded synthetic staff account logged in through `POST /api/staff/auth/login` → **200**.
- Incorrect staff credentials → **401**; `GET /api/staff/auth/me` with the valid token → **200**.

Actual: Authorized staff authentication and access control worked. Tokens are omitted. **Status: Pass.**
