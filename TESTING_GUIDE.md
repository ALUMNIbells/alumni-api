# Shipgate Auth API - Testing Guide

## Prerequisites
- Node.js running
- MongoDB connected
- `.env` file configured with:
  - MONGO_URI
  - JWT_SECRET
  - RESEND_API_KEY
  - FRONTEND_URL

---

## Testing Workflow

### Step 1: Start the Server
```bash
npm run dev
```
Expected: "Server started on port 5000" + "Connected to MongoDB"

---

### Step 2: Test Customer Registration

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Customer",
    "email": "test@example.com",
    "phone": "+2348012345678",
    "address": "123 Test Street, Lagos, Nigeria",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "userId": "...",
  "userType": "customer"
}
```

**Verify:**
- ✓ Customer created in MongoDB
- ✓ Verification email sent
- ✓ User not verified yet

---

### Step 3: Verify Email

Since Resend sends real emails, check your email inbox or use Resend dashboard to get the verification token. For testing, you can modify the auth controller temporarily to log tokens.

**Mock Token Approach (for testing only):**
In `controllers/auth/index.js`, after generating verification token, log it:
```javascript
console.log("Verification Token:", verificationToken);
```

Then use that token:

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_VERIFICATION_TOKEN_HERE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

---

### Step 4: Test Login

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "fullName": "Test Customer",
    "email": "test@example.com",
    "userType": "customer",
    "phone": "+2348012345678",
    "verified": true
  }
}
```

**Save the token for next steps:**
```bash
TOKEN="YOUR_JWT_TOKEN_HERE"
```

---

### Step 5: Test Get Current User

**Request:**
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "fullName": "Test Customer",
    "email": "test@example.com",
    "userType": "customer",
    "phone": "+2348012345678",
    "verified": true,
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

---

### Step 6: Test Courier Registration

Now test adding a courier as Super Admin.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/courier/add \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Courier",
    "email": "courier@example.com",
    "phone": "+2348012345679",
    "address": "456 Delivery Lane, Lagos, Nigeria",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "courierLicense": "DL123456789",
    "vehicleType": "motorcycle"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Courier added successfully. Verification email sent.",
  "courier": {
    "id": "...",
    "fullName": "Test Courier",
    "email": "courier@example.com",
    "phone": "+2348012345679",
    "vehicleType": "motorcycle"
  }
}
```

---

### Step 7: Test Staff Registration

Test adding staff as Super Admin.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/staff/add \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Staff",
    "email": "staff@example.com",
    "phone": "+2348012345680",
    "address": "789 Hub Road, Lagos, Nigeria",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "checkpoint": "Lagos Main Hub",
    "checkpointCode": "LG001",
    "department": "Sorting"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Staff member added successfully. Verification email sent.",
  "staff": {
    "id": "...",
    "fullName": "Test Staff",
    "email": "staff@example.com",
    "phone": "+2348012345680",
    "checkpoint": "Lagos Main Hub",
    "checkpointCode": "LG001"
  }
}
```

---

### Step 8: Test Password Reset

**Request 1 - Send Reset:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/password-reset/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

**Request 2 - Verify & Reset (use token from email/logs):**
```bash
curl -X POST http://localhost:5000/api/v1/auth/password-reset/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN_HERE",
    "newPassword": "NewPassword456!",
    "confirmPassword": "NewPassword456!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successfully..."
}
```

---

### Step 8: Test Admin Creation (Super Admin)

First, you need a Super Admin in your database. For testing, manually create one in MongoDB:

```javascript
// In MongoDB shell
db.superadmins.insertOne({
  fullName: "Super Admin",
  email: "superadmin@example.com",
  phone: "+2348012345681",
  password: "$2a$10$...", // hashed password (use same password hash as others)
  verified: true,
  employeeId: "SUPER001",
  userType: "super_admin",
  adminLevel: 3,
  permissions: ["all"],
  isActive: true
})
```

