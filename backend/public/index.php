<?php

declare(strict_types=1);

use App\Auth\ClerkJwtVerifier;
use App\Auth\ClerkUserClient;
use App\Auth\SvixWebhookVerifier;
use App\Http\Request;
use App\Http\Response;
use App\Mail\Mailer;
use App\Repository\AdminRepository;
use App\Repository\UserRepository;
use App\Support\Database;

$config = require __DIR__ . '/../bootstrap.php';

set_exception_handler(function (Throwable $exception) use ($config): void {
    $payload = ['error' => 'Server error'];

    if ($config['app']['debug']) {
        $payload['message'] = $exception->getMessage();
        $payload['trace'] = explode("\n", $exception->getTraceAsString());
    }

    Response::json($payload, 500);
});

$request = Request::capture();
Response::cors($config['app']['cors_allowed_origins'], $request);
Response::securityHeaders($config['app'], $request);

if (($config['app']['force_https'] ?? false) === true && !$request->isHttps()) {
    if ($request->method() === 'GET') {
        header('Location: ' . preg_replace('#^http:#', 'https:', $request->fullUrl()), true, 308);
        exit;
    }

    Response::json(['error' => 'HTTPS is required'], 403);
}

if ($request->method() === 'OPTIONS') {
    Response::empty(204);
}

$route = $request->method() . ' ' . $request->path();

if ($route === 'GET /api/health') {
    Response::json([
        'status' => 'ok',
        'service' => 'aditi-backend',
    ]);
}

$pdo = Database::connect($config['database']);
$admins = new AdminRepository($pdo);
$users = new UserRepository($pdo);
$mailer = new Mailer($config['mail']);

if ($route === 'POST /api/issue-reservations') {
    $body = $request->body();
    $email = $body['email'] ?? '';
    $issueSlug = $body['issue_slug'] ?? 'issue-ii-forging-the-republics-power';
    $source = $body['source'] ?? 'landing';
    $honeypot = $body['website'] ?? '';

    if (is_string($honeypot) && trim($honeypot) !== '') {
        Response::json(['message' => 'Reserved. You will hear first when Issue II opens.']);
    }

    if (!is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::json(['error' => 'A valid email address is required'], 422);
    }

    if (!is_string($issueSlug) || trim($issueSlug) === '') {
        $issueSlug = 'issue-ii-forging-the-republics-power';
    }

    if (!is_string($source) || trim($source) === '') {
        $source = 'landing';
    }

    $email = strtolower(trim($email));
    $issueSlug = substr(trim($issueSlug), 0, 120);
    $source = substr(trim($source), 0, 120);
    $userAgent = substr((string) ($request->header('User-Agent') ?? ''), 0, 500);

    $statement = $pdo->prepare(
        'INSERT INTO issue_reservations (email, issue_slug, source, ip_address, user_agent)
         VALUES (:email, :issue_slug, :source, :ip_address, :user_agent)
         ON DUPLICATE KEY UPDATE
            source = VALUES(source),
            ip_address = VALUES(ip_address),
            user_agent = VALUES(user_agent),
            updated_at = CURRENT_TIMESTAMP'
    );
    $statement->execute([
        'email' => $email,
        'issue_slug' => $issueSlug,
        'source' => $source,
        'ip_address' => $request->ip(),
        'user_agent' => $userAgent,
    ]);

    Response::json([
        'message' => 'Reserved. You will hear first when Issue II opens.',
    ], 201);
}

if ($route === 'POST /api/admin/login') {
    $body = $request->body();
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';

    if (!is_string($email) || !is_string($password)) {
        Response::json(['error' => 'Email and password are required'], 422);
    }

    $session = $admins->login($email, $password);

    if ($session === null) {
        Response::json(['error' => 'Invalid admin credentials'], 401);
    }

    issueAdminCookie($session['token'], $session['expires_at']);

    Response::json([
        'expires_at' => $session['expires_at'],
        'admin' => $session['admin'],
    ]);
}

if ($route === 'GET /api/admin/users') {
    requireAdmin($request, $admins);

    Response::json([
        'users' => $admins->listUsers(),
    ]);
}

if ($route === 'GET /api/admin/payments') {
    requireAdmin($request, $admins);

    Response::json([
        'orders' => $admins->listPaymentOrders(),
        'events' => $admins->listPaymentEvents(),
    ]);
}

if ($route === 'GET /api/admin/issue-reservations') {
    requireAdmin($request, $admins);

    $statement = $pdo->query(
        'SELECT id, email, issue_slug, source, ip_address, user_agent, created_at, updated_at
         FROM issue_reservations
         ORDER BY created_at DESC
         LIMIT 500'
    );

    Response::json([
        'reservations' => $statement->fetchAll(),
    ]);
}

