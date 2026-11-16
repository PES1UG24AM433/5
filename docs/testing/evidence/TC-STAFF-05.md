# TC-STAFF-05 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- Staff `GET /api/orders/summary?startDate=2026-11-01&endDate=2026-11-30` → **200**.
- Reversed date range → **400**.

Actual: Authorized period summary succeeded and invalid date range was rejected. **Status: Pass.**
