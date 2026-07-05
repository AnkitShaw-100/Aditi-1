<?php

declare(strict_types=1);

use App\Support\Database;

$config = require __DIR__ . '/../bootstrap.php';

$pdfPath = $argv[1] ?? 'C:/Users/Ankit/Desktop/ADITI Strategy & Defence Magazine.pdf';
$slug = $argv[2] ?? 'aditi-strategy-defence-volume-1-issue-1';
$pdfFilename = $argv[3] ?? basename($pdfPath);

if (!is_file($pdfPath)) {
    fwrite(STDERR, "PDF not found: {$pdfPath}\n");
    exit(1);
}

$pdf = file_get_contents($pdfPath);

if ($pdf === false || $pdf === '') {
    fwrite(STDERR, "Unable to read PDF: {$pdfPath}\n");
    exit(1);
}

$pdo = Database::connect($config['database']);
$statement = $pdo->prepare(
    'UPDATE magazines
     SET pdf_file = :pdf_file,
         pdf_filename = :pdf_filename,
         pdf_mime_type = "application/pdf",
         updated_at = NOW()
     WHERE slug = :slug'
);
$statement->bindValue('pdf_file', $pdf, PDO::PARAM_LOB);
$statement->bindValue('pdf_filename', $pdfFilename);
$statement->bindValue('slug', $slug);
$statement->execute();

if ($statement->rowCount() === 0) {
    fwrite(STDERR, "No magazine row found for slug: {$slug}\n");
    exit(1);
}

printf(
    "Imported %s (%d bytes) into magazine slug %s\n",
    $pdfPath,
    strlen($pdf),
    $slug
);
