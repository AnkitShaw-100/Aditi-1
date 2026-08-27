# Contributor coupons — design

**Date:** 2026-08-27
**Status:** approved, implemented

## Purpose

Give contributors a code that unlocks one paid item at no cost. The first
batch is 20 codes for a magazine issue (₹350) and 30 for a premium article
(₹50).

## The constraint that shapes everything

Razorpay will not create an order for ₹0. A 100%-off code therefore cannot be
a discount applied through the gateway — it must be a separate path that never
reaches Razorpay at all.

That separation is the design's main safety property: an order is either fully
paid through Razorpay or fully covered by a coupon, never part of each. It is
also why a coupon requires a single-item cart (see Redemption rules).

## Decisions

| Question | Decision |
|---|---|
| What one code buys | One item of its tier. A magazine code unlocks any one issue; an article code unlocks any one premium article. |
| Reuse | Single use. Once redeemed, dead. |
| Tier matching | By SKU prefix: `ADITI-MAG-*` and `ADITI-ART-*`. See "Why not price" below. |
| Mixed carts | Rejected. The cart must hold exactly one item and it must match the tier. |
| Where redeemed | A field on the existing checkout page. |
| Admin | A read-only Coupons tab plus a generation script. No CRUD UI. |
| Expiry | None. The `batch` column allows revoking a whole batch with one UPDATE if it is ever needed. |

## Data model

New table `coupons`:

```sql
code                 VARCHAR(32) UNIQUE   -- ADITI-MAG-7K3QF9
tier                 ENUM('magazine','article')
value_paise          INT UNSIGNED         -- 35000 | 5000
batch                VARCHAR(64) NULL     -- 'contributors-issue-2'
status               ENUM('active','redeemed','revoked')
redeemed_by_user_id  BIGINT UNSIGNED NULL
redeemed_magazine_id BIGINT UNSIGNED NULL
redeemed_at          DATETIME NULL
```

One new column on `user_magazines`: `coupon_id BIGINT UNSIGNED NULL`. A
coupon purchase has `razorpay_order_id = NULL` and `coupon_id` set, so free
and paid purchases stay distinguishable forever.

### Why the existing unique key is not enough

`user_magazines` has `UNIQUE KEY uq_user_magazine_order (user_id, magazine_id,
razorpay_order_id)`. MySQL permits unlimited NULLs in a unique index, so that
key does not stop a user redeeming two codes against the same magazine. The
guard is instead an explicit ownership check inside the redemption
transaction.

## Why not price

The first draft matched a coupon to its item by price -- a magazine code
covers anything at 35000 paise. Checking the live catalogue before shipping
showed magazines sitting at **100 paise**, dropped at some point to make
Razorpay testing cheap, while the migrations still insert 35000. Price-based
matching would therefore have rejected every magazine coupon, silently and in
production.

Tier is matched on the SKU prefix instead, which describes what a row *is*
rather than what it currently costs. `value_paise` is still recorded on each
coupon, but only for reporting: a later price change cannot strand codes
already in contributors' hands.

## Redemption rules

A redemption succeeds only when all of these hold:

1. The code exists and its status is `active`.
2. The cart holds exactly one item.
3. That item's SKU carries the coupon tier's prefix.
4. The user does not already own that magazine with status `paid`.

Each failure returns its own message rather than a generic rejection, because
the person hitting it is a contributor who cannot see the database.

## Concurrency

Fifty codes sent by email will be forwarded and shared. Read-then-write would
let two people redeem the same code. The claim is therefore a single
conditional UPDATE:

```sql
UPDATE coupons
   SET status='redeemed', redeemed_by_user_id=?, redeemed_magazine_id=?, redeemed_at=NOW()
 WHERE code=? AND status='active'
```

`rowCount() === 0` means someone else won, or the code was already spent.
The claim and the `user_magazines` insert run in one transaction, so a
failure after the claim rolls the code back to `active`.

## Surface

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/coupons/redeem` | Clerk JWT | Redeem a code against the single cart item. |
| `GET /api/admin/coupons` | Admin session | List all codes with status and redeemer. |

Redemptions write a `payment_events` row with source `coupon`, so they appear
in the existing audit trail beside real payments.

Frontend: a coupon field on `CheckoutPage`, and a `Coupons` tab on
`AdminDashboardPage` following the existing Users/Payments tabs.

## Generation

```
php scripts/generate_coupons.php --magazine 20 --article 30 --batch contributors-issue-2
```

Prints CSV to stdout. Codes use a 6-character alphabet with `O`, `0`, `I` and
`1` removed so they survive being read off a screenshot.

## Verification

The project has no test framework — no Composer, no PHPUnit — and migrations
are applied by hand through the `mysql` CLI. Rather than introduce tooling as
a side effect of this feature, correctness is checked by
`scripts/verify_coupons.php`, which exercises the real repository against the
real database and asserts:

- a valid code redeems and the purchase appears as paid
- the same code cannot be redeemed twice
- a magazine code is rejected against an article, and the reverse
- a cart holding two items is rejected
- an already-owned magazine is rejected
- two simultaneous claims on one code produce exactly one winner

It creates its own fixtures and removes them afterwards.
