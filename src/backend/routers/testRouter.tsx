import express from 'express';
import { createGenericWords } from '../controllers/genericWords';
import { sendWeeklyStats } from '../services/emailJobs';

const testRouter = express.Router();

testRouter.post('/genericWords', createGenericWords);
testRouter.post('/email/mergedStats', async (_, res) => {
  await sendWeeklyStats();
  res.send({ message: 'Sent email' });
});

export default testRouter;
