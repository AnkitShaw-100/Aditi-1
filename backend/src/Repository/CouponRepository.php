<?php

declare(strict_types=1);

namespace App\Repository;

use PDO;

/**
 * Contributor coupons: single-use codes that cover one item outright.
 *
 * Razorpay cannot create an order for zero, so redemption never reaches the
 * gateway. A redeemed coupon writes a paid row into user_magazines directly,
 * with razorpay_order_id left NULL and coupon_id pointing back at the code.
 */
final class CouponRepository
{
    /**
     * Deliberately excludes O, 0, I and 1. Contributors read these codes off
     * a screenshot or an email and type them by hand.
     */
    private const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const CODE_LENGTH = 6;

    /**
     * A tier is identified by SKU prefix, not by price.
     *
     * Matching on price looked tempting - a magazine is 35000 paise, an
     * article 5000 - but prices are edited. The catalogue has already had
     * magazines dropped to 100 paise for payment testing, which would have
     * left every magazine coupon silently unmatchable. The SKU is what
     * actually says which kind of thing a row is.
     */
    public const TIER_SKU_PREFIX = [
        'magazine' => 'ADITI-MAG-',
        'article' => 'ADITI-ART-',
    ];

    /** Used only when the catalogue holds no item of that tier yet. */
    private const TIER_FALLBACK_PAISE = [
        'magazine' => 35000,
        'article' => 5000,
    ];

    /** Reasons a redemption can fail, for the caller to turn into a message. */
    public const ERROR_UNKNOWN_CODE = 'unknown_code';
    public const ERROR_ALREADY_USED = 'already_used';
    public const ERROR_REVOKED = 'revoked';
    public const ERROR_EMPTY_CART = 'empty_cart';
    public const ERROR_MULTIPLE_ITEMS = 'multiple_items';
    public const ERROR_TIER_MISMATCH = 'tier_mismatch';
    public const ERROR_ALREADY_OWNED = 'already_owned';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * Mints a batch of codes. Retries on the (vanishingly unlikely) collision
     * rather than failing the whole run.
     *
     * @return list<array{code: string, tier: string, value_paise: int}>
     */
    public function generate(string $tier, int $count, ?string $batch = null): array
    {
        if (!isset(self::TIER_SKU_PREFIX[$tier])) {
            throw new \InvalidArgumentException("Unknown coupon tier: {$tier}");
        }

        if ($count < 1) {
            throw new \InvalidArgumentException('Count must be at least 1.');
        }

        // Recorded for reporting only - redemption matches on SKU, so a later
        // price change does not strand codes already in contributors' hands.
        $valuePaise = $this->currentTierPricePaise($tier);
        $prefix = $tier === 'magazine' ? 'ADITI-MAG-' : 'ADITI-ART-';

        $statement = $this->pdo->prepare(
            'INSERT INTO coupons (code, tier, value_paise, batch)
             VALUES (:code, :tier, :value_paise, :batch)'
        );

        $created = [];

        while (count($created) < $count) {
            $code = $prefix . $this->randomCode();

            try {
                $statement->execute([
                    'code' => $code,
                    'tier' => $tier,
                    'value_paise' => $valuePaise,
                    'batch' => $batch,
                ]);
            } catch (\PDOException $exception) {
                // 23000 is the integrity constraint violation - a duplicate
                // code. Draw another one.
                if ($exception->getCode() === '23000') {
                    continue;
                }

                throw $exception;
            }

            $created[] = [
                'code' => $code,
                'tier' => $tier,
                'value_paise' => $valuePaise,
            ];
        }

        return $created;
    }

