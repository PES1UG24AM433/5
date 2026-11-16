# TC-TRACK-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `GET /api/orders/<owned-order>` with the owning student's bearer token → **200**.
- Sanitized response returned the requested ID, items, total, payment status, and `status:"Placed"`.

Actual: The owner could retrieve current order information. **Status: Pass.**
