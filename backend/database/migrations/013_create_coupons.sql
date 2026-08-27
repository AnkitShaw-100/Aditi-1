-- Contributor coupons.
--
-- A coupon covers one item outright. Razorpay cannot create an order for zero,
-- so a redemption never reaches the gateway: it marks the purchase paid
-- directly and records which code paid for it.

CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,

    -- Which price point the code covers. value_paise is matched against
    -- magazines.price_paise at redemption, so a new issue at the same price
    -- works with existing codes without any change here.
    tier ENUM('magazine', 'article') NOT NULL,
    value_paise INT UNSIGNED NOT NULL,

    -- Lets a whole run be revoked with a single UPDATE if it is ever needed.
    batch VARCHAR(64) NULL,

    status ENUM('active', 'redeemed', 'revoked') NOT NULL DEFAULT 'active',
    redeemed_by_user_id BIGINT UNSIGNED NULL,
    redeemed_magazine_id BIGINT UNSIGNED NULL,
    redeemed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_coupons_redeemed_by_user_id
        FOREIGN KEY (redeemed_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_coupons_redeemed_magazine_id
        FOREIGN KEY (redeemed_magazine_id) REFERENCES magazines(id)
        ON DELETE RESTRICT,

    INDEX idx_coupons_status (status),
    INDEX idx_coupons_batch (batch),
    INDEX idx_coupons_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A purchase paid for by a coupon has razorpay_order_id NULL and coupon_id
-- set, which keeps free and paid purchases distinguishable in reporting.
--
-- MySQL 8 has no ADD COLUMN IF NOT EXISTS (that is MariaDB), so the column and
-- its foreign key are each guarded by an information_schema check. This keeps
-- the migration safe to run twice without relying on syntax the server rejects.

SET @column_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_magazines'
       AND COLUMN_NAME = 'coupon_id'
);

SET @statement := IF(
    @column_exists = 0,
    'ALTER TABLE user_magazines ADD COLUMN coupon_id BIGINT UNSIGNED NULL AFTER razorpay_payment_id',
    'DO 0'
);

PREPARE apply_column FROM @statement;
EXECUTE apply_column;
DEALLOCATE PREPARE apply_column;

SET @constraint_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_magazines'
       AND CONSTRAINT_NAME = 'fk_user_magazines_coupon_id'
);

SET @statement := IF(
    @constraint_exists = 0,
    'ALTER TABLE user_magazines
        ADD CONSTRAINT fk_user_magazines_coupon_id
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL',
    'DO 0'
);

PREPARE apply_constraint FROM @statement;
EXECUTE apply_constraint;
DEALLOCATE PREPARE apply_constraint;
