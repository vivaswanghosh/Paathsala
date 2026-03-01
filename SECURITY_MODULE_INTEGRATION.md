# Login Activity & Security Dashboard - Integration Guide

## Overview

This module adds comprehensive login activity tracking and security monitoring to your Smart College Education Platform.

### Features
- **Personal Login History**: Users can view their own login activity
- **Admin Dashboard**: Admins/HODs can view all users' login history
- **Suspicious Activity Detection**: Automatic detection of anomalies
- **Algorand Blockchain Audit**: Immutable audit trail for suspicious events
- **Auth0 Integration**: Real-time logging via Auth0 Actions + sync from Management API

---

## Environment Variables

### Backend `.env`

```env
# Algorand (Testnet - free)
ALGORAND_ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGORAND_ALGOD_PORT=443
ALGORAND_ALGOD_TOKEN=                          # Optional for public testnet
ALGORAND_NOTARY_MNEMONIC=your 25-word mnemonic here  # Required for blockchain audit

# Auth0 Webhook Secret (generate a random string)
AUTH0_WEBHOOK_SECRET=your-random-webhook-secret-here
```

### Getting Algorand Setup

1. **Create Wallet**: Use [Pera Wallet](https://perawallet.app/) or [AlgoSigner](https://algosigner.com/)
2. **Get Testnet ALGO**: Visit [Algorand Faucet](https://bank.testnet.algorand.network/)
3. **Export Mnemonic**: Settings → Security → View Passphrase (24-25 words)
4. **Add to `.env`**: Copy the mnemonic (space-separated words)

---

## Auth0 Action Setup

### Create the Action

1. Go to **Auth0 Dashboard** → **Actions** → **Library**
2. Click **Create Action**
3. Name: `Post-Login Security Log`
4. Trigger: **Post Login**
5. Paste the code from `auth0-actions/post-login-security-log.js`

### Add Secrets

In the Action editor, add these secrets:

| Secret Name | Value |
|------------|-------|
| `WEBHOOK_URL` | `https://your-backend.com/api/security/log` |
| `WEBHOOK_SECRET` | Same as `AUTH0_WEBHOOK_SECRET` in backend |

### Deploy & Add to Flow

1. Click **Save Draft** → **Deploy**
2. Go to **Flows** → **Login**
3. Drag the action into the flow after "Credentials Exchanged"
4. Apply changes

---

## API Endpoints

### User Endpoints (All authenticated users)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/security/history` | Get current user's login history |
| GET | `/api/security/stats` | Get current user's security stats |
| GET | `/api/security/timeline` | Get activity timeline (for charts) |
| GET | `/api/security/verify/:txId` | Verify blockchain audit trail |

### Admin Endpoints (Admin/HOD only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/security/admin/all-users` | Get all users' login history |
| GET | `/api/security/admin/stats` | Get global security statistics |
| GET | `/api/security/admin/suspicious-users` | Get users with suspicious activity |
| GET | `/api/security/admin/user/:userId` | Get specific user's security details |
| GET | `/api/security/admin/users-list` | Get list of all users |
| GET | `/api/security/sync-auth0` | Sync logs from Auth0 Management API |

### Webhook Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/security/log` | Receive login events from Auth0 Action |

---

## Suspicious Activity Detection

The system automatically flags these as suspicious:

1. **Multiple Failed Attempts**: 5+ failed logins within 15 minutes
2. **New Device**: Login from a browser not seen before

When suspicious activity is detected:
- Event is flagged in the database
- Event is notarized on Algorand blockchain
- Admin can view in "Suspicious" tab

---

## Testing

### Manual Test Flow

1. **Login** to your app (triggers Auth0 Action)
2. **Navigate** to `/app/security`
3. **View** your login history
4. **Trigger** a failed login (wrong password)
5. **Refresh** to see the failed attempt logged

### Test Admin Features

1. Login as admin
2. Switch to "All Users" tab
3. Apply filters
4. Click on a user to view details
5. Check "Suspicious" tab

---

## Troubleshooting

### Logs not appearing?
1. Check Auth0 Action is deployed and in the flow
2. Verify `WEBHOOK_SECRET` matches in both Auth0 and backend
3. Check backend logs for errors on `/api/security/log`

### Blockchain notarization failing?
1. Verify Algorand mnemonic is correct
2. Ensure wallet has ALGO (testnet ALGO is free)
3. Check `algosdk` is installed

### Admin endpoints returning 403?
1. Check user's role in Auth0 custom claims
2. Verify role is `admin` or `hod`
