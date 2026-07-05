<?php

declare(strict_types=1);

namespace App\Auth;

final class ClerkUserClient
{
    private ?string $lastError = null;

    public function __construct(private readonly string $secretKey)
    {
    }

    public function getUserProfile(string $clerkUserId): array
    {
        $this->lastError = null;

        if ($this->secretKey === '') {
            $this->lastError = 'CLERK_SECRET_KEY is not configured.';
            return [];
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'Authorization: Bearer ' . $this->secretKey,
                    'Accept: application/json',
                ],
                'ignore_errors' => true,
                'timeout' => 10,
            ],
        ]);

        $json = @file_get_contents(
            'https://api.clerk.com/v1/users/' . rawurlencode($clerkUserId),
            false,
            $context
        );

        if ($json === false) {
            $this->lastError = 'Unable to contact Clerk.';
            return [];
        }

        $user = json_decode($json, true);

        if (!is_array($user)) {
            $this->lastError = 'Clerk returned an invalid response.';
            return [];
        }

        $statusLine = $http_response_header[0] ?? '';
        preg_match('#\s(\d{3})\s#', $statusLine, $matches);
        $status = (int) ($matches[1] ?? 0);

        if ($status < 200 || $status >= 300) {
            $this->lastError = $this->errorMessage($user) ?? 'Clerk request failed.';
            return [];
        }

        return [
            'email' => $this->primaryEmail($user),
            'phone_number' => $this->primaryPhone($user),
            'username' => $this->displayName($user),
            'profile_image_url' => $user['image_url'] ?? null,
            'dob' => $this->dobFromClerkUser($user),
        ];
    }

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    private function primaryEmail(array $user): ?string
    {
        $primaryId = $user['primary_email_address_id'] ?? null;

        foreach ($user['email_addresses'] ?? [] as $email) {
            if (($email['id'] ?? null) === $primaryId) {
                return $email['email_address'] ?? null;
            }
        }

        return $user['email_addresses'][0]['email_address'] ?? null;
    }

    private function primaryPhone(array $user): ?string
    {
        $primaryId = $user['primary_phone_number_id'] ?? null;

        foreach ($user['phone_numbers'] ?? [] as $phone) {
            if (($phone['id'] ?? null) === $primaryId) {
                return $phone['phone_number'] ?? null;
            }
        }

        return $user['phone_numbers'][0]['phone_number'] ?? null;
    }

    private function displayName(array $user): ?string
    {
        if (!empty($user['full_name'])) {
            return $user['full_name'];
        }

        $name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));

        if ($name !== '') {
            return $name;
        }

        return $user['username'] ?? null;
    }

    private function dobFromClerkUser(array $user): ?string
    {
        $value = $user['public_metadata']['dob']
            ?? $user['private_metadata']['dob']
            ?? $user['unsafe_metadata']['dob']
            ?? $user['public_metadata']['date_of_birth']
            ?? $user['private_metadata']['date_of_birth']
            ?? $user['unsafe_metadata']['date_of_birth']
            ?? null;

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $timestamp = strtotime($value);

        return $timestamp === false ? trim($value) : date('Y-m-d', $timestamp);
    }

    private function errorMessage(array $payload): ?string
    {
        $message = $payload['errors'][0]['long_message']
            ?? $payload['errors'][0]['message']
            ?? null;

        return is_string($message) && trim($message) !== '' ? $message : null;
    }
}
