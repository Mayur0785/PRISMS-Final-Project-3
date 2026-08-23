import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { getCrops, createCrop, updateCrop, deleteCrop } from './crop.controller';
import { createCropSchema, updateCropSchema, cropParamsSchema } from './crop.schema';

export const cropRouter = Router();

// Protect all crop endpoints with mandatory authentication
cropRouter.use(requireAuth);

cropRouter.get('/', getCrops);
cropRouter.post('/', validate(createCropSchema), createCrop);
cropRouter.patch('/:id', validate(updateCropSchema), updateCrop);
cropRouter.delete('/:id', validate(cropParamsSchema), deleteCrop);
