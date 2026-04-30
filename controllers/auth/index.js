
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Resend } from 'resend';
import { getEnv, listEnv } from "swiftenv";
import { createError } from "../../error.js";
import { Customer, Courier, Staff, Admin, SuperAdmin } from "../../models/User.js";
import { get } from "mongoose";

const { RESEND_API_KEY, JWT_SECRET, JWT_EXPIRES_IN } = listEnv();
const resend = new Resend(RESEND_API_KEY);

// Helper function to get user model by type
const getUserModel = (userType) => {
  const models = {
    customer: Customer,
    courier: Courier,
    staff: Staff,
    admin: Admin,
    super_admin: SuperAdmin,
  };
  return models[userType];
};

// Helper function to find user across all models
const findUserByEmail = async (email) => {
  const models = [Customer, Courier, Staff, Admin, SuperAdmin];
  for (const Model of models) {
    const user = await Model.findOne({ email: email.toLowerCase() });
    if (user) return user;
  }
  return null;
};

// Helper function to delete user across all models
const deleteUser = async (userId) => {
  const models = [Customer, Courier, Staff, Admin, SuperAdmin];
  for (const Model of models) {
    await Model.deleteOne({ _id: userId });
  }
};

// Helper function to generate tokens
const generateTokens = (userId, userType) => {
  const token = jwt.sign({ userId, userType }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN || "7d",
  });
  return token;
};

