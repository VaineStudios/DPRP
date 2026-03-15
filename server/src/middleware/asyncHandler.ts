import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler so that rejected promises
 * are forwarded to Express's error handler instead of crashing the process.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asyncHandler = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};
