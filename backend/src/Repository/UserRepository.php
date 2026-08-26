<?php

declare(strict_types=1);

namespace App\Repository;

use PDO;

final class UserRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function syncUserFromAuth(string $clerkUserId, array $profile, array $meta): array
    {
        $email = $this->firstNonEmpty($profile['email'] ?? null);
        $phone = $this->firstNonEmpty($profile['phone_number'] ?? null);
        $dob = $this->dateValue($profile['dob'] ?? null);
        $name = $this->firstNonEmpty($profile['username'] ?? null, $profile['name'] ?? null);
        $image = $this->firstNonEmpty($profile['profile_image_url'] ?? null);

        try {
            $this->pdo->beginTransaction();

            $statement = $this->pdo->prepare(
                'INSERT INTO users (clerk_user_id, email, phone_number, dob, username, profile_image_url, last_sign_in_at)
                 VALUES (:clerk_user_id, :email, :phone_number, :dob, :username, :profile_image_url, NOW())
                 ON DUPLICATE KEY UPDATE
                    email = COALESCE(VALUES(email), email),
                    phone_number = COALESCE(VALUES(phone_number), phone_number),
                    dob = COALESCE(VALUES(dob), dob),
                    username = COALESCE(VALUES(username), username),
                    profile_image_url = COALESCE(VALUES(profile_image_url), profile_image_url),
                    last_sign_in_at = NOW(),
                    updated_at = NOW()'
            );

            $statement->execute([
                'clerk_user_id' => $clerkUserId,
                'email' => $email,
                'phone_number' => $phone,
                'dob' => $dob,
                'username' => $name,
                'profile_image_url' => $image,
            ]);

            $user = $this->findUserRowByClerkId($clerkUserId);

            $event = $this->pdo->prepare(
                'INSERT INTO sign_in_events (user_id, clerk_session_id, ip_address, user_agent, signed_in_at)
                 VALUES (:user_id, :clerk_session_id, :ip_address, :user_agent, NOW())'
            );

            $event->execute([
                'user_id' => $user['id'],
                'clerk_session_id' => $meta['session_id'] ?? null,
                'ip_address' => $meta['ip_address'] ?? null,
                'user_agent' => $meta['user_agent'] ?? null,
            ]);

            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $exception;
        }

        return $this->findProfileByClerkId($clerkUserId) ?? $user;
    }

    public function upsertUserFromClerkWebhook(array $clerkUser): array
    {
        $clerkUserId = $clerkUser['id'] ?? null;

        if (!is_string($clerkUserId) || $clerkUserId === '') {
            throw new \InvalidArgumentException('Clerk webhook payload is missing user id.');
        }

        $statement = $this->pdo->prepare(
            'INSERT INTO users (clerk_user_id, email, phone_number, dob, username, profile_image_url)
             VALUES (:clerk_user_id, :email, :phone_number, :dob, :username, :profile_image_url)
             ON DUPLICATE KEY UPDATE
                email = COALESCE(VALUES(email), email),
                phone_number = COALESCE(VALUES(phone_number), phone_number),
                dob = COALESCE(VALUES(dob), dob),
                username = COALESCE(VALUES(username), username),
                profile_image_url = COALESCE(VALUES(profile_image_url), profile_image_url),
                updated_at = NOW()'
        );

        $statement->execute([
            'clerk_user_id' => $clerkUserId,
            'email' => $this->emailFromClerkUser($clerkUser),
            'phone_number' => $this->phoneFromClerkUser($clerkUser),
            'dob' => $this->dobFromClerkUser($clerkUser),
            'username' => $this->nameFromClerkUser($clerkUser),
            'profile_image_url' => $this->firstNonEmpty($clerkUser['image_url'] ?? null),
        ]);

        return $this->findProfileByClerkId($clerkUserId) ?? [];
    }

    public function deleteUserFromClerkWebhook(string $clerkUserId): void
    {
        $statement = $this->pdo->prepare('DELETE FROM users WHERE clerk_user_id = :clerk_user_id');
        $statement->execute(['clerk_user_id' => $clerkUserId]);
    }

    public function findProfileByClerkId(string $clerkUserId): ?array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            return null;
        }

        $statement = $this->pdo->prepare(
            'SELECT m.id, m.sku, m.slug, m.title, m.price_paise, m.currency, um.status,
                    um.razorpay_order_id, um.razorpay_payment_id, um.purchased_at,
                    um.created_at AS ordered_at
             FROM user_magazines um
             INNER JOIN magazines m ON m.id = um.magazine_id
             WHERE um.user_id = :user_id
                AND um.id = (
                    SELECT um2.id
                    FROM user_magazines um2
                    WHERE um2.user_id = um.user_id
                      AND um2.magazine_id = um.magazine_id
                    ORDER BY
                        CASE um2.status
                            WHEN "paid" THEN 1
                            WHEN "pending" THEN 2
                            WHEN "failed" THEN 3
                            ELSE 4
                        END,
                        um2.purchased_at DESC,
                        um2.updated_at DESC,
                        um2.id DESC
                    LIMIT 1
                )
             ORDER BY
                CASE um.status
                    WHEN "paid" THEN 1
                    WHEN "pending" THEN 2
                    WHEN "failed" THEN 3
                    ELSE 4
                END,
                um.purchased_at DESC,
                um.updated_at DESC'
        );
        $statement->execute(['user_id' => $user['id']]);

        $user['magazines_bought'] = $statement->fetchAll();

        return $user;
    }

    public function updateProfile(string $clerkUserId, array $profile): ?array
    {
        $current = $this->findUserRowByClerkId($clerkUserId);

        if ($current === null) {
            return null;
        }

        if ($this->firstNonEmpty($current['profile_completed_at'] ?? null) !== null) {
            throw new \RuntimeException('Profile details can only be saved once. Contact support if a correction is needed.');
        }

        $email = $this->firstNonEmpty($profile['email'] ?? null, $current['email'] ?? null);
        $phoneNumber = $this->firstNonEmpty($profile['phone_number'] ?? null);
        $dob = $this->dateValue($profile['dob'] ?? null);
        $username = $this->firstNonEmpty($profile['username'] ?? null, $profile['name'] ?? null, $current['username'] ?? null);

        if ($email === null || $phoneNumber === null || $dob === null || $username === null) {
            throw new \InvalidArgumentException('Name, email, phone number, and date of birth are required.');
        }

        $email = $this->validEmail($email);
        $phoneNumber = $this->validPhoneNumber($phoneNumber);
        $username = $this->validName($username);
        $this->assertNotFutureDate($dob);

        $statement = $this->pdo->prepare(
            'UPDATE users
             SET email = :email,
                 phone_number = :phone_number,
                 dob = :dob,
                 username = :username,
                 profile_completed_at = NOW(),
                 updated_at = NOW()
             WHERE clerk_user_id = :clerk_user_id'
        );

        $statement->execute([
            'clerk_user_id' => $clerkUserId,
            'email' => $email,
            'phone_number' => $phoneNumber,
            'dob' => $dob,
            'username' => $username,
        ]);

        return $this->findProfileByClerkId($clerkUserId);
    }

    public function getCart(string $clerkUserId): array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            return [];
        }

        $statement = $this->pdo->prepare(
            'SELECT uci.id AS cart_item_id, m.id, m.sku, m.slug, m.title, m.price_paise, m.currency,
                    m.pdf_path, uci.created_at AS added_at
             FROM user_cart_items uci
             INNER JOIN magazines m ON m.id = uci.magazine_id
             WHERE uci.user_id = :user_id
             ORDER BY uci.created_at DESC'
        );
        $statement->execute(['user_id' => $user['id']]);

        return $statement->fetchAll();
    }

    public function addCartItem(string $clerkUserId, string $magazineSlug): array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            throw new \RuntimeException('User profile not found.');
        }

        $magazine = $this->findMagazineBySlug($magazineSlug);

        if ($magazine === null) {
            throw new \RuntimeException('Magazine not found.');
        }

        $statement = $this->pdo->prepare(
            'INSERT INTO user_cart_items (user_id, magazine_id)
             VALUES (:user_id, :magazine_id)
             ON DUPLICATE KEY UPDATE updated_at = NOW()'
        );

        $statement->execute([
            'user_id' => $user['id'],
            'magazine_id' => $magazine['id'],
        ]);

        return $this->getCart($clerkUserId);
    }

    public function removeCartItem(string $clerkUserId, int $cartItemId): array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            return [];
        }

        $statement = $this->pdo->prepare(
            'DELETE FROM user_cart_items
             WHERE id = :cart_item_id AND user_id = :user_id'
        );

        $statement->execute([
            'cart_item_id' => $cartItemId,
            'user_id' => $user['id'],
        ]);

        return $this->getCart($clerkUserId);
    }

    public function cartSummary(string $clerkUserId): array
    {
        $cart = $this->getCart($clerkUserId);
        $total = array_reduce(
            $cart,
            static fn (int $sum, array $item): int => $sum + (int) ($item['price_paise'] ?? 0),
            0
        );

        return [
            'cart' => $cart,
            'total_paise' => $total,
            'currency' => $cart[0]['currency'] ?? 'INR',
        ];
    }

    public function createPendingPurchasesForCart(string $clerkUserId, string $razorpayOrderId): array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            throw new \RuntimeException('User profile not found.');
        }

        $cart = $this->getCart($clerkUserId);

        if ($cart === []) {
            throw new \RuntimeException('Cart is empty.');
        }

        $statement = $this->pdo->prepare(
            'INSERT INTO user_magazines (user_id, magazine_id, razorpay_order_id, status)
             VALUES (:user_id, :magazine_id, :razorpay_order_id, "pending")
             ON DUPLICATE KEY UPDATE status = "pending", updated_at = NOW()'
        );

        foreach ($cart as $item) {
            $statement->execute([
                'user_id' => $user['id'],
                'magazine_id' => $item['id'],
                'razorpay_order_id' => $razorpayOrderId,
            ]);
        }

        return $cart;
    }

    public function markRazorpayOrderPaid(
        string $clerkUserId,
        string $razorpayOrderId,
        ?string $razorpayPaymentId
    ): array {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            throw new \RuntimeException('User profile not found.');
        }

        $this->markPaidForUserOrder((int) $user['id'], $razorpayOrderId, $razorpayPaymentId);

        return $this->findProfileByClerkId($clerkUserId)['magazines_bought'] ?? [];
    }

    public function markRazorpayOrderPaidByOrderId(string $razorpayOrderId, ?string $razorpayPaymentId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT DISTINCT user_id
             FROM user_magazines
             WHERE razorpay_order_id = :razorpay_order_id'
        );
        $statement->execute(['razorpay_order_id' => $razorpayOrderId]);
        $userIds = array_map(
            static fn (array $row): int => (int) $row['user_id'],
            $statement->fetchAll()
        );

        foreach ($userIds as $userId) {
            $this->markPaidForUserOrder($userId, $razorpayOrderId, $razorpayPaymentId);
        }

        return [
            'matched' => $userIds !== [],
            'user_ids' => $userIds,
        ];
    }

    public function markRazorpayOrderFailedByOrderId(string $razorpayOrderId, ?string $razorpayPaymentId): array
    {
        $statement = $this->pdo->prepare(
            'UPDATE user_magazines
             SET status = "failed",
                 razorpay_payment_id = COALESCE(:razorpay_payment_id, razorpay_payment_id),
                 updated_at = NOW()
             WHERE razorpay_order_id = :razorpay_order_id
               AND status = "pending"'
        );
        $statement->execute([
            'razorpay_order_id' => $razorpayOrderId,
            'razorpay_payment_id' => $razorpayPaymentId,
        ]);

        return [
            'matched' => $statement->rowCount() > 0,
            'updated_count' => $statement->rowCount(),
        ];
    }

    public function pendingRazorpayOrderIdsForUser(string $clerkUserId): array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            return [];
        }

        $statement = $this->pdo->prepare(
            'SELECT DISTINCT razorpay_order_id
             FROM user_magazines
             WHERE user_id = :user_id
               AND status = "pending"
               AND razorpay_order_id IS NOT NULL
               AND razorpay_order_id <> ""
             ORDER BY razorpay_order_id DESC'
        );
        $statement->execute(['user_id' => $user['id']]);

        return array_values(array_filter(
            array_map(
                static fn (array $row): ?string => is_string($row['razorpay_order_id'] ?? null)
                    ? $row['razorpay_order_id']
                    : null,
                $statement->fetchAll()
            )
        ));
    }

    public function userIdForClerkId(string $clerkUserId): ?int
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        return $user === null ? null : (int) $user['id'];
    }

    public function recordPaymentEvent(
        ?int $userId,
        ?string $razorpayOrderId,
        ?string $razorpayPaymentId,
        string $source,
        string $eventType,
        string $status,
        ?string $message = null,
        array $payload = []
    ): void {
        try {
            $statement = $this->pdo->prepare(
                'INSERT INTO payment_events (
                    user_id, razorpay_order_id, razorpay_payment_id, source,
                    event_type, status, message, payload_json
                 )
                 VALUES (
                    :user_id, :razorpay_order_id, :razorpay_payment_id, :source,
                    :event_type, :status, :message, :payload_json
                 )'
            );
            $encodedPayload = $payload === []
                ? null
                : json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            $statement->execute([
                'user_id' => $userId,
                'razorpay_order_id' => $razorpayOrderId,
                'razorpay_payment_id' => $razorpayPaymentId,
                'source' => substr($source, 0, 40),
                'event_type' => substr($eventType, 0, 80),
                'status' => substr($status, 0, 40),
                'message' => $message === null ? null : substr($message, 0, 255),
                'payload_json' => is_string($encodedPayload) ? $encodedPayload : null,
            ]);
        } catch (\Throwable) {
            // Payment logs are operational support only; never block checkout or recovery.
        }
    }

    private function markPaidForUserOrder(
        int $userId,
        string $razorpayOrderId,
        ?string $razorpayPaymentId
    ): void {
        try {
            $this->pdo->beginTransaction();

            $purchaseIds = $this->pdo->prepare(
                'SELECT magazine_id
                 FROM user_magazines
                 WHERE user_id = :user_id AND razorpay_order_id = :razorpay_order_id'
            );
            $purchaseIds->execute([
                'user_id' => $userId,
                'razorpay_order_id' => $razorpayOrderId,
            ]);
            $magazineIds = array_map(
                static fn (array $row): int => (int) $row['magazine_id'],
                $purchaseIds->fetchAll()
            );

            if ($magazineIds === []) {
                throw new \RuntimeException('No pending purchase found for this payment.');
            }

            $update = $this->pdo->prepare(
                'UPDATE user_magazines
                 SET status = "paid",
                     razorpay_payment_id = COALESCE(:razorpay_payment_id, razorpay_payment_id),
                     purchased_at = COALESCE(purchased_at, NOW()),
                     updated_at = NOW()
                 WHERE user_id = :user_id AND razorpay_order_id = :razorpay_order_id'
            );
            $update->execute([
                'user_id' => $userId,
                'razorpay_order_id' => $razorpayOrderId,
                'razorpay_payment_id' => $razorpayPaymentId,
            ]);

            $placeholders = implode(',', array_fill(0, count($magazineIds), '?'));
            $delete = $this->pdo->prepare(
                "DELETE FROM user_cart_items
                 WHERE user_id = ? AND magazine_id IN ($placeholders)"
            );
            $delete->execute([$userId, ...$magazineIds]);

            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $exception;
        }
    }

    public function paidOrderInvoice(string $clerkUserId, string $razorpayOrderId): ?array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            return null;
        }

        $statement = $this->pdo->prepare(
            'SELECT m.id, m.sku, m.slug, m.title, m.price_paise, m.currency,
                    um.status, um.razorpay_order_id, um.razorpay_payment_id, um.purchased_at
             FROM user_magazines um
             INNER JOIN magazines m ON m.id = um.magazine_id
             WHERE um.user_id = :user_id
               AND um.razorpay_order_id = :razorpay_order_id
               AND um.status = "paid"
             ORDER BY um.purchased_at DESC, m.title ASC'
        );
        $statement->execute([
            'user_id' => $user['id'],
            'razorpay_order_id' => $razorpayOrderId,
        ]);

        $items = $statement->fetchAll();

        if ($items === []) {
            return null;
        }

        return [
            'user' => $user,
            'items' => $items,
            'order_id' => $razorpayOrderId,
            'payment_id' => $items[0]['razorpay_payment_id'] ?? '',
            'purchased_at' => $items[0]['purchased_at'] ?? null,
            'currency' => $items[0]['currency'] ?? 'INR',
            'total_paise' => array_reduce(
                $items,
                static fn (int $sum, array $item): int => $sum + (int) ($item['price_paise'] ?? 0),
                0
            ),
        ];
    }

    public function createReceiptForPaidOrder(string $razorpayOrderId): ?array
    {
        $invoice = $this->paidOrderReceiptByOrderId($razorpayOrderId);

        if ($invoice === null) {
            return null;
        }

        $receiptNumber = $this->receiptNumberForOrder($razorpayOrderId);
        $statement = $this->pdo->prepare(
            'INSERT INTO receipts (
                user_id, razorpay_order_id, razorpay_payment_id, receipt_number,
                amount_paise, currency, purchase_date, email_to
             )
             VALUES (
                :user_id, :razorpay_order_id, :razorpay_payment_id, :receipt_number,
                :amount_paise, :currency, :purchase_date, :email_to
             )
             ON DUPLICATE KEY UPDATE
                razorpay_payment_id = COALESCE(VALUES(razorpay_payment_id), razorpay_payment_id),
                amount_paise = VALUES(amount_paise),
                currency = VALUES(currency),
                purchase_date = COALESCE(VALUES(purchase_date), purchase_date),
                email_to = COALESCE(VALUES(email_to), email_to),
                updated_at = NOW()'
        );
        $statement->execute([
            'user_id' => $invoice['user']['id'],
            'razorpay_order_id' => $razorpayOrderId,
            'razorpay_payment_id' => $invoice['payment_id'],
            'receipt_number' => $receiptNumber,
            'amount_paise' => $invoice['total_paise'],
            'currency' => $invoice['currency'],
            'purchase_date' => $invoice['purchased_at'],
            'email_to' => $invoice['user']['email'] ?? null,
        ]);

        return $this->receiptPayloadByOrderId($razorpayOrderId);
    }

    public function markReceiptEmailSent(int $receiptId): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE receipts
             SET email_sent_at = NOW(), email_last_error = NULL, updated_at = NOW()
             WHERE id = :id'
        );
        $statement->execute(['id' => $receiptId]);
    }

    public function markReceiptEmailFailed(int $receiptId, string $error): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE receipts
             SET email_last_error = :email_last_error, updated_at = NOW()
             WHERE id = :id'
        );
        $statement->execute([
            'id' => $receiptId,
            'email_last_error' => substr($error, 0, 2000),
        ]);
    }

    public function storeReceiptEmailSnapshot(int $receiptId, string $html): void
    {
        try {
            $statement = $this->pdo->prepare(
                'UPDATE receipts
                 SET payment_method = "Razorpay",
                     payment_status = "Paid",
                     order_status = "Completed",
                     receipt_html = :receipt_html,
                     updated_at = NOW()
                 WHERE id = :id'
            );
            $statement->execute([
                'id' => $receiptId,
                'receipt_html' => $html,
            ]);
        } catch (\Throwable) {
            // Older databases may not have snapshot columns until migration 009 is applied.
        }
    }

    private function paidOrderReceiptByOrderId(string $razorpayOrderId): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT u.id AS user_id, u.email, u.phone_number, u.username,
                    m.id, m.sku, m.slug, m.title, m.price_paise, m.currency,
                    um.status, um.razorpay_order_id, um.razorpay_payment_id, um.purchased_at
             FROM user_magazines um
             INNER JOIN users u ON u.id = um.user_id
             INNER JOIN magazines m ON m.id = um.magazine_id
             WHERE um.razorpay_order_id = :razorpay_order_id
               AND um.status = "paid"
             ORDER BY um.purchased_at DESC, m.title ASC'
        );
        $statement->execute(['razorpay_order_id' => $razorpayOrderId]);
        $rows = $statement->fetchAll();

        if ($rows === []) {
            return null;
        }

        $first = $rows[0];

        return [
            'user' => [
                'id' => (int) $first['user_id'],
                'username' => $first['username'],
                'email' => $first['email'],
                'phone_number' => $first['phone_number'],
            ],
            'items' => $rows,
            'order_id' => $razorpayOrderId,
            'payment_id' => $first['razorpay_payment_id'] ?? '',
            'purchased_at' => $first['purchased_at'] ?? null,
            'currency' => $first['currency'] ?? 'INR',
            'total_paise' => array_reduce(
                $rows,
                static fn (int $sum, array $item): int => $sum + (int) ($item['price_paise'] ?? 0),
                0
            ),
        ];
    }

    private function receiptPayloadByOrderId(string $razorpayOrderId): ?array
    {
        $invoice = $this->paidOrderReceiptByOrderId($razorpayOrderId);

        if ($invoice === null) {
            return null;
        }

        $statement = $this->pdo->prepare(
            'SELECT id, receipt_number, email_to, email_sent_at, email_last_error
             FROM receipts
             WHERE razorpay_order_id = :razorpay_order_id
             LIMIT 1'
        );
        $statement->execute(['razorpay_order_id' => $razorpayOrderId]);
        $receipt = $statement->fetch();

        if ($receipt === false) {
            return null;
        }

        $invoice['receipt'] = $receipt;

        return $invoice;
    }

    private function receiptNumberForOrder(string $razorpayOrderId): string
    {
        $safeOrderId = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $razorpayOrderId) ?: 'ORDER');

        return 'ADITI-RCPT-' . substr($safeOrderId, -10);
    }

    public function paidMagazineFile(string $clerkUserId, string $slug): ?array
    {
        $user = $this->findUserRowByClerkId($clerkUserId);

        if ($user === null) {
            return null;
        }

        $statement = $this->pdo->prepare(
            'SELECT m.title, m.slug, m.pdf_path, m.pdf_file, m.pdf_filename, m.pdf_mime_type
             FROM user_magazines um
             INNER JOIN magazines m ON m.id = um.magazine_id
             WHERE um.user_id = :user_id
               AND m.slug = :slug
               AND um.status = "paid"
             ORDER BY um.purchased_at DESC
             LIMIT 1'
        );
        $statement->execute([
            'user_id' => $user['id'],
            'slug' => $slug,
        ]);

        $file = $statement->fetch();

        return $file === false ? null : $file;
    }

    private function findUserRowByClerkId(string $clerkUserId): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, clerk_user_id, email, phone_number, dob, username, profile_image_url,
                    profile_completed_at, last_sign_in_at, created_at, updated_at
             FROM users
             WHERE clerk_user_id = :clerk_user_id
             LIMIT 1'
        );
        $statement->execute(['clerk_user_id' => $clerkUserId]);

        $user = $statement->fetch();

        return $user === false ? null : $user;
    }

    private function findMagazineBySlug(string $slug): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, sku, slug, title, price_paise, currency
             FROM magazines
             WHERE slug = :slug AND is_active = 1
             LIMIT 1'
        );
        $statement->execute(['slug' => $slug]);

        $magazine = $statement->fetch();

        return $magazine === false ? null : $magazine;
    }

    private function profileIsComplete(array $user): bool
    {
        return $this->firstNonEmpty($user['username'] ?? null) !== null
            && $this->firstNonEmpty($user['email'] ?? null) !== null
            && $this->firstNonEmpty($user['phone_number'] ?? null) !== null
            && $this->firstNonEmpty($user['dob'] ?? null) !== null;
    }

    private function firstNonEmpty(mixed ...$values): ?string
    {
        foreach ($values as $value) {
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    private function dateValue(mixed $value): ?string
    {
        $date = $this->firstNonEmpty($value);

        if ($date === null) {
            return null;
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new \InvalidArgumentException('Date of birth must use YYYY-MM-DD format.');
        }

        [$year, $month, $day] = array_map('intval', explode('-', $date));

        if (!checkdate($month, $day, $year)) {
            throw new \InvalidArgumentException('Date of birth is invalid.');
        }

        return $date;
    }

    private function validName(string $value): string
    {
        $name = trim($value);

        if (strlen($name) < 2 || strlen($name) > 255) {
            throw new \InvalidArgumentException('Enter a valid name.');
        }

        return $name;
    }

    private function validEmail(string $value): string
    {
        $email = trim($value);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Enter a valid email address.');
        }

        return $email;
    }

    private function validPhoneNumber(string $value): string
    {
        $trimmed = trim($value);
        $digits = preg_replace('/\D+/', '', $trimmed) ?? '';
        $length = strlen($digits);

        if ($length < 10 || $length > 15) {
            throw new \InvalidArgumentException('Enter a valid phone number.');
        }

        return str_starts_with($trimmed, '+') ? '+' . $digits : $digits;
    }

    private function assertNotFutureDate(string $date): void
    {
        if (strtotime($date) > strtotime(date('Y-m-d'))) {
            throw new \InvalidArgumentException('Date of birth cannot be in the future.');
        }
    }

    private function emailFromClerkUser(array $user): ?string
    {
        $primaryId = $user['primary_email_address_id'] ?? null;

        foreach ($user['email_addresses'] ?? [] as $email) {
            if (($email['id'] ?? null) === $primaryId) {
                return $this->firstNonEmpty($email['email_address'] ?? null);
            }
        }

        return $this->firstNonEmpty($user['email_addresses'][0]['email_address'] ?? null);
    }

    private function phoneFromClerkUser(array $user): ?string
    {
        $primaryId = $user['primary_phone_number_id'] ?? null;

        foreach ($user['phone_numbers'] ?? [] as $phone) {
            if (($phone['id'] ?? null) === $primaryId) {
                return $this->firstNonEmpty($phone['phone_number'] ?? null);
            }
        }

        return $this->firstNonEmpty($user['phone_numbers'][0]['phone_number'] ?? null);
    }

    private function dobFromClerkUser(array $user): ?string
    {
        $publicDob = $user['public_metadata']['dob'] ?? null;
        $privateDob = $user['private_metadata']['dob'] ?? null;
        $unsafeDob = $user['unsafe_metadata']['dob'] ?? null;
        $publicDateOfBirth = $user['public_metadata']['date_of_birth'] ?? null;
        $privateDateOfBirth = $user['private_metadata']['date_of_birth'] ?? null;
        $unsafeDateOfBirth = $user['unsafe_metadata']['date_of_birth'] ?? null;

        return $this->dateValue(
            $this->firstNonEmpty(
                $publicDob,
                $privateDob,
                $unsafeDob,
                $publicDateOfBirth,
                $privateDateOfBirth,
                $unsafeDateOfBirth
            )
        );
    }

    private function nameFromClerkUser(array $user): ?string
    {
        $name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));

        return $this->firstNonEmpty(
            $user['full_name'] ?? null,
            $name,
            $user['username'] ?? null,
            $this->emailFromClerkUser($user)
        );
    }
}
