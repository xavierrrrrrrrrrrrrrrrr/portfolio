// server.ts
import express from 'express';
import cors from 'cors';
import portfolioRoutes from './routes/portfolio';
import generateRoutes from './routes/generate';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT || 3001);

console.log(`Starting server on port ${PORT}`);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory: ${DATA_DIR}`);
}

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Import GitHub routes
import githubRoutes from './routes/github';

// Mount route modules
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/github', githubRoutes);

// Add a simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API information endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'AI-Powered Portfolio Generator API',
    version: '1.0.0',
    description: 'Backend API for generating AI-powered portfolio websites',
    endpoints: {
      portfolio: '/api/portfolio',
      generate: '/api/generate',
      github: '/api/github',
      health: '/api/health',
      test: '/api/test'
    },
    features: [
      'Portfolio data management',
      'AI-powered content generation',
      'Multiple LLM provider support',
      'Template-based portfolio generation',
      'ZIP file export'
    ],
    supportedProviders: ['openai', 'gemini', 'anthropic', 'ollama', 'deepseek', 'openrouter'],
    supportedStyles: ['minimal', 'modern', 'creative', 'professional', 'dark', 'glassmorphism']
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
  console.log(`💼 Portfolio data will be saved to ${DATA_DIR}`);
  console.log(`🤖 LLM portfolio generation available at /api/generate`);
});