if ($route === 'POST /api/admin/payments/recover') {
    requireAdmin($request, $admins);
    $body = $request->body();
    $orderId = $body['razorpay_order_id'] ?? null;
    $razorpay = $config['razorpay'];

    if (!is_string($orderId) || trim($orderId) === '') {
        Response::json(['error' => 'razorpay_order_id is required'], 422);
    }

    if ($razorpay['key_id'] === '' || $razorpay['key_secret'] === '') {
        Response::json(['error' => 'Razorpay keys are not configured'], 500);
    }

    $orderId = trim($orderId);
    $paymentState = razorpayPaymentStateForOrder($razorpay, $orderId);
    $result = ['matched' => false];

    if ($paymentState['status'] === 'paid') {
        $result = $users->markRazorpayOrderPaidByOrderId($orderId, $paymentState['payment_id']);
        sendReceiptEmailForOrder($users, $mailer, $config, $orderId);
    }

    if ($paymentState['status'] === 'failed') {
        $result = $users->markRazorpayOrderFailedByOrderId($orderId, $paymentState['payment_id']);
    }

    recordPaymentEventSafe(
        $users,
        null,
        $orderId,
        $paymentState['payment_id'],
        'admin',
        'manual_recovery',
        $paymentState['status'],
        $result['matched'] ? 'Admin recovery matched local order.' : 'Admin recovery checked Razorpay but no local order matched.',
        $paymentState
    );

    Response::json([
        'message' => $result['matched']
            ? 'Payment status recovered from Razorpay.'
            : 'Razorpay was checked, but no matching local order was updated.',
        'matched' => $result['matched'],
        'payment_state' => $paymentState,
        'orders' => $admins->listPaymentOrders(),
        'events' => $admins->listPaymentEvents(),
    ]);
}

if ($route === 'POST /api/admin/logout') {
    $admins->logout(adminTokenFromRequest($request));
    clearAdminCookie();

    Response::json(['message' => 'Logged out']);
}

if ($route === 'POST /api/webhooks/clerk') {
    $webhookVerifier = new SvixWebhookVerifier($config['clerk']['webhook_secret']);

    try {
        $webhookVerifier->verify(
            $request->rawBody(),
            $request->header('svix-id'),
            $request->header('svix-timestamp'),
            $request->header('svix-signature')
        );
    } catch (Throwable $exception) {
        Response::json(['error' => 'Invalid webhook signature'], 401);
    }

    $event = $request->body();
    $type = $event['type'] ?? '';
    $data = $event['data'] ?? [];

    if (!is_array($data)) {
        Response::json(['error' => 'Invalid webhook payload'], 400);
    }

    if ($type === 'user.created' || $type === 'user.updated') {
        $user = $users->upsertUserFromClerkWebhook($data);

        Response::json([
            'message' => 'Clerk user synced',
            'type' => $type,
            'user' => $user,
        ]);
    }

    if ($type === 'user.deleted') {
        $clerkUserId = $data['id'] ?? null;

        if (is_string($clerkUserId) && $clerkUserId !== '') {
            $users->deleteUserFromClerkWebhook($clerkUserId);
        }

        Response::json([
            'message' => 'Clerk user deleted',
            'type' => $type,
        ]);
    }

    Response::json([
        'message' => 'Webhook ignored',
        'type' => $type,
    ]);
}

if ($route === 'POST /api/webhooks/razorpay') {
    $webhookSecret = $config['razorpay']['webhook_secret'] ?? '';
    $signature = $request->header('X-Razorpay-Signature');

    if (!is_string($webhookSecret) || $webhookSecret === '') {
        Response::json(['error' => 'Razorpay webhook secret is not configured'], 500);
    }

    if (!is_string($signature) || $signature === '') {
        Response::json(['error' => 'Missing Razorpay webhook signature'], 401);
    }

    $expected = hash_hmac('sha256', $request->rawBody(), $webhookSecret);

    if (!hash_equals($expected, $signature)) {
        Response::json(['error' => 'Invalid Razorpay webhook signature'], 401);
    }

    $event = $request->body();
    $eventName = $event['event'] ?? '';

    if (!is_string($eventName) || $eventName === '') {
        Response::json(['message' => 'Razorpay webhook ignored: missing event name']);
    }

    [$orderId, $paymentId] = razorpayWebhookPaymentIdentifiers($event);

    if (in_array($eventName, ['payment.captured', 'order.paid'], true)) {
        if ($orderId === null) {
            recordPaymentEventSafe($users, null, null, $paymentId, 'webhook', $eventName, 'ignored', 'Paid webhook was missing order id.');
            Response::json([
                'message' => 'Razorpay paid webhook ignored: missing order id',
                'event' => $eventName,
            ], 202);
        }

        $result = $users->markRazorpayOrderPaidByOrderId($orderId, $paymentId);

        if ($result['matched']) {
            sendReceiptEmailForOrder($users, $mailer, $config, $orderId);
        }

        recordPaymentEventSafe(
            $users,
            $result['user_ids'][0] ?? null,
            $orderId,
            $paymentId,
            'webhook',
            $eventName,
            $result['matched'] ? 'paid' : 'unmatched',
            $result['matched']
                ? 'Webhook marked order paid.'
                : 'Webhook accepted but no local pending order matched.'
        );

        Response::json([
            'message' => $result['matched']
                ? 'Razorpay order marked paid'
                : 'Razorpay paid webhook accepted but no pending order matched',
            'event' => $eventName,
            'order_id' => $orderId,
            'payment_id' => $paymentId,
            'matched' => $result['matched'],
        ]);
    }

    if ($eventName === 'payment.failed') {
        if ($orderId === null) {
            recordPaymentEventSafe($users, null, null, $paymentId, 'webhook', $eventName, 'ignored', 'Failed webhook was missing order id.');
            Response::json([
                'message' => 'Razorpay failed webhook ignored: missing order id',
                'event' => $eventName,
            ], 202);
        }

        $result = $users->markRazorpayOrderFailedByOrderId($orderId, $paymentId);
        recordPaymentEventSafe(
            $users,
            null,
            $orderId,
            $paymentId,
            'webhook',
            $eventName,
            $result['matched'] ? 'failed' : 'unmatched',
            $result['matched']
                ? 'Webhook marked pending order failed.'
                : 'Webhook accepted but no local pending order matched.'
        );

        Response::json([
            'message' => $result['matched']
                ? 'Razorpay order marked failed'
                : 'Razorpay failed webhook accepted but no pending order matched',
            'event' => $eventName,
            'order_id' => $orderId,
            'payment_id' => $paymentId,
            'matched' => $result['matched'],
        ]);
    }

    Response::json([
        'message' => 'Razorpay webhook ignored',
        'event' => $eventName,
    ]);
}

