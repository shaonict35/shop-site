import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: any;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message: string = "Operation successful",
  statusCode: number = 200,
  meta?: any
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function sendError(
  res: Response,
  message: string = "An error occurred",
  statusCode: number = 500,
  errorDetail?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    error: typeof errorDetail === "string" ? errorDetail : (errorDetail?.message || undefined),
  });
}
