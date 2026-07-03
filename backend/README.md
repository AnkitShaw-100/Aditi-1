# ADITI PHP Backend

This backend is the first PHP/MySQL slice for the LP flow:

1. User signs in with Clerk on the frontend.
2. Frontend sends the Clerk session token to this backend.
3. Backend verifies the Clerk JWT with Clerk JWKS.
4. Backend upserts the user into MySQL with Clerk email, phone number, date of birth, username, and purchased magazines.

## Setup

Copy the environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Update `backend/.env` with your MySQL and Clerk values.

Create the database and run the migration:

```sql
CREATE DATABASE aditi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then import:

```powershell
mysql -u root -p aditi < backend\database\migrations\001_create_auth_users_and_magazines.sql
```

Apply later migrations in order when updating an existing database:

```powershell
Get-Content backend\database\migrations\007_create_receipts.sql | mysql -u root -p aditi
Get-Content backend\database\migrations\008_create_payment_events.sql | mysql -u root -p aditi
Get-Content backend\database\migrations\009_add_receipt_snapshots.sql | mysql -u root -p aditi
Get-Content backend\database\migrations\010_create_issue_reservations.sql | mysql -u root -p aditi
```

For an existing database, replace the old dummy magazine catalogue with the real ADITI issue:

```powershell
Get-Content -Raw backend\database\migrations\004_replace_catalogue_with_aditi_magazine.sql | mysql -u root -p aditi
php backend\scripts\import_magazine_pdf.php "C:\Users\Ankit\Desktop\ADITI Strategy & Defence Magazine.pdf"
```

The import script stores the PDF in `magazines.pdf_file` and keeps the public frontend from exposing the paid file directly.

Run locally:

```powershell
php -S localhost:8080 -t backend\public
```

## Protected Endpoints

### `POST /api/auth/sync-user`

Headers:

```http
Authorization: Bearer <clerk-session-token>
Content-Type: application/json
```

Body fields are optional. Use them for profile fields Clerk does not include in the session token:

```json
{
  "username": "Aditi Reader",
  "email": "reader@example.com",
  "phone_number": "+919999999999",
  "dob": "1995-08-15"
}
```

### `GET /api/me`

Returns the stored user profile and purchased magazines for the authenticated Clerk user.

### `PUT /api/me`

Updates profile fields collected before checkout:

```json
{
  "username": "Aditi Reader",
  "email": "reader@example.com",
  "phone_number": "+919999999999",
  "dob": "1995-08-15"
}
```

### Cart Endpoints

```text
GET /api/cart
POST /api/cart
DELETE /api/cart/{cart_item_id}
```

Add an article/magazine to cart:

```json
{
  "magazine_slug": "ladakh-question-after-buffer-zones"
}
```

## Clerk Webhooks

For production user syncing, configure Clerk to call:

```text
POST https://your-domain.com/api/webhooks/clerk
```

Subscribe to these events:

```text
user.created
user.updated
user.deleted
```

Then add the endpoint signing secret to `backend/.env`:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

## Razorpay Payments

Set these values in `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

The checkout flow creates a Razorpay order from the signed-in user's cart, verifies the Razorpay signature after payment, marks `user_magazines.status` as `paid`, clears the purchased item from cart, and enables protected PDF download through:

```text
GET /api/magazines/{slug}/download
```

For production payment recovery, configure Razorpay Dashboard -> Developers -> Webhooks to call:

```text
POST https://read.aditidefence.in/api/webhooks/razorpay
```

Subscribe to:

```text
payment.captured
order.paid
payment.failed
```

The webhook is the server-side fallback for cases where Razorpay captures payment but the user's browser closes, loses network, or fails to call the frontend verification endpoint. The webhook verifies `X-Razorpay-Signature` using `RAZORPAY_WEBHOOK_SECRET`, then marks matching `razorpay_order_id` purchases as `paid` and clears the user's cart.

There is also an authenticated recovery endpoint for signed-in users:

```text
POST /api/payments/razorpay/recover
```

It checks the user's pending `razorpay_order_id` records against Razorpay's order payments API. If Razorpay reports a captured payment or a paid order, the backend marks the purchase as `paid`, clears the cart item, and the profile page shows the PDF download button. Receipt/invoice details are sent by email only.

## Receipt Emails

Receipt emails are generated from `backend/templates/receipt-email.html` and sent only after the backend marks a Razorpay order as paid. Configure the frontend URL and mail settings:

```env
FRONTEND_URL=https://read.aditidefence.in
MAIL_ENABLED=true
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=receipts@aditidefence.in
MAIL_FROM_NAME="ADITI"
```

Run the receipts migration before enabling receipt emails:

```powershell
Get-Content backend\database\migrations\007_create_receipts.sql | mysql -u root -p aditi
Get-Content backend\database\migrations\008_create_payment_events.sql | mysql -u root -p aditi
Get-Content backend\database\migrations\009_add_receipt_snapshots.sql | mysql -u root -p aditi
```

The `receipts` table stores one receipt record per Razorpay order, including receipt number, amount, recipient email, send time, last send error, and the generated receipt HTML snapshot. This prevents duplicate receipt emails when frontend verification, webhook verification, and payment recovery all confirm the same order.

The `payment_events` table stores operational payment events from checkout, Razorpay webhooks, user recovery, admin recovery, and receipt email sending. Logging is best-effort and does not block checkout if the table is unavailable.

For local testing, expose the PHP backend with a tunnel such as ngrok:

```powershell
ngrok http 8080
```

Use the generated HTTPS URL in Clerk Dashboard:

```text
https://your-ngrok-url.ngrok-free.app/api/webhooks/clerk
```

## Admin Login

Run the migration:

```powershell
Get-Content "backend\database\migrations\003_create_admin_auth.sql" | mysql -u aditi_admin -p aditi
```

Create or reset an admin user:

```powershell
php backend\scripts\create_admin_user.php admin@aditi.in "StrongPassword123" "ADITI Admin"
```

Admin endpoints:

```text
POST /api/admin/login
GET /api/admin/users
GET /api/admin/payments
GET /api/admin/issue-reservations
POST /api/admin/payments/recover
POST /api/admin/logout
```

## Issue Reservations

The public landing page reservation form stores Issue II email leads with:

```text
POST /api/issue-reservations
```

Run the table migration before enabling the form in production:

```powershell
Get-Content backend\database\migrations\010_create_issue_reservations.sql | mysql -u root -p aditi
```

`POST /api/admin/payments/recover` accepts:

```json
{
  "razorpay_order_id": "order_xxxxx"
}
```

It checks Razorpay directly, updates the local purchase status when possible, and retries receipt email generation for paid orders.

## Frontend Call Shape

From React with Clerk:

```js
const token = await getToken();

await fetch("http://localhost:8080/api/auth/sync-user", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: user.fullName,
    email: user.primaryEmailAddress?.emailAddress,
    phone_number: user.primaryPhoneNumber?.phoneNumber,
    dob,
  }),
});
```
