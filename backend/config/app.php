<?php

declare(strict_types=1);

use App\Support\Env;

$appEnv = Env::get('APP_ENV', 'production');
$forceHttps = Env::bool('FORCE_HTTPS', $appEnv === 'production');

return [
    'app' => [
        'env' => $appEnv,
        'debug' => $appEnv === 'local' && Env::bool('APP_DEBUG', false),
        'url' => Env::get('APP_URL', 'http://localhost:8080'),
        'frontend_url' => Env::get('FRONTEND_URL', 'http://localhost:5173'),
        'cors_allowed_origins' => Env::csv('CORS_ALLOWED_ORIGINS', ['http://localhost:5173']),
        'force_https' => $forceHttps,
        'admin_cookie_name' => Env::get('ADMIN_COOKIE_NAME', 'aditi_admin'),
        'admin_cookie_secure' => Env::bool('ADMIN_COOKIE_SECURE', $forceHttps),
        'admin_cookie_samesite' => Env::get('ADMIN_COOKIE_SAMESITE', 'Lax'),
    ],
    'database' => [
        'host' => Env::get('DB_HOST', '127.0.0.1'),
        'port' => Env::int('DB_PORT', 3306),
        'database' => Env::get('DB_DATABASE', 'aditi'),
        'username' => Env::get('DB_USERNAME', 'root'),
        'password' => Env::get('DB_PASSWORD', ''),
        'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
    ],
    'magazines' => [
        // Directory holding the paid issue PDFs. Keep it OUTSIDE the web root:
        // files are streamed by the download route only after a paid check.
        'storage_path' => rtrim(
            Env::get('MAGAZINE_STORAGE_PATH', __DIR__ . '/../storage/magazines'),
            "/\\"
        ),
    ],
    'clerk' => [
        'jwks_url' => Env::get('CLERK_JWKS_URL', 'https://api.clerk.com/v1/jwks'),
        'issuer' => Env::get('CLERK_ISSUER', ''),
        'authorized_parties' => Env::csv('CLERK_AUTHORIZED_PARTIES', []),
        'secret_key' => Env::get('CLERK_SECRET_KEY', ''),
        'webhook_secret' => Env::get('CLERK_WEBHOOK_SECRET', ''),
        'jwks_cache_file' => __DIR__ . '/../storage/cache/clerk_jwks.json',
        'jwks_cache_ttl_seconds' => 3600,
    ],
    'razorpay' => [
        'key_id' => Env::get('RAZORPAY_KEY_ID', ''),
        'key_secret' => Env::get('RAZORPAY_KEY_SECRET', ''),
        'webhook_secret' => Env::get('RAZORPAY_WEBHOOK_SECRET', ''),
    ],
    'mail' => [
        'enabled' => Env::bool('MAIL_ENABLED', false),
        'mailer' => Env::get('MAIL_MAILER', 'mail'),
        'host' => Env::get('MAIL_HOST', ''),
        'port' => Env::int('MAIL_PORT', 587),
        'username' => Env::get('MAIL_USERNAME', ''),
        'password' => Env::get('MAIL_PASSWORD', ''),
        'encryption' => Env::get('MAIL_ENCRYPTION', 'tls'),
        'from_address' => Env::get('MAIL_FROM_ADDRESS', ''),
        'from_name' => Env::get('MAIL_FROM_NAME', 'ADITI'),
    ],
];
