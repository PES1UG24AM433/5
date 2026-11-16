# TC-SEC-05 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- Real order create, staff status update, and cancellation requests produced JSON audit events in the temporary backend log.
- Sanitized observed fields were timestamp, event, order ID, actor type, and status transition; no password, token, authorization header, or request body was logged.

Actual: This local run verified safe event content. Deployment retention and access control remain outside this test. **Status: Pass.**
