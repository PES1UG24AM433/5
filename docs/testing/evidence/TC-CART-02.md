# TC-CART-02 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/cart/validate` valid cart → **200**; empty cart → **400**; quantity above stock → **409**; unavailable item → **409**.
- `POST /api/orders` with quantity 2 from a synthetic item stocked at 5 → **201**.
- Follow-up `GET /api/menu` reported stock **5**, not 3.

Actual: Availability and quantity validation worked, but stock was not decremented after ordering. **Status: Partial. Defect: DEF-STOCK-001.**
