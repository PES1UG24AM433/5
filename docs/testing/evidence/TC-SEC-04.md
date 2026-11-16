# TC-SEC-04 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- Forged root order total was ignored; server returned the menu-derived total → **201**.
- Invalid item ID/quantity → **400**; unavailable item → **409**.

Actual: Server-side order data, quantity, availability, and total validation was enforced. **Status: Pass.**