$verifier = new ClerkJwtVerifier($config['clerk']);
$clerkUsers = new ClerkUserClient($config['clerk']['secret_key']);

// Deprecated: frontend no longer calls /api/auth/sync-user.
// Protected routes now call requireClaimsWithLocalUser() and create the local user from Clerk when needed.
// if ($route === 'POST /api/auth/sync-user') {
//     $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users, true);
//     Response::json([
//         'message' => 'User synced from Clerk',
//         'user' => $users->findProfileByClerkId((string) $claims['sub']),
//     ]);
// }

if ($route === 'GET /api/me') {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);
    $user = $users->findProfileByClerkId((string) $claims['sub']);

    if ($user === null) {
        Response::json(['error' => 'User not found. Check Clerk profile sync.'], 404);
    }

    Response::json(['user' => $user]);
}

if ($route === 'PUT /api/me') {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);

    try {
        $user = $users->updateProfile(
            (string) $claims['sub'],
            $request->only(['email', 'phone_number', 'dob', 'username', 'name'])
        );
    } catch (InvalidArgumentException $exception) {
        Response::json(['error' => $exception->getMessage()], 422);
    } catch (RuntimeException $exception) {
        Response::json(['error' => $exception->getMessage()], 409);
    }

    if ($user === null) {
        Response::json(['error' => 'User not found. Check Clerk profile sync.'], 404);
    }

    Response::json([
        'message' => 'Profile updated',
        'user' => $user,
    ]);
}

if ($route === 'GET /api/cart') {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);

    Response::json([
        'cart' => $users->getCart((string) $claims['sub']),
    ]);
}

if ($route === 'POST /api/cart') {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);
    $slug = $request->body()['magazine_slug'] ?? null;

    if (!is_string($slug) || $slug === '') {
        Response::json(['error' => 'magazine_slug is required'], 422);
    }

    try {
        $cart = $users->addCartItem((string) $claims['sub'], $slug);
    } catch (Throwable $exception) {
        Response::json(['error' => $exception->getMessage()], 422);
    }

    Response::json([
        'message' => 'Added to cart',
        'cart' => $cart,
    ]);
}

if ($request->method() === 'DELETE' && preg_match('#^/api/cart/(\d+)$#', $request->path(), $matches)) {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);

    Response::json([
        'message' => 'Removed from cart',
        'cart' => $users->removeCartItem((string) $claims['sub'], (int) $matches[1]),
    ]);
}

if ($route === 'POST /api/payments/razorpay/order') {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);
    $clerkUserId = (string) $claims['sub'];
    $summary = $users->cartSummary($clerkUserId);

    if ($summary['cart'] === [] || $summary['total_paise'] <= 0) {
        Response::json(['error' => 'Cart is empty'], 422);
    }

    $razorpay = $config['razorpay'];

    if ($razorpay['key_id'] === '' || $razorpay['key_secret'] === '') {
        Response::json(['error' => 'Razorpay keys are not configured'], 500);
    }

    $receipt = 'aditi_' . substr(bin2hex(random_bytes(12)), 0, 24);
    $order = razorpayRequest($razorpay, 'POST', '/v1/orders', [
        'amount' => $summary['total_paise'],
        'currency' => $summary['currency'],
        'receipt' => $receipt,
    ]);

    $orderId = $order['id'] ?? null;

    if (!is_string($orderId) || $orderId === '') {
        Response::json(['error' => 'Razorpay did not return an order id'], 502);
    }

    $users->createPendingPurchasesForCart($clerkUserId, $orderId);
    recordPaymentEventSafe(
        $users,
        $users->userIdForClerkId($clerkUserId),
        $orderId,
        null,
        'checkout',
        'order_created',
        'pending',
        'Razorpay order created and pending purchases saved.',
        ['amount_paise' => $summary['total_paise'], 'currency' => $summary['currency']]
    );

    Response::json([
        'key_id' => $razorpay['key_id'],
        'order' => $order,
        'cart' => $summary['cart'],
    ]);
}

