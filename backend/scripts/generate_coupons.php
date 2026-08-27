<?php

declare(strict_types=1);

/**
 * Mints contributor coupon codes and prints them as CSV.
 *
 * Usage:
 *   php scripts/generate_coupons.php --magazine 20 --article 30 --batch contributors-issue-2
 *   php scripts/generate_coupons.php --magazine 5 > codes.csv
 *
 * Codes are written to the database as they are generated, so a run that is
 * interrupted leaves behind whatever it had already created - none of it is
 * lost, and re-running only adds more.
 */

use App\Repository\CouponRepository;
use App\Support\Database;

$config = require __DIR__ . '/../bootstrap.php';

// Single colon, not double: PHP's getopt only accepts "--flag value" for
// options declared as requiring a value. With "::" it silently ignores
// anything not written as "--flag=value".
$options = getopt('', ['magazine:', 'article:', 'batch:', 'help']);

if (isset($options['help'])) {
    fwrite(STDOUT, <<<TEXT
    Generate contributor coupon codes.

      --magazine N   number of magazine codes (covers a 350 rupee issue)
      --article N    number of article codes (covers a 50 rupee article)
      --batch NAME   optional label, so a whole run can be revoked later
      --help         show this

    Example:
      php scripts/generate_coupons.php --magazine 20 --article 30 --batch contributors-issue-2

    TEXT);
    exit(0);
}

$magazineCount = (int) ($options['magazine'] ?? 0);
$articleCount = (int) ($options['article'] ?? 0);
$batch = isset($options['batch']) && $options['batch'] !== ''
    ? (string) $options['batch']
    : null;

if ($magazineCount < 1 && $articleCount < 1) {
    fwrite(STDERR, "Nothing to do. Pass --magazine N and/or --article N (--help for details).\n");
    exit(1);
}

$pdo = Database::connect($config['database']);
$coupons = new CouponRepository($pdo);

$created = [];

if ($magazineCount > 0) {
    $created = array_merge($created, $coupons->generate('magazine', $magazineCount, $batch));
}

if ($articleCount > 0) {
    $created = array_merge($created, $coupons->generate('article', $articleCount, $batch));
}

// CSV on stdout so it can be piped straight to a file; the human-readable
// tally goes to stderr so it never contaminates that file.
fwrite(STDOUT, "code,tier,value_rupees,batch\n");

foreach ($created as $coupon) {
    fwrite(STDOUT, sprintf(
        "%s,%s,%d,%s\n",
        $coupon['code'],
        $coupon['tier'],
        intdiv($coupon['value_paise'], 100),
        $batch ?? ''
    ));
}

fwrite(STDERR, sprintf(
    "\nCreated %d code%s%s: %d magazine, %d article.\n",
    count($created),
    count($created) === 1 ? '' : 's',
    $batch === null ? '' : " in batch \"{$batch}\"",
    $magazineCount,
    $articleCount
));
