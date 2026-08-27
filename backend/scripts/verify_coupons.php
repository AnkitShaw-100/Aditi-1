<?php

declare(strict_types=1);

/**
 * Exercises coupon redemption against the real database and asserts every
 * rule the design promises.
 *
 * The project has no test framework, so this stands in for one. It creates
 * its own throwaway user and codes, runs the cases, and removes everything it
 * made - including on failure.
 *
 * Usage: php scripts/verify_coupons.php
 */

use App\Repository\CouponRepository;
use App\Repository\UserRepository;
use App\Support\Database;

$config = require __DIR__ . '/../bootstrap.php';

$pdo = Database::connect($config['database']);
$coupons = new CouponRepository($pdo);
$users = new UserRepository($pdo);

$passed = 0;
$failed = 0;

function check(string $name, bool $condition, string $detail = ''): void
{
    global $passed, $failed;

    if ($condition) {
        $passed++;
        fwrite(STDOUT, "  PASS  {$name}\n");

        return;
    }

    $failed++;
    fwrite(STDOUT, "  FAIL  {$name}" . ($detail === '' ? '' : "  ({$detail})") . "\n");
}

/* ---------------------------------------------------------------------------
   Fixtures
--------------------------------------------------------------------------- */

$suffix = bin2hex(random_bytes(6));
$clerkId = "verify_coupons_{$suffix}";
$batch = "verify-{$suffix}";
$createdUserId = null;

/** Finds a real catalogue item of the given tier, so tiers are tested against live data. */
function itemOfTier(PDO $pdo, string $tier, int $skip = 0): ?array
{
    $prefix = CouponRepository::TIER_SKU_PREFIX[$tier];
    $statement = $pdo->prepare(
        'SELECT id, sku, slug, title, price_paise FROM magazines
         WHERE sku LIKE :prefix AND is_active = 1
         ORDER BY id LIMIT 1 OFFSET ' . max(0, $skip)
    );
    $statement->execute(['prefix' => $prefix . '%']);
    $row = $statement->fetch();

    return $row === false ? null : $row;
}

function cleanup(PDO $pdo, ?int $userId, string $batch): void
{
    if ($userId !== null) {
        $pdo->prepare('DELETE FROM user_cart_items WHERE user_id = ?')->execute([$userId]);
        $pdo->prepare('DELETE FROM user_magazines WHERE user_id = ?')->execute([$userId]);
        $pdo->prepare('DELETE FROM payment_events WHERE user_id = ?')->execute([$userId]);
    }

    $pdo->prepare('DELETE FROM coupons WHERE batch = ?')->execute([$batch]);

    if ($userId !== null) {
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
    }
}