Or create via code:
```javascript
import bcrypt from "bcryptjs";
import { SuperAdmin } from "./models/User.js";

const password = "AdminPassword123!";
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

const superAdmin = new SuperAdmin({
  fullName: "Super Admin",
  email: "superadmin@example.com",
  phone: "+2348012345681",
  address: "999 Admin Headquarters, Lagos, Nigeria",
  password: hashedPassword,
  verified: true,
  userType: "super_admin",
  adminLevel: 3,
  permissions: ["all"],
  isActive: true
});

await superAdmin.save();
```

**Login as Super Admin:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "AdminPassword123!"
  }'
```

Save the token:
```bash
SUPER_ADMIN_TOKEN="YOUR_SUPER_ADMIN_TOKEN"
```

---

### Step 9: Test Add Admin

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/admin/add \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Admin",
    "email": "admin@example.com",
    "phone": "+2348012345682",
    "address": "555 Admin Street, Lagos, Nigeria",
    "password": "AdminPassword123!",
    "confirmPassword": "AdminPassword123!",
    "department": "Operations",
    "permissions": ["manage_shipments", "view_reports"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin added successfully...",
  "admin": {
    "id": "...",
    "fullName": "Test Admin",
    "email": "admin@example.com",
    "department": "Operations"
  }
}
```

---

### Step 10: Test Get All Admins

**Request:**
```bash
curl -X GET "http://localhost:5000/api/v1/auth/admins?page=1&limit=10" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "admins": [
    {
      "_id": "...",
      "fullName": "Test Admin",
      "email": "admin@example.com",
      "employeeId": "ADM001",
      "department": "Operations",
      "verified": false,
      "createdAt": "..."
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

### Step 11: Test Delete Admin

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/v1/auth/admin/ADMIN_ID_HERE \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

---

## Error Testing

### Test Missing Fields
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "status": 400,
  "message": "Please provide all required fields"
}
```

### Test Duplicate Email
```bash
# Try registering with same email twice
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test",
    "email": "duplicate@example.com",
    ...
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "status": 409,
  "message": "Email already registered"
}
```

### Test Invalid Token
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"
```

**Expected Error:**
```json
{
  "success": false,
  "status": 403,
  "message": "Token is not valid!"
}
```

### Test Unauthorized Access
```bash
curl -X POST http://localhost:5000/api/v1/auth/admin/add \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d {...}
```

**Expected Error:**
```json
{
  "success": false,
  "status": 403,
  "message": "Only super admins can access this resource"
}
```

---

## MongoDB Queries for Verification

```javascript
// Count users by type
db.customers.countDocuments();
db.couriers.countDocuments();
db.staffs.countDocuments();
db.admins.countDocuments();
db.superadmins.countDocuments();

// Find user by email
db.customers.findOne({ email: "test@example.com" });

// Check verified status
db.customers.find({ verified: true });

// View all users with their ID
db.customers.find({}, { fullName: 1, email: 1, _id: 1, verified: 1 });

// Check all user types by Super Admin
db.superadmins.findOne({}, { addedAdmins: 1, addedCouriers: 1, addedStaff: 1 });
```

---

## Postman Collection

You can import these as a Postman collection for easier testing:
1. Create new collection: "Shipgate Auth"
2. Add requests from above
3. Use collection variables for TOKEN and SUPER_ADMIN_TOKEN
4. Test entire flow sequentially

---

## Common Issues & Solutions

**"Connected to MongoDB" but operations fail**
- Check database connection
- Verify collections are being created
- Check MongoDB logs

**Email not sending**
- Verify RESEND_API_KEY is valid
- Check API key has correct permissions
- Verify sender email is authorized

**Token verification fails**
- Ensure JWT_SECRET matches between encoding/decoding
- Check token hasn't expired
- Verify "Bearer " prefix is included

**Admin can't access protected routes**
- Verify admin is verified first
- Check adminLevel and userType in token
- Verify token hasn't expired

---

## Performance Considerations

- Email sending is async - won't block request
- Password hashing with bcrypt takes ~100ms per call
- JWT verification is fast (<1ms)
- Recommended: Add rate limiting on auth endpoints

---
