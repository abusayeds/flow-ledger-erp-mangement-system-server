import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * Impersonation sessions ("view as tenant") are READ-ONLY. A super admin can mint a
 * company-scoped token carrying an `impersonated_by` claim; this guard blocks any
 * mutating request made with such a token so the admin can only look, never change
 * the tenant's data. Normal tokens have no `impersonated_by` claim → unaffected
 * (so the mobile app and every real user pass straight through).
 */
export const impersonationReadonlyGuard = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return next();

  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET_KEY as string) as {
      impersonated_by?: string;
    };
    if (decoded?.impersonated_by) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: "This is a read-only impersonation session — tenant data cannot be modified.",
      });
    }
  } catch {
    // Invalid/expired token — let the route's authMiddleware produce the proper error.
  }
  next();
};
