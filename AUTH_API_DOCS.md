# Shipgate Authentication API Documentation

## Overview
Complete authentication system supporting multiple user types: Customers, Couriers, Staff, Admins, and Super Admins.

## Environment Variables Required
Add these to your `.env` file:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
RESEND_API_KEY=your_resend_email_api_key
FRONTEND_URL=http://localhost:3000
```

---

## API Endpoints

### 1. Public Auth Endpoints

#### **POST /api/v1/auth/signup**
Register a new customer account

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+234801234567",
  "address": "123 Main St, Lagos, Nigeria",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "userId": "60d5ec49d1c7f12345678901",
  "userType": "customer"
}
```

**Notes:**
- Only customers can self-register
- Couriers, Staff, and Admins must be added by Super Admin
- Email verification is required before login
- Password must be at least 8 characters

---

#### **POST /api/v1/auth/login**
Login for all regular users

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49d1c7f12345678901",
    "fullName": "John Doe",
    "email": "john@example.com",
    "userType": "customer",
    "phone": "+234801234567",
    "verified": true
  }
}
```

---

#### **POST /api/v1/auth/verify-email**
Verify email address

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

---

#### **POST /api/v1/auth/resend-token**
Resend verification email

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Verification token sent to your email"
}
```

---

#### **POST /api/v1/auth/password-reset/send**
Request password reset

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

#### **POST /api/v1/auth/password-reset/verify**
Reset password with token

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

### 2. Admin Authentication

