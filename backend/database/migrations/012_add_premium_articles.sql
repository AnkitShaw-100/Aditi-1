-- Adds the six single premium articles to the catalogue at Rs 50 each.
-- Additive like migration 011: no carts, purchases, or magazines are deleted.
-- Re-runnable.
--
-- The PDF blob is NOT set here. After running this, attach each PDF with:
--   php scripts/import_magazine_pdf.php storage/magazines/<slug>.pdf <slug>

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
VALUES
    ('ADITI-ART-001', 'india-and-the-indian-ocean-potential-and-predominance', 'India and the Indian Ocean: Between Potential and Predominance', 5000, 'INR', 'india-and-the-indian-ocean-potential-and-predominance.pdf', 'application/pdf', 1),
    ('ADITI-ART-002', 'india-infrastructure-development-military-preparedness', 'India''s Infrastructure Development for Military Preparedness: An Overview', 5000, 'INR', 'india-infrastructure-development-military-preparedness.pdf', 'application/pdf', 1),
    ('ADITI-ART-003', 'nuclearisation-deterrent-peace-south-asia', 'Nuclearisation: A Deterrent to Maintain Peace in South Asia', 5000, 'INR', 'nuclearisation-deterrent-peace-south-asia.pdf', 'application/pdf', 1),
    ('ADITI-ART-004', 'indian-joint-special-operations-command-ijsoc', 'Indian Joint Special Operations Command (IJSOC): Imperative to Integrated Theatre Doctrine', 5000, 'INR', 'indian-joint-special-operations-command-ijsoc.pdf', 'application/pdf', 1),
    ('ADITI-ART-005', 'challenge-of-time-defence-capability-capacity-building', 'The Challenge of Time in India''s Defence Capability and Capacity Building', 5000, 'INR', 'challenge-of-time-defence-capability-capacity-building.pdf', 'application/pdf', 1),
    ('ADITI-ART-006', 'indian-navy-evolving-order-of-battle', 'The Indian Navy''s Evolving Order of Battle', 5000, 'INR', 'indian-navy-evolving-order-of-battle.pdf', 'application/pdf', 1)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    price_paise = VALUES(price_paise),
    currency = VALUES(currency),
    pdf_filename = VALUES(pdf_filename),
    is_active = 1;
