# TC-MENU-03 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/orders` with an explicitly unavailable synthetic item → **409**.
- After a successful order of quantity 2, `GET /api/menu` still reported stock **5** from the original stock of 5.

Actual: Direct ordering of unavailable items was rejected, but ordering did not reduce stock or change availability. **Status: Partial. Defect: DEF-STOCK-001.**
