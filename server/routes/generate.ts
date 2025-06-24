import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PortfolioData, PortfolioSchema } from '../types/portfolio';
import llmService from '../services/llm';

const router = Router();

// Directory to store generated portfolios
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Route to generate a portfolio website with enhanced options
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received request to generate portfolio');
    
    // Get query parameters with enhanced options
    const provider = (req.query.provider as string) || 'openai';
    const style = (req.query.style as string) || 'minimal';
    const model = req.query.model as string;
    const streaming = req.query.streaming === 'true';
    const temperature = req.query.temperature ? parseFloat(req.query.temperature as string) : undefined;
    const maxTokens = req.query.maxTokens ? parseInt(req.query.maxTokens as string) : undefined;
    
    // Validate the portfolio data
    let portfolioData: PortfolioData;
    try {
      portfolioData = PortfolioSchema.parse(req.body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      const error = new Error('Invalid portfolio data');
      return res.status(400).json({ error: error.message, details: validationError });
    }
    
    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${portfolioData.personalInfo.name.replace(/\s+/g, '_')}_${timestamp}`;
    const outputPath = path.join(OUTPUT_DIR, `${filename}.zip`);
    
    console.log(`Generating portfolio with provider: ${provider}, style: ${style}, model: ${model || 'default'}`);
    
    // Create conversation context for this generation
    const contextId = llmService.createConversationContext(provider, model);
    
    // Generate the portfolio website with enhanced options
    const generatedPortfolio = await llmService.generatePortfolio(
      portfolioData,
      {
        provider: provider as any,
        style: style as any,
        outputPath,
        model,
        streaming,
        temperature,
        maxTokens,
        contextId
      }
    );
    
    // Return the generated content and download link
    res.json({
      success: true,
      message: 'Portfolio generated successfully',
      portfolio: {
        html: generatedPortfolio.html,
        css: generatedPortfolio.css,
        js: generatedPortfolio.js,
        metadata: generatedPortfolio.metadata
      },
      downloadUrl: `/api/generate/download/${filename}.zip`,
      contextId // Return context ID for potential follow-up requests
    });
  } catch (e) {
    const error = e as any;
    console.error('Error generating portfolio:', error);
    res.status(500).json({
      error: 'Failed to generate portfolio',
      message: error.message
    });
  }
});

// Route to download a generated portfolio
router.get('/download/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(OUTPUT_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    res.download(filePath);
  } catch (e) {
    const error = e as any;
    console.error('Error downloading portfolio:', error);
    res.status(500).json({ error: 'Failed to download portfolio', message: error.message });
  }
});

// Route to list all generated portfolios
router.get('/list', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter(file => file.endsWith('.zip'))
      .map(file => ({
        filename: file,
        url: `/api/generate/download/${file}`,
        createdAt: fs.statSync(path.join(OUTPUT_DIR, file)).mtime,
        size: fs.statSync(path.join(OUTPUT_DIR, file)).size
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    res.json({ portfolios: files });
  } catch (e) {
    const error = e as any;
    console.error('Error listing portfolios:', error);
    res.status(500).json({ error: 'Failed to list portfolios', message: error.message });
  }
});

// Route to get available styles
router.get('/styles', (req: Request, res: Response) => {
  try {
    const templatesDir = path.join(__dirname, '..', 'templates');
    const styles = fs.readdirSync(templatesDir)
      .filter(dir => fs.statSync(path.join(templatesDir, dir)).isDirectory())
      .map(style => ({
        name: style,
        displayName: style.charAt(0).toUpperCase() + style.slice(1),
        description: getStyleDescription(style)
      }));
    
    res.json({ styles });
  } catch (e) {
    const error = e as any;
    console.error('Error listing styles:', error);
    res.status(500).json({ error: 'Failed to list styles', message: error.message });
  }
});

// Route to get available LLM providers with enhanced information
router.get('/providers', (req: Request, res: Response) => {
  try {
    const providers = llmService.getAvailableProviders().map(({ name, config, available }) => ({
      name,
      displayName: config.name,
      available,
      description: getProviderDescription(name),
      models: config.supportedModels,
      defaultModel: config.defaultModel,
      maxTokens: config.maxTokens,
      supportsStreaming: config.supportsStreaming,
      rateLimits: config.rateLimits
    }));
    
    res.json({ providers });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

// Route to get provider status and rate limits
router.get('/providers/:provider/status', (req: Request, res: Response) => {
  try {
    const provider = req.params.provider;
    const status = llmService.getProviderStatus(provider);
    res.json(status);
  } catch (error) {
    console.error('Error getting provider status:', error);
    res.status(500).json({ error: 'Failed to get provider status' });
  }
});

// Route to preview a style without generating full portfolio
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { style = 'minimal' } = req.body;
    
    // Load template files
    const templatePath = path.join(__dirname, '..', 'templates', style);
    const fallbackPath = path.join(__dirname, '..', 'templates', 'minimal');
    
    const finalTemplatePath = fs.existsSync(templatePath) ? templatePath : fallbackPath;
    
    const htmlTemplate = fs.readFileSync(path.join(finalTemplatePath, 'index.hbs'), 'utf-8');
    const cssTemplate = fs.readFileSync(path.join(finalTemplatePath, 'styles.hbs'), 'utf-8');
    
    // Create sample data for preview
    const sampleData = {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        location: 'San Francisco, CA'
      },
      aboutMe: 'Passionate developer with experience in modern web technologies.',
      projects: [
        {
          name: 'Sample Project',
          description: 'A showcase project demonstrating modern development practices.',
          technologies: ['React', 'TypeScript', 'Node.js'],
          githubUrl: 'https://github.com/example/project'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'University of Technology',
          startYear: '2018',
          endYear: '2022'
        }
      ],
      achievements: [],
      socialLinks: {
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe'
      },
      currentYear: new Date().getFullYear(),
      style: style
    };
    
    const htmlPreview = Handlebars.compile(htmlTemplate)(sampleData);
    const cssPreview = Handlebars.compile(cssTemplate)(sampleData);
    
    res.json({
      html: htmlPreview,
      css: cssPreview,
      style: style
    });
  } catch (e) {
    const error = e as any;
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview', message: error.message });
  }
});

// New routes for enhanced LLM features

// Route for streaming portfolio generation
router.post('/stream', async (req: Request, res: Response) => {
  try {
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const provider = (req.query.provider as string) || 'openai';
    const style = (req.query.style as string) || 'minimal';
    const model = req.query.model as string;

    let portfolioData: PortfolioData;
    try {
      portfolioData = PortfolioSchema.parse(req.body);
    } catch (validationError) {
      res.write(`data: ${JSON.stringify({ type: 'error', data: { message: 'Invalid portfolio data' } })}\n\n`);
      res.end();
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${portfolioData.personalInfo.name.replace(/\s+/g, '_')}_${timestamp}`;
    const outputPath = path.join(OUTPUT_DIR, `${filename}.zip`);

    // Generate with streaming
    const result = await llmService.generateStreamingPortfolio(
      portfolioData,
      {
        provider: provider as any,
        style: style as any,
        outputPath,
        model,
        streaming: true
      },
      (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      }
    );

    // Send final result
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: {
        portfolio: result,
        downloadUrl: `/api/generate/download/${filename}.zip`
      }
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error('Error in streaming generation:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: (error as Error).message } })}\n\n`);
    res.end();
  }
});

