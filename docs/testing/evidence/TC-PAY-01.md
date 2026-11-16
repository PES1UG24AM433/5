# TC-PAY-01 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- `POST /api/payments/<owned-order>` with `{outcome:"success"}` → **200**, `paymentStatus:"Success"`.
- A separate owned order with `{outcome:"failure"}` → **200**, `paymentStatus:"Failed"`.

Actual: Simulated payment outcomes were associated with the correct synthetic orders. **Status: Pass.**
