# System Validation Report

Tested on commit `bd493fb` where the evidence explicitly identifies that commit. This report consolidates recorded results only; it does not create new test outcomes or infer unexecuted results.

## Scope and evidence basis

- Functional and security API cases were executed by Codex on 16 Nov 2026 against the isolated `canteen_preorder_test` database using synthetic data. The temporary backend was stopped and the synthetic students, staff, menu items, and orders were deleted after execution. Those results are pending Rohini review.
- Non-functional outcomes below are taken from the pre-existing NFR evidence files linked in the table. They were not re-run as part of the functional/security API cycle.
- Browser, participant, accessibility, compatibility, and deployed-TLS work is not represented as a successful API test.

## Case outcomes and traceability

| Test case | Requirement | Outcome | Evidence | Notes / defect |
|---|---|---|---|---|
| TC-AUTH-01 | CPS-F-001 | Pass | [evidence](evidence/TC-AUTH-01.md) | — |
| TC-AUTH-02 | CPS-F-002 | Pass | [evidence](evidence/TC-AUTH-02.md) | — |
| TC-MENU-01 | CPS-F-003 | Fail | [evidence](evidence/TC-MENU-01.md) | `DEF-F003-001` |
| TC-MENU-02 | CPS-F-004 | Partial | [evidence](evidence/TC-MENU-02.md) | API query filtering absent; browser filtering not run |
| TC-CART-01 | CPS-F-005 | Blocked | [evidence](evidence/TC-CART-01.md) | Cart manipulation is browser local-storage behavior |
| TC-CART-02 | CPS-F-006 | Partial | [evidence](evidence/TC-CART-02.md) | `DEF-STOCK-001` |
| TC-ORD-01 | CPS-F-007 | Pass | [evidence](evidence/TC-ORD-01.md) | — |
| TC-ORD-02 | CPS-F-008 | Pass | [evidence](evidence/TC-ORD-02.md) | — |
| TC-PAY-01 | CPS-F-009 | Pass | [evidence](evidence/TC-PAY-01.md) | Simulated payment only |
| TC-TRACK-01 | CPS-F-010 | Pass | [evidence](evidence/TC-TRACK-01.md) | — |
| TC-TRACK-02 | CPS-F-011 | Pass | [evidence](evidence/TC-TRACK-02.md) | — |
| TC-ORD-03 | CPS-F-012 | Pass | [evidence](evidence/TC-ORD-03.md) | — |
| TC-STAFF-01 | CPS-F-013 | Pass | [evidence](evidence/TC-STAFF-01.md) | — |
| TC-STAFF-02 | CPS-F-014 | Pass | [evidence](evidence/TC-STAFF-02.md) | — |
| TC-STAFF-03 | CPS-F-015 | Pass | [evidence](evidence/TC-STAFF-03.md) | — |
| TC-STAFF-04 | CPS-F-016 | Fail | [evidence](evidence/TC-STAFF-04.md) | `DEF-F016-001` |
| TC-MENU-03 | CPS-F-017 | Partial | [evidence](evidence/TC-MENU-03.md) | `DEF-STOCK-001` |
| TC-ORD-04 | CPS-F-018 | Pass | [evidence](evidence/TC-ORD-04.md) | — |
| TC-ERR-01 | CPS-F-019 | Pass | [evidence](evidence/TC-ERR-01.md) | — |
| TC-STAFF-05 | CPS-F-020 | Pass | [evidence](evidence/TC-STAFF-05.md) | — |
| TC-PERF-01 | CPS-NF-001 | Pass | [NFR-001](NFR-001.md) | Recorded local performance result |
| TC-REL-01 | CPS-NF-002 | Pass for observed window | [NFR-002](NFR-002.md) | Approximately 11-minute observation only |
| TC-UX-01 | CPS-NF-003 | Partial | [NFR-003](NFR-003.md) | Representative user sessions outstanding |
| TC-OPS-01 | CPS-NF-004 | Partial | [NFR-004](NFR-004.md) | Deployment retention/access controls unverified |
| TC-UX-02 | CPS-NF-005 | Incomplete | [NFR-005](NFR-005.md) | Recorded contrast failures |
| TC-REL-02 | CPS-NF-006 | Pass, qualified | [NFR-006](NFR-006.md) | Recorded mocked route tests; live MongoDB idempotency test not recorded |
| TC-COMP-01 | CPS-NF-007 | Incomplete | [NFR-007](NFR-007.md) | Edge and staff workflow evidence missing |
| TC-DATA-01 | CPS-NF-008 | Pass | [NFR-008](NFR-008.md) | Isolated MongoDB integration evidence |
| TC-PERF-02 | CPS-NF-009 | Pass at tested scale | [NFR-009](NFR-009.md) | Local single-host test; follow-ups noted |
| TC-MAINT-01 | CPS-NF-010 | Fail | [NFR-010](NFR-010.md) | Root README missing; recorded lint concerns |
| TC-SEC-01 | CPS-SR-001 | Pass | [evidence](evidence/TC-SEC-01.md) | — |
| TC-SEC-02 | CPS-SR-002 | Pass | [evidence](evidence/TC-SEC-02.md) | — |
| TC-SEC-03 | CPS-SR-003 | Pass | [evidence](evidence/TC-SEC-03.md) | — |
| TC-SEC-04 | CPS-SR-004 | Pass | [evidence](evidence/TC-SEC-04.md) | — |
| TC-SEC-05 | CPS-SR-005 | Pass | [evidence](evidence/TC-SEC-05.md) | Local event content only |
| TC-SEC-06 | CPS-SR-006 | Blocked | [evidence](evidence/TC-SEC-06.md) | No TLS deployment available |

