# Google OAuth Configuration for TengeGuard

TengeGuard uses Google only for account registration and sign-in. It does not request access to Gmail messages.

## Application

- App name: `TengeGuard`
- Home page: `https://www.tengeguard.online`
- Privacy policy: `https://www.tengeguard.online/privacy`
- Terms: `https://www.tengeguard.online/terms`
- Authorized domain: `tengeguard.online`

## OAuth Client

Authorized JavaScript origins:

```text
https://www.tengeguard.online
https://tengeguard.online
```

Authorized redirect URI:

```text
https://www.tengeguard.online/api/subcut/gmail/callback
```

The callback path keeps its legacy name for compatibility; it processes Google Sign-In only.

## Requested Scopes

```text
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

Remove `https://www.googleapis.com/auth/gmail.readonly` from Google Cloud Console Data Access. TengeGuard does not need Gmail restricted-scope verification or CASA while it requests only the scopes above.

Google profile data is used only to create the user session, display account identity, and keep each user dashboard separate. Paid subscriptions are discovered from separately authorized read-only bank transaction history.