// Helper function to send verification email
const sendVerificationEmail = async (email, token, fullName) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    
    await resend.emails.send({
      from: "ShipGate <noreply@notifications.shipgate.ng>",
      to: email,
      subject: "Verify your Shipgate account",
      html: `
        <h2>Welcome to Shipgate, ${fullName}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

// Helper function to send password reset email
const sendPasswordResetEmail = async (email, token, fullName) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    
    await resend.emails.send({
      from: "ShipGate <noreply@notifications.shipgate.ng>",
      to: email,
      subject: "Reset your Shipgate password",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${fullName},</p>
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

// SIGNUP - Customer only
export const SignUp = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      password,
      confirmPassword,
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !address || !password || !confirmPassword) {
      return next(createError(400, "Please provide all required fields"));
    }

    if (password !== confirmPassword) {
      return next(createError(400, "Passwords do not match"));
    }

    if (password.length < 8) {
      return next(createError(400, "Password must be at least 8 characters"));
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return next(createError(409, "Email already registered"));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: "24h",
    });
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newCustomer = new Customer({
      fullName,
      email: email.toLowerCase(),
      phone,
      address,
      password: hashedPassword,
      userType: "customer",
      verificationToken,
      verificationTokenExpiry,
      verified: false,
    });

    await newCustomer.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken, fullName);

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please check your email to verify your account.",
      userId: newCustomer._id,
      userType: "customer",
    });
  } catch (error) {
    next(error);
  }
};

// SIGNIN - Generic login for all user types
export const SignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, "Please provide email and password"));
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return next(createError(401, "Invalid email or password"));
    }

    // Check if user is verified
    if (!user.verified) {
      return next(
        createError(403, "Please verify your email before logging in")
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return next(createError(403, "Your account has been deactivated"));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createError(401, "Invalid email or password"));
    }

    // Generate JWT token
    const token = generateTokens(user._id, user.userType);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        verified: user.verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// VERIFY EMAIL
export const VerifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(createError(400, "Verification token is required"));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return next(createError(400, "Invalid or expired verification token"));
    }

    // Find user by email
    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (user.verified) {
      return next(createError(400, "Email already verified"));
    }

    // Check token expiry
    if (user.verificationTokenExpiry < new Date()) {
      return next(createError(400, "Verification token has expired"));
    }

    // Update user
    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    next(error);
  }
};

// RESEND VERIFICATION TOKEN
export const ResendVerificationToken = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(createError(400, "Email is required"));
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (user.verified) {
      return next(createError(400, "Email already verified"));
    }

    // Generate new verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: "24h",
    });
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken, user.fullName);

    res.status(200).json({
      success: true,
      message: "Verification token sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// PASSWORD RESET - SEND
export const PasswordResetSend = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(createError(400, "Email is required"));
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Generate reset token
    const resetToken = jwt.sign({ email, purpose: "password_reset" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken, user.fullName);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// PASSWORD RESET - VERIFY & UPDATE
export const PasswordResetVerify = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return next(
        createError(400, "Token, new password, and confirm password are required")
      );
    }

    if (newPassword !== confirmPassword) {
      return next(createError(400, "Passwords do not match"));
    }

    if (newPassword.length < 8) {
      return next(createError(400, "Password must be at least 8 characters"));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.purpose !== "password_reset") {
        return next(createError(400, "Invalid token"));
      }
    } catch (error) {
      return next(createError(400, "Invalid or expired reset token"));
    }

    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check if reset token matches
    if (user.resetToken !== token) {
      return next(createError(400, "Invalid reset token"));
    }

    // Check token expiry
    if (user.resetTokenExpiry < new Date()) {
      return next(createError(400, "Reset token has expired"));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// ========== ADMIN OPERATIONS ==========

// ADMIN SIGNIN - For admin and super admin only
export const AdminSignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, "Please provide email and password"));
    }

    // Check both Admin and SuperAdmin models
    let user = await Admin.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await SuperAdmin.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return next(createError(401, "Invalid email or password"));
    }

    if (!user.verified) {
      return next(createError(403, "Please verify your email before logging in"));
    }

    if (!user.isActive) {
      return next(createError(403, "Your account has been deactivated"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createError(401, "Invalid email or password"));
    }

    const token = generateTokens(user._id, user.userType);
    user.lastLogin = new Date();
    await user.save();

    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        employeeId: user.employeeId,
        adminLevel: user.adminLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};

//One time to add super admin
export const AddSuperAdmin = async (req, res, next) => {
  try {
    const { fullName, email, phone, address, password, confirmPassword } = req.body;

    if (!fullName || !email || !phone || !address || !password || !confirmPassword) {
      return next(createError(400, "Please provide all required fields"));
    }

    if (password !== confirmPassword) {
      return next(createError(400, "Passwords do not match"));
    }

    if (password.length < 8) {
      return next(createError(400, "Password must be at least 8 characters"));
    }
    
    // Check if super admin already exists    
    const existingSuperAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existingSuperAdmin) {
      return next(createError(409, "Super admin with this email already exists"));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create super admin
    const superAdmin = new SuperAdmin({
      fullName,
      email: email.toLowerCase(),
      phone,
      address,
      password: hashedPassword,
    });

    await superAdmin.save();

    res.status(201).json({
      success: true,
      message: "Super admin added successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ADD ADMIN - Super admin only
export const AddAdmin = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      password,
      confirmPassword,
      department,
      permissions = [],
    } = req.body;

    const superAdminId = req.user?.userId;

    if (!fullName || !email || !phone || !address || !password || !confirmPassword) {
      return next(createError(400, "Please provide all required fields"));
    }

    if (password !== confirmPassword) {
      return next(createError(400, "Passwords do not match"));
    }

    if (password.length < 8) {
      return next(createError(400, "Password must be at least 8 characters"));
    }

    // Check if user already exists
    let existingUser = await Admin.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(createError(409, "Admin with this email already exists"));
    }

    existingUser = await findUserByEmail(email);
    if (existingUser) {
      return next(createError(409, "Email already registered"));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: "24h",
    });
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newAdmin = new Admin({
      fullName,
      email: email.toLowerCase(),
      phone,
      address,
      password: hashedPassword,
      department: department || "Operations",
      permissions,
      verificationToken,
      verificationTokenExpiry,
      verified: false,
      userType: "admin",
      adminLevel: 1,
      superAdminId,
    });

    await newAdmin.save();

    // Add admin to super admin's list
    if (superAdminId) {
      await SuperAdmin.findByIdAndUpdate(
        superAdminId,
        { $push: { addedAdmins: newAdmin._id } },
        { new: true }
      );
    }

    // Send verification email
    await sendVerificationEmail(email, verificationToken, fullName);

    res.status(201).json({
      success: true,
      message: "Admin added successfully. Verification email sent.",
      admin: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        department: newAdmin.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE ADMIN - Super admin only
export const DeleteAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next(createError(400, "User ID is required"));
    }

    // Remove from super admin's list
    await deleteUser(userId);

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL ADMINS - Super admin only
export const GetAllAdmins = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, department, type } = req.query;

    const query = {};

    const skip = (page - 1) * limit;

    const model = getUserModel(type) || Admin;

    const users = await model.find()
      .select("-password")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await model.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET CURRENT USER
export const GetCurrentUser = async (req, res, next) => {
  try {
    const { userId, userType } = req.user;

    const UserModel = getUserModel(userType);
    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ADD COURIER - Super admin only
export const AddCourier = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      password,
      courierLicense,
      vehicleType,
    } = req.body;

    const superAdminId = req.user?.userId;

    if (!fullName || !email || !phone || !address || !password || !courierLicense || !vehicleType) {
      return next(createError(400, "Please provide all required fields"));
    }

    if (password.length < 8) {
      return next(createError(400, "Password must be at least 8 characters"));
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return next(createError(409, "Email already registered"));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: "24h",
    });
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newCourier = new Courier({
      fullName,
      email: email.toLowerCase(),
      phone,
      address,
      password: hashedPassword,
      courierLicense,
      vehicleType,
      userType: "courier",
      isAvailable: true,
      rating: 0,
      shipmentsDelivered: 0,
      verificationToken,
      verificationTokenExpiry,
      verified: false,
    });

    await newCourier.save();

    // Add courier to super admin's list
    if (superAdminId) {
      await SuperAdmin.findByIdAndUpdate(
        superAdminId,
        { $push: { addedCouriers: newCourier._id } },
        { new: true }
      );
    }

    // Send verification email
    await sendVerificationEmail(email, verificationToken, fullName);

    res.status(201).json({
      success: true,
      message: "Courier added successfully. Verification email sent.",
      courier: {
        id: newCourier._id,
        fullName: newCourier.fullName,
        email: newCourier.email,
        phone: newCourier.phone,
        vehicleType: newCourier.vehicleType,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ADD STAFF - Super admin only
export const AddStaff = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      password,
      confirmPassword,
      checkpoint,
      checkpointCode,
      department,
    } = req.body;

    const superAdminId = req.user?.userId;

    if (!fullName || !email || !phone || !address || !password || !confirmPassword || !checkpoint || !checkpointCode) {
      return next(createError(400, "Please provide all required fields"));
    }

    if (password !== confirmPassword) {
      return next(createError(400, "Passwords do not match"));
    }

    if (password.length < 8) {
      return next(createError(400, "Password must be at least 8 characters"));
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return next(createError(409, "Email already registered"));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: "24h",
    });
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newStaff = new Staff({
      fullName,
      email: email.toLowerCase(),
      phone,
      address,
      password: hashedPassword,
      checkpoint,
      checkpointCode,
      department: department || "General",
      userType: "staff",
      verificationToken,
      verificationTokenExpiry,
      verified: false,
    });

    await newStaff.save();

    // Add staff to super admin's list
    if (superAdminId) {
      await SuperAdmin.findByIdAndUpdate(
        superAdminId,
        { $push: { addedStaff: newStaff._id } },
        { new: true }
      );
    }

    // Send verification email
    await sendVerificationEmail(email, verificationToken, fullName);

    res.status(201).json({
      success: true,
      message: "Staff member added successfully. Verification email sent.",
      staff: {
        id: newStaff._id,
        fullName: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        checkpoint: newStaff.checkpoint,
        checkpointCode: newStaff.checkpointCode,
      },
    });
  } catch (error) {
    next(error);
  }
}; 