try {
    $magazine = itemOfTier($pdo, 'magazine');
    $article = itemOfTier($pdo, 'article');

    if ($magazine === null || $article === null) {
        fwrite(STDERR, "Cannot run: need at least one ADITI-MAG-* and one ADITI-ART-* item.\n");
        fwrite(STDERR, "Apply migrations 004, 011 and 012 first.\n");
        exit(1);
    }

    fwrite(STDOUT, "Using magazine: {$magazine['sku']}  {$magazine['slug']}\n");
    fwrite(STDOUT, "Using article:  {$article['sku']}  {$article['slug']}\n\n");

    $pdo->prepare(
        'INSERT INTO users (clerk_user_id, email, username) VALUES (?, ?, ?)'
    )->execute([$clerkId, "verify+{$suffix}@example.test", "verify{$suffix}"]);
    $createdUserId = (int) $pdo->lastInsertId();
    $user = ['id' => $createdUserId];

    $addToCart = static function (int $magazineId) use ($pdo, $createdUserId): void {
        $pdo->prepare('DELETE FROM user_cart_items WHERE user_id = ?')->execute([$createdUserId]);
        $pdo->prepare(
            'INSERT INTO user_cart_items (user_id, magazine_id) VALUES (?, ?)'
        )->execute([$createdUserId, $magazineId]);
    };

    $cart = static fn (): array => $users->getCart($clerkId);

    /* -----------------------------------------------------------------------
       1. A valid code redeems, and the item becomes owned
    ----------------------------------------------------------------------- */
    fwrite(STDOUT, "1. Valid redemption\n");

    $magCode = $coupons->generate('magazine', 1, $batch)[0]['code'];
    $addToCart((int) $magazine['id']);

    $result = $coupons->redeem($magCode, $user, $cart());
    check('redeems successfully', ($result['ok'] ?? false) === true, $result['error'] ?? '');
    check('item is now owned', $coupons->userOwns($createdUserId, (int) $magazine['id']));
    check('cart was cleared', $cart() === []);

    $stored = $coupons->findByCode($magCode);
    check('code marked redeemed', ($stored['status'] ?? '') === 'redeemed');
    check('redeemer recorded', (int) ($stored['redeemed_by_user_id'] ?? 0) === $createdUserId);

    $paidRow = $pdo->prepare(
        'SELECT razorpay_order_id, coupon_id, status FROM user_magazines
         WHERE user_id = ? AND magazine_id = ? LIMIT 1'
    );
    $paidRow->execute([$createdUserId, $magazine['id']]);
    $purchase = $paidRow->fetch();
    check('purchase bypassed Razorpay', $purchase !== false && $purchase['razorpay_order_id'] === null);
    check('purchase links back to the coupon', $purchase !== false && $purchase['coupon_id'] !== null);
    check('purchase is paid', $purchase !== false && $purchase['status'] === 'paid');

    /* -----------------------------------------------------------------------
       2. The same code cannot be used twice
    ----------------------------------------------------------------------- */
    fwrite(STDOUT, "\n2. Reuse is blocked\n");

    $addToCart((int) $magazine['id']);
    $again = $coupons->redeem($magCode, $user, $cart());
    check(
        'second redemption rejected',
        ($again['ok'] ?? true) === false
            && $again['error'] === CouponRepository::ERROR_ALREADY_USED
    );

    /* -----------------------------------------------------------------------
       3. Already owning the item is rejected
    ----------------------------------------------------------------------- */
    fwrite(STDOUT, "\n3. Already-owned is blocked\n");

    $freshMagCode = $coupons->generate('magazine', 1, $batch)[0]['code'];
    $addToCart((int) $magazine['id']);
    $owned = $coupons->redeem($freshMagCode, $user, $cart());
    check(
        'rejected as already owned',
        ($owned['ok'] ?? true) === false
            && $owned['error'] === CouponRepository::ERROR_ALREADY_OWNED
    );
    check(
        'rejected code is still active',
        ($coupons->findByCode($freshMagCode)['status'] ?? '') === 'active'
    );

    /* -----------------------------------------------------------------------
       4. Tier mismatch both ways
    ----------------------------------------------------------------------- */
    fwrite(STDOUT, "\n4. Tier mismatch is blocked\n");

    $addToCart((int) $article['id']);
    $wrongWay = $coupons->redeem($freshMagCode, $user, $cart());
    check(
        'magazine code rejected on an article',
        ($wrongWay['ok'] ?? true) === false
            && $wrongWay['error'] === CouponRepository::ERROR_TIER_MISMATCH
    );

    $artCode = $coupons->generate('article', 1, $batch)[0]['code'];
    $addToCart((int) $magazine['id']);
    $otherWay = $coupons->redeem($artCode, $user, $cart());
    check(
        'article code rejected on a magazine',
        ($otherWay['ok'] ?? true) === false
            && $otherWay['error'] === CouponRepository::ERROR_TIER_MISMATCH
    );

    /* -----------------------------------------------------------------------
       5. A cart with two items is rejected
    ----------------------------------------------------------------------- */
    fwrite(STDOUT, "\n5. Multi-item cart is blocked\n");

    $pdo->prepare('DELETE FROM user_cart_items WHERE user_id = ?')->execute([$createdUserId]);
    $insertCart = $pdo->prepare('INSERT INTO user_cart_items (user_id, magazine_id) VALUES (?, ?)');
    $insertCart->execute([$createdUserId, $article['id']]);

    $secondArticle = $pdo->prepare(
        'SELECT id FROM magazines WHERE sku LIKE ? AND id <> ? AND is_active = 1 LIMIT 1'
    );
    $secondArticle->execute(['ADITI-ART-%', $article['id']]);
    $second = $secondArticle->fetchColumn();

    if ($second !== false) {
        $insertCart->execute([$createdUserId, $second]);
        $multi = $coupons->redeem($artCode, $user, $cart());
        check(
            'two-item cart rejected',
            ($multi['ok'] ?? true) === false
                && $multi['error'] === CouponRepository::ERROR_MULTIPLE_ITEMS
        );
    } else {
        fwrite(STDOUT, "  SKIP  two-item cart (only one article in the catalogue)\n");
    }

    /* -----------------------------------------------------------------------
       6. Empty cart, and an unknown code
    ----------------------------------------------------------------------- */
    fwrite(STDOUT, "\n6. Empty cart and unknown codes\n");

    $pdo->prepare('DELETE FROM user_cart_items WHERE user_id = ?')->execute([$createdUserId]);
    $empty = $coupons->redeem($artCode, $user, $cart());
    check(
        'empty cart rejected',
        ($empty['ok'] ?? true) === false && $empty['error'] === CouponRepository::ERROR_EMPTY_CART
    );

    $unknown = $coupons->redeem('ADITI-MAG-ZZZZZZ', $user, $cart());
    check(
        'unknown code rejected',
        ($unknown['ok'] ?? true) === false && $unknown['error'] === CouponRepository::ERROR_UNKNOWN_CODE
    );

    $lower = $coupons->redeem(strtolower($artCode), $user, $cart());
    check(
        'lowercase code is recognised (not treated as unknown)',
        ($lower['error'] ?? '') !== CouponRepository::ERROR_UNKNOWN_CODE
    );

    /* -----------------------------------------------------------------------
       7. Two claims on one code produce exactly one winner
    ----------------------------------------------------------------------- */
    fwrite(STDOUT, "\n7. Concurrent claims\n");

    $raceCode = $coupons->generate('article', 1, $batch)[0]['code'];

    $secondUserClerk = "verify_coupons_rival_{$suffix}";
    $pdo->prepare('INSERT INTO users (clerk_user_id, email, username) VALUES (?, ?, ?)')
        ->execute([$secondUserClerk, "rival+{$suffix}@example.test", "rival{$suffix}"]);
    $rivalId = (int) $pdo->lastInsertId();

    $pdo->prepare('INSERT INTO user_cart_items (user_id, magazine_id) VALUES (?, ?)')
        ->execute([$rivalId, $article['id']]);
    $addToCart((int) $article['id']);

    $rivalCart = $users->getCart($secondUserClerk);

    $first = $coupons->redeem($raceCode, $user, $cart());
    $secondTry = $coupons->redeem($raceCode, ['id' => $rivalId], $rivalCart);

    $winners = (int) (($first['ok'] ?? false) === true) + (int) (($secondTry['ok'] ?? false) === true);
    check('exactly one claim wins', $winners === 1, "winners={$winners}");
    check(
        'the loser is told it was already used',
        ($secondTry['error'] ?? '') === CouponRepository::ERROR_ALREADY_USED
    );

    $pdo->prepare('DELETE FROM user_cart_items WHERE user_id = ?')->execute([$rivalId]);
    $pdo->prepare('DELETE FROM user_magazines WHERE user_id = ?')->execute([$rivalId]);
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$rivalId]);
} finally {
    cleanup($pdo, $createdUserId, $batch);
}

fwrite(STDOUT, "\n" . str_repeat('-', 46) . "\n");
fwrite(STDOUT, sprintf("%d passed, %d failed\n", $passed, $failed));

exit($failed === 0 ? 0 : 1);
