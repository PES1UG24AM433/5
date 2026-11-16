# TC-STAFF-04 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- Staff `PATCH /api/orders/<placed-order>/status` with `{status:"Accepted"}` → **400**.
- Same route with `{status:"Completed"}` → **200**.

Actual: The SRS workflow Accepted → Preparing → Ready → Completed is unsupported; the code permits direct Placed → Completed/Cancelled. **Status: Fail. Defect: DEF-F016-001.**
