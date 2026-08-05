-- Adds Volume 1, Issue 2 to the catalogue alongside the inaugural issue.
-- Unlike migration 004 this is additive: no carts, purchases, or magazines are deleted.
-- Re-runnable.

INSERT INTO magazines (
    sku,
    slug,
    title,
    price_paise,
    currency,
    pdf_filename,
    pdf_mime_type,
    is_active
)
VALUES (
    'ADITI-MAG-V1-I2',
    'aditi-strategy-defence-volume-1-issue-2',
    'ADITI Strategy & Defence Magazine - Volume 1, Issue 2: Forging the Republic''s Power',
    35000,
    'INR',
    'ADITI-Strategy-Defence-Magazine-Volume-1-Issue-2.pdf',
    'application/pdf',
    1
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    price_paise = VALUES(price_paise),
    currency = VALUES(currency),
    pdf_filename = VALUES(pdf_filename),
    is_active = 1;
