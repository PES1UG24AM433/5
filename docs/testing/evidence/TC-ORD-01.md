# TC-ORD-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/orders` with two synthetic items and quantities 2 and 1 → **201**.
- Sanitized response: `{success:true, order:{id:"<id>", items:[…], totalAmount:26.7, orderTime:"<timestamp>"}}`.

Actual: The order contained items, quantities, calculated total, authenticated student data, and order time. **Status: Pass.**