// Route to get conversation context
router.get('/context/:contextId', (req: Request, res: Response) => {
  try {
    const contextId = req.params.contextId;
    const context = llmService.getConversationContext(contextId);
    
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }
    
    res.json({ context });
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({ error: 'Failed to get context' });
  }
});

// Route to clear cache
router.post('/cache/clear', (req: Request, res: Response) => {
  try {
    llmService.clearCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Route to get cache stats
router.get('/cache/stats', (req: Request, res: Response) => {
  try {
    const stats = llmService.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

function getProviderDescription(provider: string): string {
  const descriptions: Record<string, string> = {
    openai: 'Advanced AI model with excellent creative writing capabilities',
    gemini: 'Google\'s powerful multimodal AI model',
    anthropic: 'Claude AI with strong reasoning and safety features',
    ollama: 'Local AI model for privacy-focused generation',
    openrouter: 'Access to multiple AI models through OpenRouter API',
    cohere: 'Cohere\'s command models for text generation',
    mistral: 'Mistral AI\'s efficient and powerful language models'
  };
  
  return descriptions[provider] || 'AI language model for portfolio generation';
}

function getStyleDescription(style: string): string {
  const descriptions: Record<string, string> = {
    minimal: 'Clean and simple design focusing on content',
    modern: 'Contemporary design with sidebar navigation',
    creative: 'Bold and artistic with unique visual elements',
    professional: 'Corporate-friendly design for business use',
    dark: 'Dark theme with modern aesthetics',
    glassmorphism: 'Trendy glass-like effects and transparency'
  };
  
  return descriptions[style] || 'Custom portfolio style';
}

export default router;