import express from 'express';

const router = express.Router();

// This endpoint is not implemented because GitHub scraping is not needed
router.get('/repos', (req, res) => {
  res.status(501).json({ error: 'GitHub repo fetching is not implemented.' });
});

export default router;
