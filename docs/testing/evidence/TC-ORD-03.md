# TC-ORD-03 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `PATCH /api/orders/<placed-order>/cancel` → **200**, `status:"Cancelled"`.
- After staff completion, `PATCH /api/orders/<completed-order>/cancel` → **409**.

Actual: A Placed order was cancellable and a Completed order was rejected. **Status: Pass.**
