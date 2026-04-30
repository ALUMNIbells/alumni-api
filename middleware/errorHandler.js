/**
 * Global Error Handler Middleware
 * Must be used as the last middleware in Express app
 * Usage: app.use(errorHandler);
 */

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log error for debugging (in production, use a proper logger)
  console.error({
    timestamp: new Date().toISOString(),
    status,
    message,
    path: req.path,
    method: req.method,
    error: process.env.NODE_ENV === "development" ? err : {},
  });

  // Don't expose internal error details in production
  const errorResponse = {
    success: false,
    status,
    message,
  };

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(status).json(errorResponse);
};