if ($route === 'POST /api/payments/razorpay/verify') {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);
    $body = $request->body();
    $orderId = $body['razorpay_order_id'] ?? null;
    $paymentId = $body['razorpay_payment_id'] ?? null;
    $signature = $body['razorpay_signature'] ?? null;
    $secret = $config['razorpay']['key_secret'];

    if (!is_string($orderId) || !is_string($paymentId) || !is_string($signature)) {
        Response::json(['error' => 'Payment verification fields are required'], 422);
    }

    if ($secret === '') {
        Response::json(['error' => 'Razorpay keys are not configured'], 500);
    }

    $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);

    if (!hash_equals($expected, $signature)) {
        recordPaymentEventSafe(
            $users,
            $users->userIdForClerkId((string) $claims['sub']),
            $orderId,
            $paymentId,
            'checkout',
            'signature_verify',
            'failed',
            'Invalid Razorpay payment signature.'
        );
        Response::json(['error' => 'Invalid Razorpay payment signature'], 401);
    }

    $purchases = $users->markRazorpayOrderPaid((string) $claims['sub'], $orderId, $paymentId);
    sendReceiptEmailForOrder($users, $mailer, $config, $orderId);
    recordPaymentEventSafe(
        $users,
        $users->userIdForClerkId((string) $claims['sub']),
        $orderId,
        $paymentId,
        'checkout',
        'signature_verify',
        'paid',
        'Payment signature verified and order marked paid.'
    );

    Response::json([
        'message' => 'Payment verified',
        'purchases' => $purchases,
    ]);
}

if ($route === 'POST /api/payments/razorpay/recover') {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);
    $clerkUserId = (string) $claims['sub'];
    $razorpay = $config['razorpay'];

    if ($razorpay['key_id'] === '' || $razorpay['key_secret'] === '') {
        Response::json(['error' => 'Razorpay keys are not configured'], 500);
    }

    $pendingOrderIds = $users->pendingRazorpayOrderIdsForUser($clerkUserId);
    $results = [];
    $recovered = 0;

    foreach ($pendingOrderIds as $orderId) {
        $paymentState = razorpayPaymentStateForOrder($razorpay, $orderId);

        if ($paymentState['status'] === 'paid') {
            $users->markRazorpayOrderPaid($clerkUserId, $orderId, $paymentState['payment_id']);
            sendReceiptEmailForOrder($users, $mailer, $config, $orderId);
            $recovered++;
        }

        if ($paymentState['status'] === 'failed') {
            $users->markRazorpayOrderFailedByOrderId($orderId, $paymentState['payment_id']);
        }

        recordPaymentEventSafe(
            $users,
            $users->userIdForClerkId($clerkUserId),
            $orderId,
            $paymentState['payment_id'],
            'recovery',
            'user_recovery',
            $paymentState['status'],
            $paymentState['status'] === 'paid'
                ? 'User recovery unlocked paid order.'
                : 'User recovery checked Razorpay order state.',
            $paymentState
        );

        $results[] = [
            'order_id' => $orderId,
            'status' => $paymentState['status'],
            'payment_id' => $paymentState['payment_id'],
            'razorpay_order_status' => $paymentState['order_status'],
        ];
    }

    Response::json([
        'message' => $recovered > 0
            ? 'Payment recovered. Your downloads are ready.'
            : 'No captured payment found for pending orders yet.',
        'recovered_count' => $recovered,
        'checked_count' => count($pendingOrderIds),
        'results' => $results,
        'user' => $users->findProfileByClerkId($clerkUserId),
    ]);
}

if ($request->method() === 'GET' && preg_match('#^/api/orders/([^/]+)/invoice$#', $request->path(), $matches)) {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);
    $orderId = rawurldecode($matches[1]);
    $invoice = $users->paidOrderInvoice((string) $claims['sub'], $orderId);

    if ($invoice === null) {
        Response::json(['error' => 'Paid order not found for this user'], 404);
    }

    $payload = generateInvoicePdf($invoice);
    $filename = safeDownloadFilename('aditi-invoice-' . $orderId . '.pdf');

    http_response_code(200);
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($payload));
    echo $payload;
    exit;
}

if ($request->method() === 'GET' && preg_match('#^/api/magazines/([^/]+)/download$#', $request->path(), $matches)) {
    $claims = requireClaimsWithLocalUser($request, $verifier, $clerkUsers, $users);
    $slug = rawurldecode($matches[1]);
    $file = $users->paidMagazineFile((string) $claims['sub'], $slug);

    if ($file === null) {
        Response::json(['error' => 'Magazine not found for this paid user'], 404);
    }

    $filename = safeDownloadFilename(
        $file['pdf_filename'] ?? ($file['slug'] . '.pdf')
    );
    $mime = $file['pdf_mime_type'] ?: 'application/pdf';
    $diskPath = magazineStoragePath($config, $file['pdf_path'] ?? null);

    // Preferred path for large issues: stream the file off disk so a 100 MB PDF
    // never has to fit in PHP memory or travel through a MySQL packet.
    if ($diskPath !== null) {
        http_response_code(200);
        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . (string) filesize($diskPath));

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        $handle = fopen($diskPath, 'rb');

        if ($handle !== false) {
            fpassthru($handle);
            fclose($handle);
            exit;
        }
    }

    // Legacy fallback: the PDF was imported into the pdf_file LONGBLOB column.
    if (($file['pdf_file'] ?? null) === null || $file['pdf_file'] === '') {
        Response::json(['error' => 'Magazine PDF is not available yet'], 404);
    }

    $payload = $file['pdf_file'];

    http_response_code(200);
    header('Content-Type: ' . $mime);
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($payload));
    echo $payload;
    exit;
}

