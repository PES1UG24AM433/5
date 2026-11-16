# TC-SEC-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- A synthetic student was registered through `POST /api/auth/register` → **201**.
- Isolated test-database inspection found a bcrypt-formatted stored password; plaintext was not recorded.

Actual: Password storage used a one-way bcrypt hash. **Status: Pass.**