## Requirement coverage summary

| Requirement group | Pass | Fail | Partial | Blocked | Incomplete | Total |
|---|---:|---:|---:|---:|---:|---:|
| Functional, CPS-F-001 to CPS-F-020 | 14 | 2 | 3 | 1 | 0 | 20 |
| Non-functional, CPS-NF-001 to CPS-NF-010 | 5 | 1 | 2 | 0 | 2 | 10 |
| Security, CPS-SR-001 to CPS-SR-006 | 5 | 0 | 0 | 1 | 0 | 6 |
| **All planned cases** | **24** | **3** | **5** | **2** | **2** | **36** |

The three recorded failures are not eligible for release sign-off. Two non-functional requirements are explicitly incomplete, and two security/deployment or browser-dependent cases remain blocked.

## Defects and deviations

| ID | Affected requirement(s) | Recorded finding | Status |
|---|---|---|---|
| DEF-F003-001 | CPS-F-003 | Menu API items do not expose the SRS-required `description` field. | Open |
| DEF-F016-001 | CPS-F-016 | SRS describes Accepted → Preparing → Ready → Completed; implementation accepts only Placed → Completed or Placed → Cancelled. | Open |
| DEF-STOCK-001 | CPS-F-006, CPS-F-017 | Availability and quantity are validated, but a successful order does not decrement stock. | Open |

### Known deviations

1. **Menu description:** menu items lack the SRS `description` field. `foodType` is returned, but it is not a description.
2. **Order status lifecycle:** the specified Accepted, Preparing, and Ready states do not exist in the implementation. The observed API allows only direct Placed → Completed or Placed → Cancelled.
3. **Stock behavior:** stock is checked before validation/order creation but does not decrease after an order. This leaves stock/availability unchanged after a purchase.

## Retests

- No corrective code was made during this validation run, so no defect retest was executed.
- `NFR-003.md` records a previous retest of the checkout return-after-login correction; it does not retest the current open defects above.
- After a fix, rerun TC-MENU-01, TC-CART-02, TC-STAFF-04, and TC-MENU-03 against a newly cleaned isolated database and replace their results only with newly recorded evidence.

## Incomplete work before sign-off

- Complete the recorded incomplete NFRs: accessibility/contrast (TC-UX-02) and Chrome/Firefox/Edge plus staff compatibility coverage (TC-COMP-01).
- Complete representative, contemporaneously observed usability sessions for TC-UX-01.
- Establish deployment log retention/access controls for TC-OPS-01.
- Test HTTPS against an actual TLS deployment for TC-SEC-06.
- Resolve or formally approve the three known deviations with Sindhu before final sign-off.
