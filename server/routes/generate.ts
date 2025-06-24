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

// Route to generate a portfolio website
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received request to generate portfolio');
    
    // Get query parameters
    const provider = (req.query.provider as string) || 'openai';
    const style = (req.query.style as string) || 'minimal';
    
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
    
    console.log(`Generating portfolio with provider: ${provider}, style: ${style}`);
    
    // Generate the portfolio website
    const generatedPortfolio = await llmService.generatePortfolio(
      portfolioData,
      {
        provider: provider as any,
        style: style as any,
        outputPath
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
      downloadUrl: `/api/generate/download/${filename}.zip`
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

// Route to get available LLM providers
router.get('/providers', (req: Request, res: Response) => {
  const providers = [
    {
      name: 'openai',
      displayName: 'OpenAI GPT-4',
      available: !!process.env.OPENAI_API_KEY,
      description: 'Advanced AI model with excellent creative writing capabilities'
    },
    {
      name: 'gemini',
      displayName: 'Google Gemini',
      available: !!process.env.GEMINI_API_KEY,
      description: 'Google\'s powerful multimodal AI model'
    },
    {
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      available: !!process.env.ANTHROPIC_API_KEY,
      description: 'Claude AI with strong reasoning and safety features'
    },
    {
      name: 'ollama',
      displayName: 'Ollama (Local)',
      available: !!process.env.OLLAMA_HOST,
      description: 'Local AI model for privacy-focused generation'
    },
    {
      name: 'deepseek',
      displayName: 'DeepSeek Coder',
      available: !!process.env.DEEPSEEK_API_KEY,
      description: 'DeepSeek AI model specialized in coding and technical content'
    },
    {
      name: 'openrouter',
      displayName: 'OpenRouter (Multi-Model)',
      available: !!process.env.OPENROUTER_API_KEY,
      description: 'Access to multiple AI models through OpenRouter API'
    }
  ];
  
  res.json({ providers });
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