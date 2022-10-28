import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import WordTags from '../shared/constants/WordTags';

const { Types } = mongoose;
export const corpusDataSchema = Joi.object().keys({
  originalCorpusId: Joi.string().external(async (value) => {
    if (value && !Types.ObjectId.isValid(value)) {
      throw new Error('Invalid original word id provided');
    }
    return true;
  }).allow(null).optional(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  tags: Joi.array().items(Joi.string().valid(...Object.values(WordTags).map(({ value }) => value))),
  editorsNotes: Joi.string().allow('').optional(),
});

export default async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const { body: finalData } = req;

  try {
    await corpusDataSchema.validateAsync(finalData, { abortEarly: false });
    return next();
  } catch (err) {
    res.status(400);
    if (err.details) {
      const errorMessage = err.details.map(({ message }) => message).join('. ');
      return res.send({ message: errorMessage });
    }
    return res.send({ message: err.message });
  }
};
