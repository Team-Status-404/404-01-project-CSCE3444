# Security Policy for StockIQ

## Supported Versions
Currently, Team 404 is actively supporting the following branches of the StockIQ project:

| Version / Branch | Supported          |
| ---------------- | ------------------ |
| `main`           | :white_check_mark: |
| `dev`            | :white_check_mark: |
| Older branches   | :x:                |

## Security Architecture & Scope
With the ongoing updates to StockIQ for production deployment, our security footprint includes:
- **Authentication:** Custom email/password authentication (using bcrypt for hashing) and Google OAuth 2.0.
- **Session Management:** JSON Web Tokens (JWT) using HS256 signatures, valid for 24 hours.
- **Network Security:** Cross-Origin Resource Sharing (CORS) policies restricting backend access, alongside API rate-limiting on yfinance and NLP endpoints to prevent abuse.
- **Data Privacy:** User profiles, securely hashed passwords, and associated watchlist/portfolio data.

### Out of Scope / Accepted Risks
Please note the following are **not** considered security vulnerabilities:
- The `VITE_GOOGLE_CLIENT_ID` used in the frontend is public by design for Google OAuth and is not a secret.
- The `GOOGLE_CLIENT_ID` used in the backend is an identifier for the application and is not a secret.

## Reporting a Vulnerability
We take the security of StockIQ seriously. If you discover a security vulnerability within this project (such as a JWT bypass, unauthorized data access, or an issue with the authentication flow), please **do not** open a public GitHub Issue. 

Instead, please send an email directly to the Repository Owner:
**David Oladipupo** at `DavidOladipupo@my.unt.edu`

**Please include the following in your report:**
* A clear description of the vulnerability and its potential impact.
* Exact steps to reproduce the issue.
* Any relevant logs, screenshots, or code snippets.

We will acknowledge receipt of your vulnerability report within 48 hours and strive to provide regular updates regarding our progress in addressing it.
