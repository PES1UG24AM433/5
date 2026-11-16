# Branch Coverage Report

Tested on commit `bd493fb`.

## Command and scope

The automated assistant ran and reviewed the native Node branch-coverage output from:

```bash
cd backend
CPS_TEST_MONGODB_URI=mongodb://127.0.0.1:27017/canteen_preorder_test \
  node --test --test-concurrency=1 --experimental-test-coverage
```

This is backend route/model-test branch coverage, partly mocked, plus the real MongoDB order-integrity integration test. The command did not run frontend coverage. The URI-enabled run completed with 30 passes, 0 failures, and 0 skips.

## Actual branch coverage

| Application file | Branch coverage |
|---|---:|
| `middleware/authMiddleware.js` | 100.00% |
| `middleware/studentAuthMiddleware.js` | 88.89% |
| `models/MenuItem.js` | 100.00% |
| `models/Order.js` | 100.00% |
| `models/Staff.js` | 50.00% |
| `models/Student.js` | 75.00% |
| `routes/orderRoutes.js` | 56.00% |
| `utils/auditLogger.js` | 100.00% |
| **All files reported by Node, including test files** | **86.94%** |

## Production-code-only aggregate

The URI-enabled command was also run with Node's built-in `--test-coverage-exclude=tests/**` option. This separate measured run excluded test-source files from the aggregate.

| Scope | Branch coverage |
|---|---:|
| Backend production files only | 72.34% |

## Review and follow-up

- The automated assistant reviewed the recorded native coverage outputs. Rohini independently verified the related general and integration test commands on 16 Nov 2026; this report does not state that Rohini independently ran the coverage command.
- The native reporter supplied percentages and uncovered **line** ranges, but did not identify individual uncovered branch expressions. This report therefore does not invent a branch-by-branch list.
- `routes/orderRoutes.js` has the lowest application branch percentage at 56.00%. Its reported uncovered ranges are in the order/sales-summary handler (lines 46-123), incoming-order-queue handler (133-162), staff status-update handler (180-221), student order-history and single-order handlers (257-337), order-creation handler validation/rejection paths (351-508), and cancellation handler rejection paths (581-606).
- The 86.94% mixed aggregate includes test-source files. The 72.34% production-code-only figure is the appropriate backend application aggregate for interpretation.
- No pass threshold is claimed. These are measured values, not acceptance criteria.
