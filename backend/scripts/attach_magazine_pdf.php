<?php

declare(strict_types=1);

use App\Support\Database;

/**
 * Attaches a magazine PDF by FILE instead of loading it into the database.
 *
 * Use this for large issues. The file is copied into the configured magazine
 * storage directory and only its filename is stored in magazines.pdf_path, so
 * nothing large travels through MySQL. The download route streams it off disk.
 *
 * Usage:
 *   php scripts/attach_magazine_pdf.php <pdf-path> <slug> [stored-filename]
 */

$config = require __DIR__ . '/../bootstrap.php';

$pdfPath = $argv[1] ?? null;
$slug = $argv[2] ?? null;

if ($pdfPath === null || $slug === null) {
    fwrite(STDERR, "Usage: php scripts/attach_magazine_pdf.php <pdf-path> <slug> [stored-filename]\n");
    exit(1);
}

if (!is_file($pdfPath)) {
    fwrite(STDERR, "PDF not found: {$pdfPath}\n");
    exit(1);
}

$storedName = basename($argv[3] ?? basename($pdfPath));
$storedName = preg_replace('/[^A-Za-z0-9._-]+/', '-', $storedName) ?: 'magazine.pdf';

if (!str_ends_with(strtolower($storedName), '.pdf')) {
    $storedName .= '.pdf';
}

$storageDir = (string) $config['magazines']['storage_path'];

if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
    fwrite(STDERR, "Unable to create storage directory: {$storageDir}\n");
    exit(1);
}

$target = $storageDir . DIRECTORY_SEPARATOR . $storedName;

if (realpath($pdfPath) !== realpath($target) && !copy($pdfPath, $target)) {
    fwrite(STDERR, "Unable to copy PDF into {$target}\n");
    exit(1);
}

$pdo = Database::connect($config['database']);
$statement = $pdo->prepare(
    'UPDATE magazines
     SET pdf_path = :pdf_path,
         pdf_file = NULL,
         pdf_filename = :pdf_filename,
         pdf_mime_type = "application/pdf",
         updated_at = NOW()
     WHERE slug = :slug'
);
$statement->execute([
    'pdf_path' => $storedName,
    'pdf_filename' => $storedName,
    'slug' => $slug,
]);

if ($statement->rowCount() === 0) {
    fwrite(STDERR, "No magazine row found for slug: {$slug}\n");
    exit(1);
}

printf(
    "Attached %s (%.1f MB) to magazine slug %s\n",
    $target,
    filesize($target) / 1048576,
    $slug
);