Response::json(['error' => 'Route not found'], 404);

function razorpayRequest(array $config, string $method, string $path, array $payload = []): array
{
    $url = 'https://api.razorpay.com' . $path;
    $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $headers = [
        'Authorization: Basic ' . base64_encode($config['key_id'] . ':' . $config['key_secret']),
        'Content-Type: application/json',
    ];
    $httpOptions = [
        'method' => $method,
        'header' => implode("\r\n", $headers),
        'ignore_errors' => true,
        'timeout' => 20,
    ];

    if ($method !== 'GET' || $payload !== []) {
        $httpOptions['content'] = $body === false ? '{}' : $body;
    }

    $context = stream_context_create(['http' => $httpOptions]);

    $response = file_get_contents($url, false, $context);
    $statusLine = $http_response_header[0] ?? '';
    preg_match('#\s(\d{3})\s#', $statusLine, $matches);
    $status = (int) ($matches[1] ?? 0);
    $data = json_decode($response === false ? '' : $response, true);

    if ($status < 200 || $status >= 300 || !is_array($data)) {
        Response::json([
            'error' => 'Unable to contact Razorpay',
            'details' => is_array($data) ? ($data['error']['description'] ?? $data) : null,
        ], 502);
    }

    return $data;
}

function razorpayPaymentStateForOrder(array $config, string $orderId): array
{
    $order = razorpayRequest($config, 'GET', '/v1/orders/' . rawurlencode($orderId));
    $payments = razorpayRequest($config, 'GET', '/v1/orders/' . rawurlencode($orderId) . '/payments');
    $items = is_array($payments['items'] ?? null) ? $payments['items'] : [];
    $paymentId = null;

    foreach ($items as $payment) {
        if (!is_array($payment)) {
            continue;
        }

        if (($payment['status'] ?? null) === 'captured') {
            return [
                'status' => 'paid',
                'payment_id' => firstNonEmptyString($payment['id'] ?? null),
                'order_status' => is_string($order['status'] ?? null) ? $order['status'] : null,
            ];
        }

        $paymentId ??= firstNonEmptyString($payment['id'] ?? null);
    }

    if (($order['status'] ?? null) === 'paid') {
        return [
            'status' => 'paid',
            'payment_id' => $paymentId,
            'order_status' => 'paid',
        ];
    }

    $hasFailedPayment = false;

    foreach ($items as $payment) {
        if (is_array($payment) && ($payment['status'] ?? null) === 'failed') {
            $hasFailedPayment = true;
            $paymentId ??= firstNonEmptyString($payment['id'] ?? null);
        }
    }

    if ($hasFailedPayment && in_array($order['status'] ?? null, ['attempted', 'created'], true)) {
        return [
            'status' => 'failed',
            'payment_id' => $paymentId,
            'order_status' => is_string($order['status'] ?? null) ? $order['status'] : null,
        ];
    }

    return [
        'status' => 'pending',
        'payment_id' => $paymentId,
        'order_status' => is_string($order['status'] ?? null) ? $order['status'] : null,
    ];
}

function razorpayWebhookPaymentIdentifiers(array $event): array
{
    $payment = $event['payload']['payment']['entity'] ?? [];
    $order = $event['payload']['order']['entity'] ?? [];

    if (!is_array($payment)) {
        $payment = [];
    }

    if (!is_array($order)) {
        $order = [];
    }

    return [
        firstNonEmptyString($payment['order_id'] ?? null, $order['id'] ?? null),
        firstNonEmptyString($payment['id'] ?? null, $order['payment_id'] ?? null),
    ];
}

function firstNonEmptyString(mixed ...$values): ?string
{
    foreach ($values as $value) {
        if (is_string($value) && trim($value) !== '') {
            return trim($value);
        }
    }

    return null;
}

function recordPaymentEventSafe(
    UserRepository $users,
    ?int $userId,
    ?string $orderId,
    ?string $paymentId,
    string $source,
    string $eventType,
    string $status,
    ?string $message = null,
    array $payload = []
): void {
    $users->recordPaymentEvent($userId, $orderId, $paymentId, $source, $eventType, $status, $message, $payload);
}

function safeDownloadFilename(string $filename): string
{
    $filename = preg_replace('/[^A-Za-z0-9._-]+/', '-', $filename) ?: 'aditi-magazine.pdf';

    return str_ends_with(strtolower($filename), '.pdf') ? $filename : $filename . '.pdf';
}

