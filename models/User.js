import mongoose from "mongoose";

// Common schema fields for all users
const baseUserFields = {
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  userType: { type: String, enum: ['customer', 'admin', 'super_admin', 'staff', 'courier'] },
};

// Customer/User Schema
const CustomerSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    userType: { type: String, enum: ['customer'], default: 'customer' },
  },
  { timestamps: true }
);

// Courier Schema
const CourierSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    userType: { type: String, enum: ['courier'], default: 'courier' },
    courierLicense: { type: String }, // License/ID number
    vehicleType: { type: String }, // e.g., bike, car, truck
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    shipmentsDelivered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Staff/Checkpoint Personnel Schema
const StaffSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    userType: { type: String, enum: ['staff'], default: 'staff' },
    checkpoint: { type: String, required: true }, // Location/checkpoint name
    department: { type: String }, // e.g., "Sorting", "Delivery", "Returns"
  },
  { timestamps: true }
);

// Admin Schema
const AdminSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    userType: { type: String, enum: ['admin'], default: 'admin' },
    department: { type: String }, // e.g., "Operations", "Finance"
    permissions: [String], // e.g., ["manage_shipments", "view_reports"]
    adminLevel: { type: Number, default: 1 }, // 1: Admin, 2: Senior Admin
    superAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' }, // Who added them
  },
  { timestamps: true }
);

// Super Admin Schema
const SuperAdminSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    userType: { type: String, enum: ['super_admin'], default: 'super_admin' },
    adminLevel: { type: Number, default: 3 }, // 3: Super Admin
    permissions: [String], // All permissions
    addedAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }], // Track admins added
    addedCouriers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Courier' }], // Track couriers added
    addedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }], // Track staff added
  },
  { timestamps: true }
);

// Create models
const Customer = mongoose.model('Customer', CustomerSchema);
const Courier = mongoose.model('Courier', CourierSchema);
const Staff = mongoose.model('Staff', StaffSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const SuperAdmin = mongoose.model('SuperAdmin', SuperAdminSchema);

export { Customer, Courier, Staff, Admin, SuperAdmin };
