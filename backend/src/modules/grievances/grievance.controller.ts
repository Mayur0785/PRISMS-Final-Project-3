import { Request, Response, NextFunction } from 'express';
import { Grievance, GrievanceStatus } from './grievance.model';
import mongoose from 'mongoose';

async function generateGrievanceId(): Promise<string> {
  const count = await Grievance.countDocuments();
  const hex = (count + 601).toString(16).toUpperCase().padStart(4, '0');
  return `GRV-2026-${hex}`;
}

export const getUserGrievances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const grievances = await Grievance.find({ raisedBy: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: grievances.length,
      data: grievances,
    });
  } catch (err) {
    next(err);
  }
};

export const createGrievance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { transactionId, lotId, buyerId, category, description, priority } = req.body;

    if (!category || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Category and description are required for grievance.' },
      });
    }

    const grievanceId = await generateGrievanceId();

    const grievance = await Grievance.create({
      grievanceId,
      transactionId: transactionId && mongoose.isValidObjectId(transactionId) ? transactionId : undefined,
      lotId: lotId && mongoose.isValidObjectId(lotId) ? lotId : undefined,
      raisedBy: userId,
      buyerId,
      category,
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      assignedTo: 'PRISMS APMC Grievance Cell (Simulated)',
      isDemo: true,
    });

    res.status(201).json({
      success: true,
      data: grievance,
    });
  } catch (err) {
    next(err);
  }
};

export const getGrievanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const grievance = await Grievance.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { grievanceId: id }],
      raisedBy: userId,
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: { code: 'GRIEVANCE_NOT_FOUND', message: 'Grievance ticket not found or unauthorized' },
      });
    }

    res.status(200).json({
      success: true,
      data: grievance,
    });
  } catch (err) {
    next(err);
  }
};

export const updateGrievanceStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    const grievance = await Grievance.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { grievanceId: id }],
      raisedBy: userId,
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: { code: 'GRIEVANCE_NOT_FOUND', message: 'Grievance ticket not found or unauthorized' },
      });
    }

    if (status) grievance.status = status as GrievanceStatus;
    if (resolutionNote) grievance.resolutionNote = resolutionNote;
    await grievance.save();

    res.status(200).json({
      success: true,
      data: grievance,
    });
  } catch (err) {
    next(err);
  }
};
