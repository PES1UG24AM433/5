# Unit Test Report

Tested on commit `bd493fb`.

## Scope and execution

This report records backend route and model tests, partly mocked, plus one real MongoDB integration test. They were first executed by an automated assistant (Codex). On 16 Nov 2026, Rohini independently re-ran the general suite and the explicit MongoDB integration command and checked the TAP totals reproduced below. The 36-row execution register in `TEST_CASES_UPDATED.md` remains **Not run** until its individual evidence is reviewed and entered by its tester.

## General suite

Command run from `backend/`:

```bash
npm test
```

Actual TAP result:

```text
tests 30
pass 29
fail 0
cancelled 0
skipped 1
todo 0
duration_ms 13893.210017
```

The skipped test was `tests/order-data-integrity.integration.test.js`; this is expected when `CPS_TEST_MONGODB_URI` is absent from the general test command.

Passing checks covered audit log field redaction and safe error details; student/staff authentication and role middleware; mocked order data integrity and safe failure logging; idempotency index/retry/race behavior; and student/staff password hashing and selection behavior.

## Explicit MongoDB integration test

Command run from `backend/`:

```bash
CPS_TEST_MONGODB_URI=mongodb://127.0.0.1:27017/canteen_preorder_test \
  node --test tests/order-data-integrity.integration.test.js
```

Actual TAP result:

```text
tests 1
pass 1
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3374.620504
```

The passing test was `persisted order data stays consistent through status update and cancellation`. Its emitted synthetic-data summary recorded expected and persisted total amount `38.2`, then the test completed its own cleanup. The command targets only the dedicated local `canteen_preorder_test` database.

## Not covered by the automated backend suite

- Student registration and login routes in `studentAuthRoutes.js`.
- Staff login route in `staffAuthRoutes.js`.
- Menu CRUD routes in `menuRoutes.js`.
- Cart validation route in `cartRoutes.js`.
- Payment route in `paymentRoutes.js`.
- Staff incoming-queue and order/sales-summary routes in `orderRoutes.js`.
- Frontend components and browser behavior.

## Review and limitations

- The automated assistant reviewed its recorded TAP output. Rohini independently checked the 16 Nov 2026 general-suite result of 29 pass, 0 fail, 1 skipped and the explicit integration-test result of 1 pass, 0 fail, 0 skipped.
- No browser, usability, accessibility, compatibility, live HTTPS, or participant evidence was executed by this report.
- These results do not automatically mark manual SRS test cases as passed. Map only reviewed evidence to the case register during formal execution.

## Functional and security API execution

Tested on commit `bd493fb` on 16 Nov 2026. Codex executed 26 real HTTP functional/security checks against a backend running on a temporary local port and the isolated `canteen_preorder_test` database. Synthetic students, staff, menu items, and orders were removed afterward; post-cleanup counts for students, staff, menu items, and orders were all zero.

The resulting per-case request/response evidence is in `docs/testing/evidence/`, and its statuses are recorded in `TEST_CASES_UPDATED.md`. Codex reviewed the HTTP results and cleanup check. These new API-case outcomes are **pending Rohini review**; do not replace that wording with “reviewed by Rohini” until Rohini has reviewed the individual evidence files.
