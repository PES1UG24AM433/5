# TC-MENU-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `GET /api/menu` → **200**.
- Sanitized item shape: `{_id:"<id>", name:"CPS Main <run>", price:12.35, foodType:"Veg", available:true, stock:5}`.

Actual: The response contained name, price, food type, availability, and stock, but no required `description` field. **Status: Fail. Defect: DEF-F003-001.**
