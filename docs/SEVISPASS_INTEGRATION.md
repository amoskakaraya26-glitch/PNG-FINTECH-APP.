# SevisPass Integration Guide

## Overview

SevisPass is Papua New Guinea's government digital identification system. This integration allows users to authenticate with the PNG Fintech E-Wallet using their SevisPass digital ID.

## Features

- **OAuth 2.0 Login**: Secure redirect-based authentication
- **Automatic User Registration**: New users are automatically registered with SevisPass data
- **KYC Verification**: Users verified through SevisPass are automatically KYC verified
- **Token Management**: Secure storage and refresh of SevisPass OAuth tokens
- **Profile Sync**: User profile automatically synced with SevisPass data

## Setup Instructions

### 1. Register Your Application with SevisPass

1. Visit the [SevisPass Developer Portal](https://developers.sevispass.png)
2. Create a new application
3. Set up OAuth 2.0 credentials
4. Register your callback URL: `http://your-domain/api/auth/sevispass/callback`

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# SevisPass OAuth Configuration
SEVISPASS_CLIENT_ID=your_client_id_from_sevispass
SEVISPASS_CLIENT_SECRET=your_client_secret_from_sevispass
SEVISPASS_AUTH_URL=https://auth.sevispass.png
SEVISPASS_API_URL=https://api.sevispass.png
SEVISPASS_REDIRECT_URI=http://your-domain/api/auth/sevispass/callback
```

### 3. Run Database Migration

```bash
npm run db:migrate
```

This will create the necessary tables:
- `sevispass_tokens` - Stores OAuth tokens
- `sevispass_verification_logs` - Audit trail for verifications

### 4. Add SevisPass Login Button to Frontend

```tsx
import SevisPassLogin from './components/SevisPassLogin';

function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <SevisPassLogin redirectTo="/dashboard" />
    </div>
  );
}
```

## API Endpoints

### 1. Get SevisPass Login URL

**Endpoint**: `GET /api/auth/sevispass/login`

**Response**:
```json
{
  "success": true,
  "loginUrl": "https://auth.sevispass.png/oauth/authorize?...",
  "state": "unique-state-value"
}
```

**Usage**:
```javascript
// Get login URL from backend
const response = await fetch('/api/auth/sevispass/login');
const { loginUrl } = await response.json();
// Redirect user to login URL
window.location.href = loginUrl;
```

### 2. SevisPass OAuth Callback

**Endpoint**: `GET /api/auth/sevispass/callback?code=...&state=...`

This endpoint is called automatically by SevisPass after user authentication.

**Behavior**:
- Creates new user if phone doesn't exist
- Updates existing user with SevisPass data
- Returns JWT token
- Redirects to frontend with token

### 3. Get SevisPass Verification Status

**Endpoint**: `GET /api/auth/sevispass/status`

**Headers**: 
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "sevispassId": "sp-user-123",
  "kycStatus": "verified",
  "verified": true
}
```

### 4. Refresh SevisPass Token

**Endpoint**: `POST /api/auth/sevispass/refresh-token`

**Headers**: 
```
Authorization: Bearer <JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

## User Data Mapping

When a user authenticates via SevisPass, the following data is synced to the database:

| SevisPass Field | Wallet Field | Notes |
|---|---|---|
| `phone_number` | `users.phone` | User's mobile number |
| `name` | `users.full_name` | Full name |
| `email` | `users.email` | Email address |
| `sub` | `users.sevispass_id` | Unique SevisPass user ID |
| `email_verified` & `phone_verified` | `users.kyc_status` | Set to "verified" if both verified |

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **State Verification**: The state parameter is generated per request for CSRF protection
3. **Token Storage**: Refresh tokens are stored encrypted in the database
4. **Token Refresh**: Access tokens are automatically refreshed when expired
5. **Revocation**: Users can revoke access by logging out (token is revoked on SevisPass)

## Development Mode

In development mode (`NODE_ENV !== 'production'`), the integration uses mock data:

- Mock SevisPass login URL is generated
- Mock tokens are returned
- Mock user data is used

This allows testing without actual SevisPass credentials.

## Production Deployment

### Before Going Live:

1. ✅ Obtain real SevisPass credentials
2. ✅ Update environment variables with production values
3. ✅ Set `NODE_ENV=production`
4. ✅ Test OAuth flow end-to-end
5. ✅ Ensure HTTPS is configured
6. ✅ Set correct redirect URI in SevisPass console
7. ✅ Run database migrations
8. ✅ Configure rate limiting appropriately
9. ✅ Set up monitoring and logging
10. ✅ Test token refresh mechanism

### Production Environment Variables:

```env
NODE_ENV=production
SEVISPASS_CLIENT_ID=your_production_client_id
SEVISPASS_CLIENT_SECRET=your_production_client_secret
SEVISPASS_AUTH_URL=https://auth.sevispass.png
SEVISPASS_API_URL=https://api.sevispass.png
SEVISPASS_REDIRECT_URI=https://your-production-domain.com/api/auth/sevispass/callback
FRONTEND_URL=https://your-production-domain.com
```

## Troubleshooting

### Issue: Redirect URI mismatch error

**Solution**: Ensure the `SEVISPASS_REDIRECT_URI` environment variable matches exactly what you registered in the SevisPass console.

### Issue: User not found after callback

**Solution**: Check that the phone number from SevisPass is valid and matches the database format.

### Issue: Token refresh fails

**Solution**: Ensure the refresh token hasn't expired. SevisPass refresh tokens typically expire after a longer period (e.g., 30 days).

### Issue: Callback returns error

**Solution**: Check the SevisPass API documentation for the specific error code and message returned.

## Testing

### Manual Testing Steps:

1. Start the app: `npm run dev:full`
2. Visit login page
3. Click "Login with SevisPass"
4. You'll be redirected to SevisPass login
5. In development mode, mock authentication succeeds
6. You're redirected back with a JWT token
7. You're logged in!

### API Testing:

```bash
# Get login URL
curl http://localhost:3000/api/auth/sevispass/login

# Get verification status (requires JWT token)
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:3000/api/auth/sevispass/status
```

## References

- [SevisPass Developer Portal](https://developers.sevispass.png)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [PNG Government Digital Services](https://png.gov.pg)

## Support

For issues or questions about SevisPass integration:
1. Check the [SevisPass documentation](https://docs.sevispass.png)
2. Contact SevisPass support
3. File an issue in this repository

## License

This integration is part of the PNG Fintech E-Wallet and follows the same license.
