import { Types } from 'mongoose';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        _id: string | Types.ObjectId;
      };
    }
  }
}
