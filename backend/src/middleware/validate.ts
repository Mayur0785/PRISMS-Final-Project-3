import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const firstMessage = error.issues?.[0]?.message || 'Validation failed';
        const fields = error.flatten().fieldErrors;

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstMessage,
            fields,
          },
        });
      } else {
        next(error);
      }
    }
  };
};