/**
 * Resolves a magazines.pdf_path value to a readable file inside the configured
 * storage directory. Returns null when unset, missing, or pointing outside that
 * directory, so a bad DB value can never expose an arbitrary file.
 */
function magazineStoragePath(array $config, ?string $pdfPath): ?string
{
    if ($pdfPath === null || trim($pdfPath) === '') {
        return null;
    }

    $storageRoot = realpath((string) ($config['magazines']['storage_path'] ?? ''));

    if ($storageRoot === false) {
        return null;
    }

    $candidate = realpath($storageRoot . DIRECTORY_SEPARATOR . basename(trim($pdfPath)));

    if ($candidate === false || !is_file($candidate) || !is_readable($candidate)) {
        return null;
    }

    return str_starts_with($candidate, $storageRoot) ? $candidate : null;
}

function generateInvoicePdf(array $invoice): string
{
    $orderId = (string) $invoice['order_id'];
    $paymentId = (string) ($invoice['payment_id'] ?? '');
    $invoiceNumber = 'ADITI-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $orderId) ?: 'ORDER', -10));
    $purchasedAt = strtotime((string) ($invoice['purchased_at'] ?? '')) ?: time();
    $date = date('d M Y', $purchasedAt);
    $user = $invoice['user'] ?? [];
    $items = $invoice['items'] ?? [];
    $total = formatInvoiceRupees((int) ($invoice['total_paise'] ?? 0));
    $ops = [];

    pdfText($ops, 346, 720, 'I N V O I C E', 'R', 31);
    pdfTextRight($ops, 498, 694, '#' . $invoiceNumber, 'R', 8);

    pdfText($ops, 86, 656, 'BILLED TO:', 'B', 9);
    pdfText($ops, 170, 656, (string) ($user['username'] ?? 'ADITI Reader'), 'B', 9);
    pdfText($ops, 170, 640, (string) ($user['email'] ?? ''), 'R', 9);
    pdfText($ops, 170, 624, (string) ($user['phone_number'] ?? ''), 'R', 9);

    pdfText($ops, 86, 596, 'PAYMENT:', 'B', 9);
    pdfText($ops, 170, 596, 'Razorpay', 'B', 9);
    pdfText($ops, 170, 580, 'Order ' . $orderId, 'R', 8);
    pdfText($ops, 170, 564, 'Payment ' . $paymentId, 'R', 8);
    pdfText($ops, 170, 548, 'Paid on ' . $date, 'R', 8);

    pdfText($ops, 86, 488, 'DESCRIPTION', 'B', 8);
    pdfTextRight($ops, 354, 488, 'RATE', 'B', 8);
    pdfTextRight($ops, 416, 488, 'QTY', 'B', 8);
    pdfTextRight($ops, 498, 488, 'AMOUNT', 'B', 8);
    pdfLine($ops, 86, 472, 498, 472);

    $y = 452;

    foreach ($items as $item) {
        $amount = formatInvoiceRupees((int) ($item['price_paise'] ?? 0));
        $titleLines = explode("\n", wordwrap((string) ($item['title'] ?? 'ADITI Magazine'), 42, "\n", true));

        foreach ($titleLines as $index => $titleLine) {
            pdfText($ops, 86, $y, $titleLine, $index === 0 ? 'R' : 'R', 9);

            if ($index === 0) {
                pdfTextRight($ops, 354, $y, $amount, 'R', 9);
                pdfTextRight($ops, 416, $y, '1', 'R', 9);
                pdfTextRight($ops, 498, $y, $amount, 'R', 9);
            }

            $y -= 14;
        }

        pdfLine($ops, 86, $y + 2, 498, $y + 2);
        $y -= 16;

        if ($y < 222) {
            pdfText($ops, 86, $y, 'Additional paid items are included in the total.', 'R', 8);
            break;
        }
    }

    pdfText($ops, 86, 200, 'Sub-Total', 'R', 9);
    pdfTextRight($ops, 498, 200, $total, 'R', 9);
    pdfLine($ops, 86, 186, 498, 186);
    pdfText($ops, 86, 164, 'TOTAL', 'B', 11);
    pdfTextRight($ops, 498, 164, $total, 'B', 11);

    pdfText($ops, 86, 108, 'Your payment has been received. This invoice was automatically generated by ADITI.', 'R', 9);
    pdfText($ops, 86, 84, 'Thank you for your business.', 'R', 9);

    return buildSimplePdf(implode("\n", $ops));
}

function formatInvoiceRupees(int $pricePaise): string
{
    return 'INR ' . number_format($pricePaise / 100, 0);
}

function pdfText(array &$ops, int $x, int $y, string $text, string $font = 'R', int $size = 10): void
{
    $fontName = $font === 'B' ? 'F2' : 'F1';
    $ops[] = 'BT /' . $fontName . ' ' . $size . ' Tf ' . $x . ' ' . $y . ' Td (' . pdfEscape($text) . ') Tj ET';
}

function pdfTextRight(array &$ops, int $rightX, int $y, string $text, string $font = 'R', int $size = 10): void
{
    $x = $rightX - pdfApproxTextWidth($text, $size);
    pdfText($ops, $x, $y, $text, $font, $size);
}

