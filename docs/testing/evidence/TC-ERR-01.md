# TC-ERR-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/orders` with `{items:[{productId:"not-an-id",quantity:0}]}` → **400**.
- Sanitized response contained the validation message `Please correct the order details.` and no stack trace, database detail, token, or secret.

Actual: Invalid input produced a safe validation response. **Status: Pass.**
