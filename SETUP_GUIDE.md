# Shipgate Auth System - Setup & Quick Reference

## 🚀 What's Been Implemented

### User Types
✅ **Customer** - Regular users sending shipments  
✅ **Courier** - Delivery personnel with ratings & vehicle info  
✅ **Staff** - Checkpoint personnel managing shipment status  
✅ **Admin** - Platform admins managing operations  
✅ **Super Admin** - Can add/remove other admins  

### Authentication Features
✅ Multi-user type registration  
✅ Email verification with tokens (24hr expiry)  
✅ Secure login with JWT  
✅ Password reset with email (1hr expiry)  
✅ Token verification & role-based middleware  
✅ Admin management (add/delete/list admins)  
✅ User profile retrieval  
✅ Last login tracking  

---

## 📋 Files Created/Modified

```
✅ models/User.js - 5 user schemas (Customer, Courier, Staff, Admin, SuperAdmin)
✅ controllers/auth/index.js - 14 auth functions
✅ middleware/auth.js - 7 auth middleware functions
✅ middleware/errorHandler.js - Global error handler
✅ routes/v1/auth.js - All auth endpoints
✅ index.js - Error handler integration
✅ AUTH_API_DOCS.md - Complete API documentation
```

---

## ⚙️ Required Environment Variables

Add to your `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/shipgate
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🔐 API Endpoints Summary

### Public (No Auth)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/signup` | Register new customer |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/verify-email` | Verify email with token |
| POST | `/api/v1/auth/resend-token` | Resend verification email |
| POST | `/api/v1/auth/password-reset/send` | Request password reset |
| POST | `/api/v1/auth/password-reset/verify` | Reset password with token |
| POST | `/api/v1/auth/admin-login` | Admin/Super Admin login |

### Protected (Super Admin Only)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/admin/add` | Add new admin |
| POST | `/api/v1/auth/courier/add` | Add new courier |
| POST | `/api/v1/auth/staff/add` | Add new staff member |
| DELETE | `/api/v1/auth/admin/:adminId` | Delete admin |
| GET | `/api/v1/auth/admins` | List all admins |

### Protected (Any Authenticated User)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/auth/me` | Get current user profile |

---

## 📝 Example Requests

### 1. Register Customer
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "address": "123 Main Street, Lagos, Nigeria",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'
```

### 2. Login Customer
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'
```

### 3. Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Password123!"
  }'
```

### 4. Add Courier (Super Admin Only)
```bash
curl -X POST http://localhost:5000/api/v1/auth/courier/add \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Courier John",
    "email": "courier@example.com",
    "phone": "+2348012345679",
    "address": "456 Delivery Ave, Lagos, Nigeria",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "courierLicense": "DL123456",
    "vehicleType": "motorcycle"
  }'
```

### 5. Add Staff Member (Super Admin Only)
```bash
curl -X POST http://localhost:5000/api/v1/auth/staff/add \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Staff Member",
    "email": "staff@example.com",
    "phone": "+2348012345680",
    "address": "789 Hub Road, Lagos, Nigeria",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "checkpoint": "Lagos Main Hub",
    "checkpointCode": "LG001",
    "department": "Sorting"
  }'
```

### 6. Add Admin (Super Admin Only)
```bash
curl -X POST http://localhost:5000/api/v1/auth/admin/add \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "New Admin",
    "email": "newadmin@example.com",
    "phone": "+2348012345681",
    "address": "321 Admin Plaza, Lagos, Nigeria",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "department": "Operations",
    "permissions": ["manage_shipments", "view_reports"]
  }'
```

### 7. Get Current User
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ How to Use Middleware in Routes

### Protect routes for specific user types:

```javascript
import { verifyToken, verifySuperAdmin, verifyAdmin, verifyCourier, verifyStaff, verifyCustomer } from "./middleware/auth.js";
import router from "express";

// Super Admin only
router.get("/dashboard", verifyToken, verifySuperAdmin, controllerFunction);

// Admin or Super Admin
router.get("/admin-panel", verifyToken, verifyAdmin, controllerFunction);

// Couriers only
router.get("/my-deliveries", verifyToken, verifyCourier, controllerFunction);

// Staff only
router.post("/update-status", verifyToken, verifyStaff, controllerFunction);

// Customers only
router.get("/my-shipments", verifyToken, verifyCustomer, controllerFunction);

// Any authenticated user
router.get("/profile", verifyToken, controllerFunction);
```

---

## 🎯 Next Steps for Your App

1. **Shipment Model** - Create shipment schema with status tracking
2. **Shipment Routes** - Implement CRUD operations for shipments
3. **Status Updates** - Staff/Courier update shipment status
4. **Notifications** - Email/SMS when shipment status changes
5. **Payment Integration** - Handle payment processing
6. **Dashboard** - Admin dashboard for analytics
7. **Rate Limiting** - Prevent abuse on auth endpoints
8. **Logging** - Add comprehensive logging system
9. **Testing** - Write tests for all auth functions
10. **Frontend** - Build signup/login UI

---

## 📋 Field Requirements by User Type

| Field | Customer | Courier | Staff | Admin | Super Admin |
|-------|----------|---------|-------|-------|-------------|
| fullName | ✓ | ✓ | ✓ | ✓ | ✓ |
| email | ✓ | ✓ | ✓ | ✓ | ✓ |
| phone | ✓ | ✓ | ✓ | ✓ | ✓ |
| address | ✓ | ✓ | ✓ | ✓ | ✓ |
| password | ✓ | ✓ | ✓ | ✓ | ✓ |
| courierLicense | — | ✓ | — | — | — |
| vehicleType | — | ✓ | — | — | — |
| checkpoint | — | — | ✓ | — | — |
| checkpointCode | — | — | ✓ | — | — |
| department | — | — | ✓ | ✓ | ✓ |

**Note:** MongoDB's `_id` is used as the unique identifier for all users. Couriers, Staff, and Admins are added by Super Admin.

---

## 🔒 Security Features

✅ Passwords hashed with bcryptjs (10 salt rounds)  
✅ Email verification tokens (24hr expiry)  
✅ Password reset tokens (1hr expiry)  
✅ JWT tokens with expiry (default 7 days)  
✅ Role-based access control  
✅ Never expose passwords in responses  
✅ Emails stored as lowercase  
✅ Global error handling  
✅ Token verification on protected routes  
✅ Account activity tracking (lastLogin)  

---

## ✨ User Type Suggestions

You mentioned "staff/you can help find a better name" - here are some alternatives:
- **Checkpoint Officer** - Official
- **Transit Manager** - Professional
- **Hub Operator** - Descriptive
- **Logistics Agent** - Industry standard
- **Warehouse Staff** - Clear function

I'll stick with "staff" for now, but you can easily rename by updating the enum in the schema!

---

## 🆘 Troubleshooting

**Email not sending?**
- Check your RESEND_API_KEY is correct
- Verify email domain is authorized in Resend

**Token errors?**
- Ensure JWT_SECRET is set correctly
- Check token hasn't expired
- Verify token format: "Bearer <token>"

**User not found?**
- Confirm email was used during signup
- Check user type when querying
- Verify user is verified before login

**Admin can't be added?**
- Ensure requester is Super Admin
- Include all required fields
- Verify employeeId is unique

---

## 📞 Support

For more detailed API documentation, see `AUTH_API_DOCS.md`

All auth functions are well-commented in `controllers/auth/index.js`

---