#### **POST /api/v1/auth/admin-login**
Login for Admin and Super Admin users

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49d1c7f12345678901",
    "fullName": "Admin User",
    "email": "admin@example.com",
    "userType": "admin",
    "employeeId": "ADM001",
    "adminLevel": 1
  }
}
```

---

### 3. Super Admin Operations

#### **POST /api/v1/auth/admin/add**
Add a new Admin (Super Admin only)

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Request Body:**
```json
{
  "fullName": "New Admin",
  "email": "newadmin@example.com",
  "phone": "+234801234567",
  "address": "456 Admin St, Lagos, Nigeria",
  "password": "AdminPassword123!",
  "confirmPassword": "AdminPassword123!",
  "department": "Operations",
  "permissions": ["manage_shipments", "view_reports"]
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Admin added successfully. Verification email sent.",
  "admin": {
    "id": "60d5ec49d1c7f12345678901",
    "fullName": "New Admin",
    "email": "newadmin@example.com",
    "department": "Operations"
  }
}
```

---

#### **POST /api/v1/auth/courier/add**
Add a new Courier (Super Admin only)

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Request Body:**
```json
{
  "fullName": "Courier John",
  "email": "courier@example.com",
  "phone": "+234809876543",
  "address": "789 Delivery Ave, Lagos, Nigeria",
  "password": "CourierPassword123!",
  "confirmPassword": "CourierPassword123!",
  "courierLicense": "DL123456789",
  "vehicleType": "motorcycle"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Courier added successfully. Verification email sent.",
  "courier": {
    "id": "60d5ec49d1c7f12345678902",
    "fullName": "Courier John",
    "email": "courier@example.com",
    "phone": "+234809876543",
    "vehicleType": "motorcycle"
  }
}
```

---

#### **POST /api/v1/auth/staff/add**
Add a new Staff member (Super Admin only)

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Request Body:**
```json
{
  "fullName": "Staff Member",
  "email": "staff@example.com",
  "phone": "+234808765432",
  "address": "321 Hub Road, Lagos, Nigeria",
  "password": "StaffPassword123!",
  "confirmPassword": "StaffPassword123!",
  "checkpoint": "Lagos Main Hub",
  "checkpointCode": "LG001",
  "department": "Sorting"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Staff member added successfully. Verification email sent.",
  "staff": {
    "id": "60d5ec49d1c7f12345678903",
    "fullName": "Staff Member",
    "email": "staff@example.com",
    "phone": "+234808765432",
    "checkpoint": "Lagos Main Hub",
    "checkpointCode": "LG001"
  }
}
```

---

#### **GET /api/v1/auth/admins**
Get all admins (Super Admin only)

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Query Parameters:**
```
?page=1&limit=10&department=Operations
```

**Response (Success - 200):**
```json
{
  "success": true,
  "admins": [
    {
      "_id": "60d5ec49d1c7f12345678901",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "employeeId": "ADM001",
      "department": "Operations",
      "adminLevel": 1,
      "verified": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

#### **DELETE /api/v1/auth/admin/:adminId**
Delete an admin (Super Admin only)

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

---

### 4. User Profile

#### **GET /api/v1/auth/me**
Get current authenticated user profile

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "_id": "60d5ec49d1c7f12345678901",
    "fullName": "John Doe",
    "email": "john@example.com",
    "userType": "customer",
    "phone": "+234801234567",
    "verified": true,
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

---

## User Types & Fields

### Customer
- fullName ✓
- email ✓
- phone ✓
- address ✓
- password ✓

### Courier (Added by Super Admin)
- fullName ✓
- email ✓
- phone ✓
- address ✓
- password ✓
- courierLicense ✓
- vehicleType ✓
- isAvailable (default: true)
- rating (default: 0)
- shipmentsDelivered (default: 0)

### Staff (Added by Super Admin)
- fullName ✓
- email ✓
- phone ✓
- address ✓
- password ✓
- checkpoint ✓
- checkpointCode ✓
- department (optional)

### Admin (Added by Super Admin)
- fullName ✓
- email ✓
- phone ✓
- address ✓
- password ✓
- department (optional)
- permissions (array)
- adminLevel (1 = Admin, 2 = Senior Admin)

### Super Admin
- fullName ✓
- email ✓
- phone ✓
- address ✓
- password ✓
- adminLevel (3 = Super Admin)
- permissions (all)

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "status": 400,
  "message": "Please provide all required fields"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "status": 401,
  "message": "You are not authenticated. Please provide a token."
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "status": 403,
  "message": "Only super admins can access this resource"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "status": 404,
  "message": "User not found"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "status": 409,
  "message": "Email already registered"
}
```

---

## Authentication Flow

### Regular User (Customer/Courier/Staff)
1. **POST /signup** → Register with email
2. **Check email** → Click verification link with token
3. **POST /verify-email** → Verify email
4. **POST /login** → Get JWT token
5. **Use token** → Include in `Authorization: Bearer <token>` header

### Admin User
1. Super Admin creates admin via **POST /admin/add**
2. Admin receives email with verification link
3. Admin clicks link to verify email
4. **POST /admin-login** → Login with credentials
5. Get JWT token for authenticated requests

### Password Recovery
1. **POST /password-reset/send** → Request reset
2. Click link in email
3. **POST /password-reset/verify** → Submit new password
4. Login with new password

---

## Middleware & Role-Based Access

### Available Middleware
- `verifyToken` - Verify JWT token (all authenticated routes)
- `verifySuperAdmin` - Super Admin only
- `verifyAdmin` - Admin or Super Admin
- `verifyCourier` - Courier only
- `verifyStaff` - Staff only
- `verifyCustomer` - Customer only

### Example Usage in Routes
```javascript
import { verifyToken, verifySuperAdmin } from "../middleware/auth.js";

router.get("/admin-dashboard", verifyToken, verifySuperAdmin, controllerFunction);
```

---

## Testing with cURL

### Signup
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+234801234567",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!",
    "userType": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Token Structure

JWT tokens include:
- `userId` - Unique user ID in database
- `userType` - User type (customer, courier, staff, admin, super_admin)
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

Decode any token at [jwt.io](https://jwt.io) to verify structure.

---

## Security Best Practices

1. ✓ Passwords hashed with bcrypt (salt rounds: 10)
2. ✓ Tokens expire after configured time (default: 7 days)
3. ✓ Email verification required before login
4. ✓ Password reset tokens expire in 1 hour
5. ✓ Verification tokens expire in 24 hours
6. ✓ Role-based access control on sensitive endpoints
7. ✓ Never return passwords in responses
8. ✓ All emails in database stored as lowercase

---

## Next Steps

1. Set up email templates for better UX
2. Add phone number verification
3. Implement 2FA for admins
4. Add account activity logging
5. Implement request rate limiting
6. Add OAuth integrations (Google, etc.)
