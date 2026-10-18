# Manual test worksheet

Run these using Remix and the UI on YOUR deployment. A = deployer/administrator, B and C = student wallets. Each transaction requires confirmation before checking state. Automated test output is in test-results.txt; the manual observations below are intentionally unfilled.

| # | Sender and action | Expected | Observed / evidence |
| --- | --- | --- | --- |
| 1 | A adds Arduino Kit 01 | Success; ID 1, Available | Not run |
| 2 | A adds empty name in Remix | Revert: Name must be 1-100 bytes | Not run |
| 3 | A adds spaces-only name | Revert: Name cannot be blank | Not run |
| 4 | B adds equipment in Remix | Revert: Only administrator | Not run |
| 5 | B borrows ID 999 | Revert: Equipment does not exist | Not run |
| 6 | A borrows ID 1 | Revert: Administrator cannot borrow | Not run |
| 7 | B borrows ID 1 | Success; B is borrower, seven-day deadline | Not run |
| 8 | C borrows ID 1 | Revert: Equipment is unavailable | Not run |
| 9 | C requests return of ID 1 | Revert: Only current borrower | Not run |
| 10 | A confirms before request | Revert: Return has not been requested | Not run |
| 11 | B requests return of ID 1 | Success; ReturnRequested | Not run |
| 12 | B repeats return request | Revert: Equipment is not borrowed | Not run |
| 13 | C borrows pending item | Revert: Equipment is unavailable | Not run |
| 14 | B confirms return | Revert: Only administrator | Not run |
| 15 | A confirms return | Success; Available, zero borrower/deadline | Not run |
| 16 | C borrows ID 1 | Success; C is new borrower | Not run |
| 17 | Decline a wallet transaction | UI shows cancellation, no state change | Not run |
| 18 | Switch account/network | Page reloads, reconnect verifies role/network | Not run |
| 19 | Refresh after a Remix transaction | UI displays updated blockchain state | Not run |

For negative tests use the deployed contract in Remix, since the UI hides unauthorised actions. Distinguish a preflight revert from a mined failed transaction when recording evidence. Capture transaction hashes only when transactions were actually broadcast.
