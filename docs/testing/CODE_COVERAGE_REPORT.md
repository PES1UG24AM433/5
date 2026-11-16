# Code Coverage Report

Tested on commit `bd493fb`.

## Command and scope

The automated assistant ran and reviewed this native Node coverage command from `backend/`:

```bash
CPS_TEST_MONGODB_URI=mongodb://127.0.0.1:27017/canteen_preorder_test \
  node --test --test-concurrency=1 --experimental-test-coverage
```

This is backend route/model-test coverage, partly mocked, plus the real MongoDB order-integrity integration test. No frontend coverage tool was configured or run, so this report makes no frontend coverage claim. The URI-enabled run completed with 30 passes, 0 failures, and 0 skips.

## Actual line and function coverage

The values below are transcribed from the native Node coverage output; no target or threshold has been inferred.

| Application file | Line coverage | Function coverage | Native uncovered-line output |
|---|---:|---:|---|
| `middleware/authMiddleware.js` | 100.00% | 100.00% | — |
| `middleware/studentAuthMiddleware.js` | 89.36% | 100.00% | 26-30 |
| `models/MenuItem.js` | 100.00% | 100.00% | — |
| `models/Order.js` | 100.00% | 100.00% | — |
| `models/Staff.js` | 100.00% | 100.00% | — |
| `models/Student.js` | 100.00% | 100.00% | — |
| `routes/orderRoutes.js` | 61.41% | 64.29% | 46-123, 133-162, 180-184, 187-192, 198-202, 208-212, 217-221, 257-289, 294-298, 332-337, 351-352, 373-378, 387-391, 424-428, 440-444, 447-451, 454-458, 465-470, 476-480, 483-487, 504-508, 581-585, 595-599, 602-606 |
| `utils/auditLogger.js` | 100.00% | 100.00% | — |
| **All files reported by Node, including test files** | **88.00%** | **93.62%** | See per-file output above |

## Production-code-only aggregate

To avoid overstating the result with test-source coverage, the same URI-enabled command was also run with Node's built-in `--test-coverage-exclude=tests/**` option. This is a measured aggregate, not a calculation from the table above.

| Scope | Line coverage | Function coverage |
|---|---:|---:|
| Backend production files only | 74.75% | 78.26% |

## Review and interpretation

- The automated assistant reviewed both native coverage outputs. Rohini independently verified the related general and integration test commands on 16 Nov 2026; this report does not state that Rohini independently ran the coverage command.
- The lowest application line coverage is `routes/orderRoutes.js` at 61.41%. The uncovered line ranges are preserved above exactly as reported by Node.
- The 88.00% mixed aggregate includes files under `tests/`. The 74.75% production-code-only figure is the appropriate backend application aggregate for interpretation.
- No coverage goal is asserted because neither this command nor the Test Plan output supplied one.