function pdfApproxTextWidth(string $text, int $size): int
{
    return (int) ceil(strlen(pdfEscape($text)) * $size * 0.5);
}

function pdfLine(array &$ops, int $x1, int $y1, int $x2, int $y2): void
{
    $ops[] = '0.72 0.56 0.29 RG 0.75 w ' . $x1 . ' ' . $y1 . ' m ' . $x2 . ' ' . $y2 . ' l S';
}

function pdfEscape(string $text): string
{
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);

    if (!is_string($ascii)) {
        $ascii = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';
    }

    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $ascii);
}

function buildSimplePdf(string $content): string
{
    $objects = [
        1 => '<< /Type /Catalog /Pages 2 0 R >>',
        2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
        4 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        5 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        6 => '<< /Length ' . strlen($content) . " >>\nstream\n" . $content . "\nendstream",
    ];
    $pdf = "%PDF-1.4\n";
    $offsets = [0];

    foreach ($objects as $number => $object) {
        $offsets[$number] = strlen($pdf);
        $pdf .= $number . " 0 obj\n" . $object . "\nendobj\n";
    }

    $xrefOffset = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
    $pdf .= "0000000000 65535 f \n";

    for ($number = 1; $number <= count($objects); $number++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$number]);
    }

    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
    $pdf .= "startxref\n" . $xrefOffset . "\n%%EOF";

    return $pdf;
}

function sendReceiptEmailForOrder(
    UserRepository $users,
    Mailer $mailer,
    array $config,
    string $orderId
): void {
    $receiptPayload = null;

    try {
        $receiptPayload = $users->createReceiptForPaidOrder($orderId);

        if ($receiptPayload === null) {
            return;
        }

        $receipt = $receiptPayload['receipt'] ?? [];
        $receiptId = (int) ($receipt['id'] ?? 0);
        $emailTo = (string) ($receipt['email_to'] ?? '');

        if (!empty($receipt['email_sent_at'])) {
            recordPaymentEventSafe(
                $users,
                (int) ($receiptPayload['user']['id'] ?? 0) ?: null,
                $orderId,
                firstNonEmptyString($receiptPayload['payment_id'] ?? null),
                'email',
                'receipt_email',
                'already_sent',
                'Receipt email was already sent for this order.'
            );
            return;
        }

        if ($receiptId <= 0 || $emailTo === '') {
            if ($receiptId > 0) {
                $users->markReceiptEmailFailed($receiptId, 'Receipt email address is missing.');
            }

            recordPaymentEventSafe(
                $users,
                (int) ($receiptPayload['user']['id'] ?? 0) ?: null,
                $orderId,
                firstNonEmptyString($receiptPayload['payment_id'] ?? null),
                'email',
                'receipt_email',
                'failed',
                'Receipt email address is missing.'
            );
            return;
        }

        $html = renderReceiptEmailHtml($receiptPayload, $config);
        $users->storeReceiptEmailSnapshot($receiptId, $html);

        if (($config['mail']['enabled'] ?? false) !== true) {
            recordPaymentEventSafe(
                $users,
                (int) ($receiptPayload['user']['id'] ?? 0) ?: null,
                $orderId,
                firstNonEmptyString($receiptPayload['payment_id'] ?? null),
                'email',
                'receipt_email',
                'disabled',
                'Receipt email was generated but MAIL_ENABLED is false.'
            );
            return;
        }

        $subject = 'ADITI receipt ' . (string) $receipt['receipt_number'];

        $mailer->sendHtml($emailTo, $subject, $html);
        $users->markReceiptEmailSent($receiptId);
        recordPaymentEventSafe(
            $users,
            (int) ($receiptPayload['user']['id'] ?? 0) ?: null,
            $orderId,
            firstNonEmptyString($receiptPayload['payment_id'] ?? null),
            'email',
            'receipt_email',
            'sent',
            'Receipt email sent successfully.'
        );
    } catch (Throwable $exception) {
        $receiptId = (int) ($receiptPayload['receipt']['id'] ?? 0);

        if ($receiptId > 0) {
            $users->markReceiptEmailFailed($receiptId, $exception->getMessage());
        }

        recordPaymentEventSafe(
            $users,
            (int) ($receiptPayload['user']['id'] ?? 0) ?: null,
            $orderId,
            firstNonEmptyString($receiptPayload['payment_id'] ?? null),
            'email',
            'receipt_email',
            'failed',
            $exception->getMessage()
        );
    }
}

