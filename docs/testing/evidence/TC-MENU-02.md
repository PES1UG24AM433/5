# TC-MENU-02 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `GET /api/menu` → **200**, 3 synthetic items.
- `GET /api/menu?search=<synthetic-name>&category=Veg` → **200**, the same 3 items.

Actual: The API ignored search/category query parameters. Browser-side filtering was not executed in this API-only run. **Status: Partial.**
