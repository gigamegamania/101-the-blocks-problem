import express, { Request, Response } from 'express';
import cors from 'cors';
import { solveBlocks, validateBlocks } from './blocks';

const app = express();
const PORT = process.env.PORT || 5170;

app.use(cors());
app.use(express.json());

app.post('/blocks/solve', (req: Request, res: Response): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const solution = solveBlocks(text);
    res.status(200).json({ solution });
  } catch (error) {
    console.error('Error processing /blocks/solve request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/blocks/validate', (req: Request, res: Response): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(500).json({ error: 'Invalid input' });
      return;
    }

    const result = validateBlocks(text);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing /blocks/validate request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
