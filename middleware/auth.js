import jwt from "jsonwebtoken";
import { createError } from "../error.js";
import { getEnv, listEnv } from "swiftenv";

const { JWT_SECRET } = listEnv();

/**
 * Verify JWT token and extract user info
 * Sets req.user with userId and userType
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(createError(401, "You are not authenticated. Please provide a token."));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return next(createError(401, "Token has expired"));
      }
      return next(createError(403, "Token is not valid!"));
    }
    req.user = user;
    next();
  });
};

/**
 * Verify Super Admin role
 * Can only be used after verifyToken
 */
export const verifySuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(createError(401, "You are not authenticated"));
  }

  if (req.user.userType !== "super_admin") {
    return next(createError(403, "Only super admins can access this resource"));
  }

  next();
};

/**
 * Verify Admin role (Admin or Super Admin)
 * Can only be used after verifyToken
 */
export const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return next(createError(401, "You are not authenticated"));
  }

  if (!["admin", "super_admin"].includes(req.user.userType)) {
    return next(createError(403, "Only admins can access this resource"));
  }

  next();
};

/**
 * Verify specific user types
 * Can only be used after verifyToken
 */
export const verifyUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "You are not authenticated"));
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return next(
        createError(403, `Only ${allowedTypes.join(", ")} can access this resource`)
      );
    }

    next();
  };
};

/**
 * Verify Courier role
 * Can only be used after verifyToken
 */
export const verifyCourier = verifyUserType("courier");

/**
 * Verify Staff role
 * Can only be used after verifyToken
 */
export const verifyStaff = verifyUserType("staff");

/**
 * Verify Customer role
 * Can only be used after verifyToken
 */
export const verifyCustomer = verifyUserType("customer");
