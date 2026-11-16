# TC-TRACK-02 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- Owner `GET /api/orders` → **200** and included the created synthetic order.
- Another synthetic student `GET /api/orders/<owner-order>` → **404**.

Actual: History was available to the owner and cross-student order access was denied. **Status: Pass.**
