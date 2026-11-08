# HTTPS Configuration

**Requirement:** CPS-SR-006 - Use HTTPS for Protected Communication

**GitHub issue:** #36

## 1. Overview

The application uses HTTPS for communication between the frontend and backend in production.

HTTPS protects authentication tokens and other sensitive request data while they are transmitted over the network.

The backend uses JWT authentication through the Authorization header:

`Authorization: Bearer <token>`

## 2. Local Development

Local development can continue using HTTP.

Backend:
- Start the backend on the configured PORT (default: 5000).
- Local API URL: `http://localhost:5000`

Frontend:
- The frontend uses `VITE_API_BASE_URL`.
- If this variable is not configured, it defaults to `http://localhost:5000`.
- Production HTTPS validation is not enabled in development mode.

## 3. Production Configuration

Production deployments must use HTTPS for all frontend-to-backend API communication.

### Frontend environment variable

Configure:

`VITE_API_BASE_URL=https://your-backend-domain.example`

Replace the example with the actual HTTPS URL of the deployed backend.

The frontend validates the API URL in production and rejects non-HTTPS API URLs.

This variable must be available when building the frontend.

### Backend environment variables

Configure:

`NODE_ENV=production`

Configure `TRUSTED_PROXY` only when the backend is behind a trusted reverse proxy.

Use the actual trusted proxy IP address, subnet, or appropriate Express trust setting. Do not blindly trust forwarded headers from arbitrary clients.

The backend checks `req.secure` and rejects requests that do not arrive through HTTPS.

## 4. TLS and Reverse Proxy

TLS certificates should be configured and maintained by the production hosting platform or trusted reverse proxy.

The deployment must ensure that:

- The public frontend and backend endpoints use valid HTTPS certificates.
- HTTP requests to public production endpoints are redirected to HTTPS or rejected at the hosting platform or reverse proxy.
- The reverse proxy forwards the original protocol correctly.
- The backend is accessible only through the trusted proxy when proxy-based HTTPS termination is used.
- The backend trusts only the explicitly configured proxy.

The application does not generate or manage production TLS certificates itself.

## 5. Authentication Security

- Student and staff authentication use JWT tokens.
- Tokens are transmitted through the Authorization header.
- HTTPS protects tokens while they are in transit.
- JWT secrets must be stored in environment variables and must never be committed to source control.
- Production deployments must use a strong, unique JWT secret.

## 6. Verification Checklist

Before production deployment, verify:

- [ ] Frontend API URL uses HTTPS.
- [ ] Production environment has `NODE_ENV=production`.
- [ ] Valid TLS certificates are configured.
- [ ] HTTP access to public production endpoints is redirected or rejected.
- [ ] Trusted proxy configuration is correct, if applicable.
- [ ] Backend rejects requests that do not arrive through HTTPS.
- [ ] Student and staff authentication requests work over HTTPS.
- [ ] Local development continues to work over HTTP.
- [ ] No production API endpoint uses an insecure HTTP URL.

## 7. Important Notes

Do not use the example domain or placeholder secrets in production.

Do not expose `.env` files, JWT secrets, or authentication tokens in source control, screenshots, logs, or test evidence.
