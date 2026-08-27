<?php

declare(strict_types=1);

require_once __DIR__ . '/src/Support/Env.php';
require_once __DIR__ . '/src/Support/Database.php';
require_once __DIR__ . '/src/Http/Request.php';
require_once __DIR__ . '/src/Http/Response.php';
require_once __DIR__ . '/src/Auth/ClerkJwtVerifier.php';
require_once __DIR__ . '/src/Auth/ClerkUserClient.php';
require_once __DIR__ . '/src/Auth/SvixWebhookVerifier.php';
require_once __DIR__ . '/src/Mail/Mailer.php';
require_once __DIR__ . '/src/Repository/AdminRepository.php';
require_once __DIR__ . '/src/Repository/UserRepository.php';
require_once __DIR__ . '/src/Repository/CouponRepository.php';

App\Support\Env::load(__DIR__ . '/.env');

return require __DIR__ . '/config/app.php';
