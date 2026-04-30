# Tracksup - API Documentation

## Base URL
Development: `http://localhost:3000/api`
Production: `https://your-api.render.com/api`

## Authentication
All protected routes require a Bearer token in the `Authorization` header.
`Authorization: Bearer <JWT_TOKEN>`

Organization-specific actions require the `x-organization-id` header.
`x-organization-id: <ORG_ID>`

## Endpoints

### Auth
- `POST /auth/register`: Create a new user account.
- `POST /auth/login`: Authenticate and receive a token.

### Organizations
- `GET /organizations`: List user's organizations.
- `POST /organizations`: Create a new organization.
- `GET /organizations/:id`: Get organization details.

### Orders
- `GET /orders`: List orders for the active organization.
- `POST /orders`: Create a new order node.

### Employees
- `GET /employees`: List employees in the organization.

### Invites
- `POST /organizations/:id/invites`: Send a referral invite.
