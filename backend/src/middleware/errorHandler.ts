import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  
  const response: any = {
    success: false,
    error: {
      code,
      message,
    }
  };
  
  if (err.fields) {
    response.error.fields = err.fields;
  }
  
  res.status(statusCode).json(response);
};
