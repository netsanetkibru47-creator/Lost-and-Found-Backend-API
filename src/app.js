import express from 'express';
import itemsRouter from './routes/items.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.use('/api/items', itemsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;