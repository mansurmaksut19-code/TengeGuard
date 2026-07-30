# Google OAuth Verification for TengeGuard

Use this document when submitting TengeGuard for Google OAuth app verification.

## App Information

App name:

```text
TengeGuard
```

User support email:

```text
mansurmaksut19@gmail.com
```

Application home page:

```text
https://www.tengeguard.online
```

Privacy policy:

```text
https://www.tengeguard.online/privacy
```

Terms of service:

```text
https://www.tengeguard.online/terms
```

Authorized domain:

```text
tengeguard.online
```

## OAuth Client Settings

Authorized JavaScript origins:

```text
https://www.tengeguard.online
https://tengeguard.online
```

Authorized redirect URIs:

```text
https://www.tengeguard.online/api/subcut/gmail/callback
```

## Requested Scopes

```text
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/gmail.readonly
```

## Scope Justification

`openid`, `userinfo.email`, and `userinfo.profile` are used for Google Sign-In. TengeGuard uses them to create a user session, show the user's account identity, and keep each user's subscription dashboard separate.

`https://www.googleapis.com/auth/gmail.readonly` is used only after the user explicitly clicks the Gmail connection button inside the dashboard. TengeGuard reads subscription-related emails, receipts, billing notices, trial notices, renewal notices, and cancellation confirmations. The app does not send emails, modify emails, delete emails, or access Gmail for advertising.

## App Description

TengeGuard helps users find and manage subscriptions from real evidence. The product connects to Gmail in read-only mode, scans subscription-related receipts and billing notices, extracts paid subscriptions, free plans, trial periods, renewal dates, and cancellation evidence, then shows the result in a personal dashboard. Users can also receive Telegram reminders before renewal or trial end dates.

## Data Use Disclosure

TengeGuard accesses Google user data only to provide the subscription tracking feature requested by the user. Gmail access is read-only and is used to scan messages for subscription, receipt, billing, renewal, free plan, and trial-related evidence. TengeGuard does not sell Google user data, does not use it for advertising, does not share it with third parties for marketing, and does not use Gmail data to determine creditworthiness.

## Demo Video Script

Record a short screen video showing:

1. Open `https://www.tengeguard.online`.
2. Choose desktop or mobile mode.
3. Sign in with Google using the normal Google Sign-In flow.
4. Open the dashboard.
5. Click the Gmail connection button.
6. Show Google's consent screen with `gmail.readonly`.
7. Confirm that TengeGuard shows only subscription-related results and evidence.
8. Show the Privacy Policy page.
9. Show that access can be revoked from the user's Google Account permissions.

## Verification Notes

TengeGuard requests the minimum Gmail permission needed for the feature. The app only needs read-only Gmail access because subscription evidence is commonly stored in receipts, renewal notices, billing messages, and trial emails. The app cannot provide accurate subscription detection for Gmail-based subscriptions without this scope.
