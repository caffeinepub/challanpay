# ChallanPay - Vehicle Challan Finder & Payment

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Vehicle challan lookup by vehicle registration number
- Challan listing with details: violation type, fine amount, date, location, status
- Discount system: challan can be paid at a discounted rate (e.g. 30% off if paid within a window)
- Payment flow: select challan(s), see discounted amount, confirm payment
- Challan status tracking: Pending, Paid
- Admin-seeded sample challan data for demo purposes
- Dashboard showing total dues, discount savings, paid challans

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Motoko canister storing challans keyed by vehicle number. CRUD operations: get challans by vehicle number, pay challan (mark as paid), list all challans.
2. Seed some sample challans for demo vehicles.
3. Frontend: Home page with vehicle number search input. Results page showing challan list with discount badge. Payment confirmation modal. Success state after payment.