function renderReceiptEmailHtml(array $receiptPayload, array $config): string
{
    $template = file_get_contents(__DIR__ . '/../templates/receipt-email.html');

    if ($template === false) {
        throw new RuntimeException('Receipt email template is missing.');
    }

    $user = $receiptPayload['user'] ?? [];
    $items = $receiptPayload['items'] ?? [];
    $receipt = $receiptPayload['receipt'] ?? [];
    $purchaseTimestamp = strtotime((string) ($receiptPayload['purchased_at'] ?? '')) ?: time();
    $magazineTitle = implode(', ', array_map(
        static fn (array $item): string => (string) ($item['title'] ?? 'ADITI Magazine'),
        $items
    ));
    $magazineSku = implode(', ', array_filter(array_map(
        static fn (array $item): string => (string) ($item['sku'] ?? ''),
        $items
    )));
    $itemCount = count($items);
    $frontendUrl = rtrim((string) ($config['app']['frontend_url'] ?? ''), '/');
    $downloadUrl = ($frontendUrl !== '' ? $frontendUrl : 'https://read.aditidefence.in') . '/profile';
    $currency = (string) ($receiptPayload['currency'] ?? 'INR');
    $amountRupees = $currency . ' ' . number_format(((int) ($receiptPayload['total_paise'] ?? 0)) / 100, 0);
    $values = [
        'user_name' => (string) ($user['username'] ?? 'ADITI Reader'),
        'user_email' => (string) ($user['email'] ?? ''),
        'phone_number' => (string) ($user['phone_number'] ?? ''),
        'magazine_title' => $magazineTitle,
        'magazine_sku' => $magazineSku,
        'item_count' => (string) $itemCount,
        'order_id' => (string) ($receiptPayload['order_id'] ?? ''),
        'payment_id' => (string) ($receiptPayload['payment_id'] ?? ''),
        'receipt_number' => (string) ($receipt['receipt_number'] ?? ''),
        'purchase_date' => date('d M Y, h:i A', $purchaseTimestamp),
        'payment_method' => 'Razorpay',
        'payment_status' => 'Paid',
        'order_status' => 'Completed',
        'subtotal_rupees' => $amountRupees,
        'amount_rupees' => $amountRupees,
        'currency' => $currency,
        'download_url' => $downloadUrl,
    ];

    foreach ($values as $key => $value) {
        $template = str_replace('{{' . $key . '}}', escapeEmailHtml($value), $template);
    }

    return $template;
}

function escapeEmailHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function requireClaims(Request $request, ClerkJwtVerifier $verifier): array
{
    global $config;

    $token = $request->bearerToken();

    if ($token === null) {
        Response::json(['error' => 'Missing bearer token'], 401);
    }

    try {
        return $verifier->verify($token);
    } catch (Throwable $exception) {
        $payload = ['error' => 'Invalid or expired Clerk token'];

        if (($config['app']['debug'] ?? false) === true) {
            $payload['message'] = $exception->getMessage();
        }

        Response::json($payload, 401);
    }
}

function requireClaimsWithLocalUser(
    Request $request,
    ClerkJwtVerifier $verifier,
    ClerkUserClient $clerkUsers,
    UserRepository $users,
    bool $refreshFromClerk = false
): array {
    $claims = requireClaims($request, $verifier);
    $clerkUserId = (string) $claims['sub'];
    $localUser = $users->findProfileByClerkId($clerkUserId);

    if ($localUser !== null && !$refreshFromClerk && !localUserNeedsClerkIdentity($localUser)) {
        return $claims;
    }

    $clerkProfile = array_filter(
        $clerkUsers->getUserProfile($clerkUserId),
        static fn ($value): bool => $value !== null && $value !== ''
    );

    if ($clerkProfile === []) {
        if ($localUser !== null) {
            return $claims;
        }

        Response::json([
            'error' => 'Unable to fetch Clerk user profile',
            'message' => $clerkUsers->lastError() ?? 'Check CLERK_SECRET_KEY and Clerk user data.',
        ], 502);
    }

    $users->syncUserFromAuth($clerkUserId, $clerkProfile, [
        'session_id' => $claims['sid'] ?? null,
        'ip_address' => $request->ip(),
        'user_agent' => $request->header('User-Agent'),
    ]);

    return $claims;
}

function localUserNeedsClerkIdentity(array $user): bool
{
    return firstNonEmptyString($user['email'] ?? null) === null
        || firstNonEmptyString($user['username'] ?? null) === null;
}

function requireAdmin(Request $request, AdminRepository $admins): array
{
    $admin = $admins->adminFromToken(adminTokenFromRequest($request));

    if ($admin === null) {
        Response::json(['error' => 'Admin login required'], 401);
    }

    return $admin;
}

function adminTokenFromRequest(Request $request): ?string
{
    global $config;

    return $request->cookie($config['app']['admin_cookie_name']) ?? $request->bearerToken();
}

function issueAdminCookie(string $token, string $expiresAt): void
{
    global $config;

    $secure = (bool) $config['app']['admin_cookie_secure'];
    $cookieName = (string) $config['app']['admin_cookie_name'];
    $sameSite = (string) $config['app']['admin_cookie_samesite'];
    $expires = strtotime($expiresAt) ?: (time() + 3600);

    setcookie($cookieName, $token, [
        'expires' => $expires,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => in_array($sameSite, ['Strict', 'Lax', 'None'], true) ? $sameSite : 'Lax',
    ]);
}

function clearAdminCookie(): void
{
    global $config;

    setcookie((string) $config['app']['admin_cookie_name'], '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => (bool) $config['app']['admin_cookie_secure'],
        'httponly' => true,
        'samesite' => (string) $config['app']['admin_cookie_samesite'],
    ]);
}
