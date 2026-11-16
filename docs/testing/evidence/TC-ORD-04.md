# TC-ORD-04 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/orders` included an untrusted root `totalAmount:0.01` and one synthetic menu item priced at 13.
- Response → **201** with `totalAmount:13`.

Actual: The server ignored the client total and calculated the total from stored menu data. **Status: Pass.**
