# User Management & Profiles

Comprehensive guide to user management, profile operations, and administrative functions in ReadZone.

## Table of Contents

- [Overview](#overview)
- [User Profile API](#user-profile-api)
- [Admin User Management API](#admin-user-management-api)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Account Deletion](#account-deletion)
- [Audit Logging](#audit-logging)
- [Best Practices](#best-practices)

## Overview

The User Management system provides:

- **Self-Service Profile Management**: Users can view, update, and delete their own profiles
- **Administrative User Management**: Admins can list, view, modify, and delete user accounts
- **Role-Based Access Control**: Granular permission system with 5 role levels
- **Soft-Delete with Grace Period**: 30-day grace period before permanent deletion
- **Comprehensive Audit Logging**: All critical actions are logged for security and compliance

## User Profile API

### Authentication Required

All user profile endpoints require a valid JWT token in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

### GET /users/me - Get Profile

Retrieve the authenticated user's profile information.

**Request:**

```http
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "emailVerified": true,
  "mfaEnabled": false,
  "hasPassword": true,
  "oauthConnections": [
    {
      "provider": "GOOGLE",
      "email": "user@gmail.com",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-12-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Use Cases:**

- Display user profile in UI
- Check OAuth connections status
- Verify MFA and email verification status
- Determine if user has password (for OAuth-only accounts)

### PATCH /users/me - Update Profile

Update the authenticated user's profile information.

**Request:**

```http
PATCH /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "name": "Jane Doe"
}
```

**Email Change Workflow:**

1. New email is saved but `emailVerified` is set to `false`
2. Verification email is sent to new email address
3. User must verify new email within expiration period
4. Audit log is created with MEDIUM severity

**Response (200 OK):**

```json
{
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "emailVerified": false,
  "message": "Verification email sent to newemail@example.com"
}
```

**Error Cases:**

- `409 Conflict`: Email already in use
- `400 Bad Request`: Invalid email format

### DELETE /users/me - Delete Account

Soft-delete the authenticated user's account with 30-day grace period.

**Request:**

```http
DELETE /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "password": "UserPassword123!",
  "confirmDeletion": true
}
```

**Important Notes:**

- **Password Required**: Users with passwords must provide their password for security
- **OAuth-Only Users**: Users without passwords can skip password verification
- **30-Day Grace Period**: Account status is set to `DELETED`, but data is preserved for 30 days
- **Session Revocation**: All active sessions are immediately revoked
- **Permanent Deletion**: After 30 days, a background job permanently deletes the account

**Response (200 OK):**

```json
{
  "message": "Account marked for deletion with 30-day grace period",
  "deletedAt": "2025-01-08T00:00:00.000Z",
  "gracePeriodEndsAt": "2025-02-07T00:00:00.000Z"
}
```

**Error Cases:**

- `401 Unauthorized`: Invalid password
- `400 Bad Request`: `confirmDeletion` must be `true`

## Admin User Management API

### Role Requirements

All admin endpoints require `ADMIN` or `SUPERADMIN` role.

### GET /admin/users - List Users

List all users with pagination, filtering, and sorting.

**Request:**

```http
GET /api/v1/admin/users?page=1&limit=20&role=USER&status=ACTIVE&search=john&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter   | Type    | Default     | Description                                      |
| ----------- | ------- | ----------- | ------------------------------------------------ |
| `page`      | integer | `1`         | Page number (1-indexed)                          |
| `limit`     | integer | `20`        | Items per page (max: 100)                        |
| `role`      | enum    | -           | Filter by role (ANONYMOUS, USER, MODERATOR, etc) |
| `status`    | enum    | -           | Filter by status (ACTIVE, SUSPENDED, DELETED)    |
| `search`    | string  | -           | Search by email or name (case-insensitive)       |
| `sortBy`    | string  | `createdAt` | Sort field (createdAt, email, role, status)      |
| `sortOrder` | string  | `desc`      | Sort order (asc, desc)                           |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "status": "ACTIVE",
      "emailVerified": true,
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /admin/users/:id - Get User Details

Retrieve detailed information about a specific user.

**Request:**

```http
GET /api/v1/admin/users/uuid
Authorization: Bearer <admin_token>
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "status": "ACTIVE",
    "emailVerified": true,
    "mfaEnabled": false,
    "hasPassword": true,
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "oauthConnections": [
    {
      "id": "uuid",
      "provider": "GOOGLE",
      "email": "user@gmail.com",
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "recentSessions": [
    {
      "id": "uuid",
      "deviceInfo": { "browser": "Chrome", "os": "Windows" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-08T10:00:00.000Z",
      "expiresAt": "2025-01-08T11:00:00.000Z",
      "isActive": true
    }
  ],
  "recentAuditLogs": [
    {
      "id": "uuid",
      "action": "LOGIN",
      "severity": "INFO",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {},
      "createdAt": "2025-01-08T10:00:00.000Z"
    }
  ]
}
```

**Security Notes:**

- Password hashes are NEVER included in responses
- TOTP secrets and backup codes are NEVER exposed
- Sensitive fields are automatically filtered

### PATCH /admin/users/:id - Update User

Admin-only endpoint to modify user information.

**Request:**

```http
PATCH /api/v1/admin/users/uuid
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "MODERATOR",
  "status": "ACTIVE",
  "emailVerified": true
}
```

**Safety Rules:**

1. **Cannot Modify Self**: Admin cannot modify their own account (prevents privilege loss)
2. **Cannot Assign ANONYMOUS**: ANONYMOUS role is reserved for non-logged-in users
3. **Cannot Assign DELETED**: Use DELETE endpoints for account deletion
4. **Session Revocation on Suspension**: Setting status to SUSPENDED revokes all active sessions

**Audit Logging:**

- **Role Change**: Creates CRITICAL audit log
- **Account Suspension**: Creates CRITICAL audit log
- **Other Changes**: Creates MEDIUM audit log

**Response (200 OK):**

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "MODERATOR",
    "status": "ACTIVE",
    "emailVerified": true
  }
}
```

**Error Cases:**

- `400 Bad Request`: Attempting to modify own account, invalid role/status
- `404 Not Found`: User not found

### DELETE /admin/users/:id/force-delete - Force Delete User

Permanently delete a user account immediately (no grace period).

**Request:**

```http
DELETE /api/v1/admin/users/uuid/force-delete
Authorization: Bearer <admin_token>
```

**Effects:**

1. **Physical Deletion**: User record is permanently deleted from database
2. **CASCADE Deletion**: Related records are automatically deleted:
   - Sessions
   - OAuth connections
   - MFA settings
   - Email/password reset tokens
3. **Audit Log Preservation**: Audit logs are preserved with `userId` set to `null`
4. **Irreversible**: This operation cannot be undone

**Safety Rules:**

- Cannot delete own account (prevents self-destruction)
- Creates CRITICAL audit log before deletion
- Requires ADMIN or SUPERADMIN role

**Response (200 OK):**

```json
{
  "message": "User permanently deleted",
  "userId": "uuid",
  "deletedAt": "2025-01-08T10:00:00.000Z"
}
```

**GDPR Compliance:**

This endpoint ensures "right to be forgotten" compliance while preserving audit trails for legal/compliance purposes.

## Role-Based Access Control (RBAC)

### Role Hierarchy

ReadZone implements a 5-level role hierarchy:

| Role         | Level | Description                 | Capabilities                                 |
| ------------ | ----- | --------------------------- | -------------------------------------------- |
| `ANONYMOUS`  | 0     | Non-logged-in users         | Read-only access, cannot write reviews       |
| `USER`       | 1     | Regular authenticated users | Write reviews, manage own profile            |
| `MODERATOR`  | 2     | Content moderators          | Moderate content, flag inappropriate reviews |
| `ADMIN`      | 3     | System administrators       | Manage users, configure system settings      |
| `SUPERADMIN` | 4     | Super administrators        | Full system access, can modify other admins  |

### Permission Matrix

| Endpoint                               | ANONYMOUS | USER | MODERATOR | ADMIN | SUPERADMIN |
| -------------------------------------- | --------- | ---- | --------- | ----- | ---------- |
| `GET /users/me`                        | ❌        | ✅   | ✅        | ✅    | ✅         |
| `PATCH /users/me`                      | ❌        | ✅   | ✅        | ✅    | ✅         |
| `DELETE /users/me`                     | ❌        | ✅   | ✅        | ✅    | ✅         |
| `GET /admin/users`                     | ❌        | ❌   | ❌        | ✅    | ✅         |
| `GET /admin/users/:id`                 | ❌        | ❌   | ❌        | ✅    | ✅         |
| `PATCH /admin/users/:id`               | ❌        | ❌   | ❌        | ✅    | ✅         |
| `DELETE /admin/users/:id/force-delete` | ❌        | ❌   | ❌        | ✅    | ✅         |

### Implementation

**RolesGuard:**

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminController {
  // Admin-only endpoints
}
```

**@Roles() Decorator:**

```typescript
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

## Account Deletion

### Soft-Delete (User Initiated)

**Endpoint:** `DELETE /users/me`

**Process:**

1. User requests account deletion with password confirmation
2. Account status is set to `DELETED`
3. `deletedAt` timestamp is recorded
4. All active sessions are revoked
5. **30-Day Grace Period**: User can contact support to restore account
6. After 30 days, background job permanently deletes account

**Benefits:**

- Prevents accidental deletions
- Allows account recovery if user changes mind
- Maintains data integrity during grace period

### Force-Delete (Admin Initiated)

**Endpoint:** `DELETE /admin/users/:id/force-delete`

**Process:**

1. Admin requests immediate permanent deletion
2. Audit log is created with CRITICAL severity
3. User record is physically deleted
4. Related records are CASCADE deleted
5. Audit logs are preserved with `userId = null`

**Use Cases:**

- GDPR "right to be forgotten" requests
- Spam/abuse account cleanup
- Legal/compliance requirements

**Comparison:**

| Feature          | Soft-Delete (User)   | Force-Delete (Admin)    |
| ---------------- | -------------------- | ----------------------- |
| Who can initiate | User                 | Admin/Superadmin        |
| Grace period     | 30 days              | None (immediate)        |
| Can be restored  | Yes (within 30 days) | No (irreversible)       |
| Sessions revoked | Yes                  | Yes                     |
| Related records  | Preserved            | CASCADE deleted         |
| Audit logs       | Preserved            | Preserved (userId=null) |
| GDPR compliant   | After 30 days        | Yes (immediate)         |

## Audit Logging

### Purpose

Audit logging provides:

- **Security Monitoring**: Track suspicious activities and security incidents
- **Compliance**: Meet regulatory requirements (GDPR, SOC 2, etc.)
- **Debugging**: Investigate user-reported issues
- **Analytics**: Understand user behavior patterns

### Audit Actions

All user management operations create audit logs:

| Action                 | Severity | Trigger                     |
| ---------------------- | -------- | --------------------------- |
| `PROFILE_UPDATE`       | MEDIUM   | User updates email/name     |
| `ROLE_CHANGE`          | CRITICAL | Admin changes user role     |
| `ACCOUNT_SUSPEND`      | CRITICAL | Admin suspends user account |
| `ACCOUNT_DELETE`       | CRITICAL | User soft-deletes account   |
| `ACCOUNT_FORCE_DELETE` | CRITICAL | Admin force-deletes account |

### Severity Levels

| Level      | Description                 | Example Actions                   |
| ---------- | --------------------------- | --------------------------------- |
| `INFO`     | Normal events               | Login success, logout             |
| `WARNING`  | Attention needed            | Login failure, invalid password   |
| `MEDIUM`   | Moderate importance         | Profile updates, settings changes |
| `CRITICAL` | Immediate response required | Role changes, account suspension  |

### Audit Log Structure

```json
{
  "id": "uuid",
  "userId": "uuid | null",
  "action": "ROLE_CHANGE",
  "severity": "CRITICAL",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "adminId": "admin-uuid",
    "changes": {
      "role": "MODERATOR"
    },
    "previousValues": {
      "role": "USER"
    }
  },
  "timestamp": "2025-01-08T10:00:00.000Z"
}
```

### Querying Audit Logs

**Get recent audit logs for a user:**

```typescript
const auditLogs = await prisma.auditLog.findMany({
  where: { userId: 'uuid' },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

**Find all CRITICAL actions:**

```typescript
const criticalLogs = await prisma.auditLog.findMany({
  where: { severity: 'CRITICAL' },
  orderBy: { createdAt: 'desc' },
});
```

**Track actions by a specific admin:**

```typescript
const adminActions = await prisma.auditLog.findMany({
  where: {
    metadata: {
      path: ['adminId'],
      equals: 'admin-uuid',
    },
  },
});
```

## Best Practices

### Security

1. **Password Verification**: Always require password for destructive actions
2. **Confirmation Flags**: Use `confirmDeletion` to prevent accidental operations
3. **Session Revocation**: Immediately revoke sessions on status changes
4. **Audit Everything**: Log all CRITICAL actions with full context
5. **Self-Modification Prevention**: Prevent admins from modifying their own accounts

### Error Handling

1. **Meaningful Error Messages**: Provide clear, actionable error messages
2. **Appropriate Status Codes**: Use correct HTTP status codes (400, 401, 403, 404, 409)
3. **Never Expose Sensitive Data**: Never include passwords, secrets in error responses
4. **Log Failures**: Log failed operations for security monitoring

### Performance

1. **Pagination**: Always use pagination for list endpoints (default: 20 items)
2. **Selective Field Inclusion**: Only include necessary fields in responses
3. **Index Usage**: Leverage database indexes for filtering and sorting
4. **Caching**: Consider caching frequently accessed user data

### Compliance

1. **GDPR Right to be Forgotten**: Use force-delete for immediate deletion requests
2. **Audit Trail Preservation**: Keep audit logs even after user deletion
3. **Data Minimization**: Only collect and store necessary user data
4. **Transparent Communication**: Clearly communicate deletion process to users

## Background Jobs

### Cleanup Deleted Users (Pseudocode)

**Implementation**: Deferred to Phase 3 (out of current scope)

**Purpose**: Automatically delete accounts after 30-day grace period

**Schedule**: Daily at 02:00 AM server time

**Process:**

```typescript
// Pseudocode - Not implemented yet
async cleanupDeletedUsers() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const usersToDelete = await prisma.user.findMany({
    where: {
      status: UserStatus.DELETED,
      deletedAt: { lt: cutoffDate },
    },
  });

  for (const user of usersToDelete) {
    // Preserve audit logs
    await prisma.auditLog.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });

    // Physically delete user (CASCADE via Prisma schema)
    await prisma.user.delete({ where: { id: user.id } });
  }
}
```

## Related Documentation

- [API Reference](../README.md#api-endpoints)
- [Authentication](./authentication.md)
- [Database Schema](../prisma/schema.prisma)
- [Audit Logging](./audit-logging.md)

## Support

For questions or issues, please refer to:

- [GitHub Issues](https://github.com/your-org/readzone/issues)
- [API Documentation](./api-reference.md)
- [Security Policy](../SECURITY.md)