    public function findByCode(string $code): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, code, tier, value_paise, batch, status,
                    redeemed_by_user_id, redeemed_magazine_id, redeemed_at
             FROM coupons
             WHERE code = :code
             LIMIT 1'
        );
        $statement->execute(['code' => $this->normalise($code)]);

        $coupon = $statement->fetch();

        return $coupon === false ? null : $coupon;
    }

    /**
     * Redeems a code against the single item in the user's cart.
     *
     * Returns ['ok' => true, ...] on success, or ['ok' => false, 'error' =>
     * <one of the ERROR_* constants>, ...] with enough context for the caller
     * to write a specific message.
     *
     * @param array{id: int} $user      the local users row
     * @param list<array>    $cartItems the user's current cart
     */
    public function redeem(string $code, array $user, array $cartItems): array
    {
        $coupon = $this->findByCode($code);

        if ($coupon === null) {
            return ['ok' => false, 'error' => self::ERROR_UNKNOWN_CODE];
        }

        if ($coupon['status'] === 'redeemed') {
            return ['ok' => false, 'error' => self::ERROR_ALREADY_USED];
        }

        if ($coupon['status'] !== 'active') {
            return ['ok' => false, 'error' => self::ERROR_REVOKED];
        }

        if ($cartItems === []) {
            return ['ok' => false, 'error' => self::ERROR_EMPTY_CART, 'coupon' => $coupon];
        }

        // A coupon covers exactly one item. Allowing a mixed cart would mean
        // an order that is part coupon and part payment, and a failed payment
        // would leave the code in limbo.
        if (count($cartItems) > 1) {
            return ['ok' => false, 'error' => self::ERROR_MULTIPLE_ITEMS, 'coupon' => $coupon];
        }

        $item = $cartItems[0];

        if (!$this->itemMatchesTier($item, (string) $coupon['tier'])) {
            return [
                'ok' => false,
                'error' => self::ERROR_TIER_MISMATCH,
                'coupon' => $coupon,
                'item' => $item,
            ];
        }

        if ($this->userOwns((int) $user['id'], (int) $item['id'])) {
            return [
                'ok' => false,
                'error' => self::ERROR_ALREADY_OWNED,
                'coupon' => $coupon,
                'item' => $item,
            ];
        }

        return $this->claim($coupon, $user, $item);
    }

    /**
     * The atomic half of redemption.
     *
     * The code is claimed with a conditional UPDATE rather than a read
     * followed by a write, so two people racing the same code cannot both
     * win: whoever's UPDATE matches the still-active row gets it, and the
     * other sees zero affected rows.
     */
    private function claim(array $coupon, array $user, array $item): array
    {
        $this->pdo->beginTransaction();

        try {
            $claim = $this->pdo->prepare(
                'UPDATE coupons
                    SET status = "redeemed",
                        redeemed_by_user_id = :user_id,
                        redeemed_magazine_id = :magazine_id,
                        redeemed_at = NOW()
                  WHERE code = :code
                    AND status = "active"'
            );
            $claim->execute([
                'user_id' => $user['id'],
                'magazine_id' => $item['id'],
                'code' => $coupon['code'],
            ]);

            if ($claim->rowCount() === 0) {
                $this->pdo->rollBack();

                return ['ok' => false, 'error' => self::ERROR_ALREADY_USED];
            }

            $purchase = $this->pdo->prepare(
                'INSERT INTO user_magazines
                        (user_id, magazine_id, razorpay_order_id, razorpay_payment_id,
                         coupon_id, status, purchased_at)
                 VALUES (:user_id, :magazine_id, NULL, NULL,
                         :coupon_id, "paid", NOW())'
            );
            $purchase->execute([
                'user_id' => $user['id'],
                'magazine_id' => $item['id'],
                'coupon_id' => $coupon['id'],
            ]);

            // The item has been granted, so it should not still be sitting in
            // the cart waiting to be paid for.
            $clear = $this->pdo->prepare(
                'DELETE FROM user_cart_items
                  WHERE user_id = :user_id AND magazine_id = :magazine_id'
            );
            $clear->execute([
                'user_id' => $user['id'],
                'magazine_id' => $item['id'],
            ]);

            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $exception;
        }

        return [
            'ok' => true,
            'coupon' => $coupon,
            'item' => $item,
        ];
    }

    /** True when the cart item is the kind of thing this tier's codes cover. */
    public function itemMatchesTier(array $item, string $tier): bool
    {
        $prefix = self::TIER_SKU_PREFIX[$tier] ?? null;

        if ($prefix === null) {
            return false;
        }

        return str_starts_with((string) ($item['sku'] ?? ''), $prefix);
    }

    /**
     * What an item of this tier currently costs, for recording on the coupon.
     * Falls back to the catalogue's intended price if the tier is empty.
     */
    public function currentTierPricePaise(string $tier): int
    {
        $prefix = self::TIER_SKU_PREFIX[$tier] ?? null;

        if ($prefix === null) {
            throw new \InvalidArgumentException("Unknown coupon tier: {$tier}");
        }

        $statement = $this->pdo->prepare(
            'SELECT price_paise FROM magazines
             WHERE sku LIKE :prefix AND is_active = 1
             ORDER BY id LIMIT 1'
        );
        $statement->execute(['prefix' => $prefix . '%']);
        $price = $statement->fetchColumn();

        return $price === false
            ? self::TIER_FALLBACK_PAISE[$tier]
            : (int) $price;
    }

    public function userOwns(int $userId, int $magazineId): bool
    {
        $statement = $this->pdo->prepare(
            'SELECT 1
             FROM user_magazines
             WHERE user_id = :user_id
               AND magazine_id = :magazine_id
               AND status = "paid"
             LIMIT 1'
        );
        $statement->execute([
            'user_id' => $userId,
            'magazine_id' => $magazineId,
        ]);

        return $statement->fetchColumn() !== false;
    }

    /**
     * Every code with who redeemed it, for the admin dashboard.
     */
    public function listAll(int $limit = 500): array
    {
        $limit = max(1, min($limit, 2000));

        $statement = $this->pdo->query(
            'SELECT c.id, c.code, c.tier, c.value_paise, c.batch, c.status,
                    c.redeemed_at, c.created_at,
                    u.email AS redeemed_by_email,
                    u.username AS redeemed_by_username,
                    m.title AS redeemed_magazine_title,
                    m.slug AS redeemed_magazine_slug
             FROM coupons c
             LEFT JOIN users u ON u.id = c.redeemed_by_user_id
             LEFT JOIN magazines m ON m.id = c.redeemed_magazine_id
             ORDER BY c.created_at DESC, c.id DESC
             LIMIT ' . $limit
        );

        return $statement->fetchAll();
    }

    /**
     * Counts by tier and status, so the admin tab can show "14 of 20 left"
     * without the client tallying rows itself.
     */
    public function summary(): array
    {
        $statement = $this->pdo->query(
            'SELECT tier, status, COUNT(*) AS total
             FROM coupons
             GROUP BY tier, status'
        );

        $summary = [];

        foreach ($statement->fetchAll() as $row) {
            $summary[$row['tier']][$row['status']] = (int) $row['total'];
        }

        return $summary;
    }

    /** Codes are stored and compared uppercase, with surrounding space ignored. */
    public function normalise(string $code): string
    {
        return strtoupper(trim($code));
    }

    private function randomCode(): string
    {
        $alphabet = self::CODE_ALPHABET;
        $max = strlen($alphabet) - 1;
        $code = '';

        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $code .= $alphabet[random_int(0, $max)];
        }

        return $code;
    }
}
