# TC-AUTH-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/auth/register` with synthetic valid details → **201**.
- Invalid synthetic details → **400**; duplicate synthetic details → **409**.
- Password values and any credentials are omitted from this evidence.

Actual: Valid registration succeeded and invalid/duplicate registrations were rejected. **Status: Pass.**
