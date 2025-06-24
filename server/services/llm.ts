import { PortfolioData } from '../types/portfolio';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import Handlebars from 'handlebars';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

export interface GenerationOptions {
  provider: 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'openrouter';
  style: 'minimal' | 'modern' | 'creative' | 'professional' | 'dark' | 'glassmorphism';
  outputPath: string;
  model?: string; // Optional model specification for providers like OpenRouter
}

export interface GeneratedPortfolio {
  html: string;
  css: string;
  js: string;
  metadata: {
    generatedAt: string;
    provider: string;
    style: string;
    name: string;
  };
}

class LLMService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private anthropic: Anthropic | null = null;
  private ollama: Ollama | null = null;
  private openrouter: OpenAI | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      }

      if (process.env.GEMINI_API_KEY) {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      }

      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
      }

      if (process.env.OLLAMA_HOST) {
        this.ollama = new Ollama({
          host: process.env.OLLAMA_HOST || 'http://localhost:11434',
        });
      }

    } catch (error) {
      console.error('Error initializing LLM providers:', error);
    }

    if (process.env.OPENROUTER_API_KEY) {
      this.openrouter = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:3001', // Optional, for tracking
          'X-Title': 'Portfolio Generator' // Optional, for tracking
        }
      });
    }
  }

  async generatePortfolio(
    portfolioData: PortfolioData,
    options: GenerationOptions
  ): Promise<GeneratedPortfolio> {
    console.log(`Generating portfolio with ${options.provider} using ${options.style} style`);

    // Load base template
    const templatePath = path.join(__dirname, '..', 'templates', options.style);
    
    // If template doesn't exist, fall back to minimal
    const finalTemplatePath = fs.existsSync(templatePath) 
      ? templatePath 
      : path.join(__dirname, '..', 'templates', 'minimal');

    const htmlTemplate = fs.readFileSync(path.join(finalTemplatePath, 'index.hbs'), 'utf-8');
    const cssTemplate = fs.readFileSync(path.join(finalTemplatePath, 'styles.hbs'), 'utf-8');
    const jsTemplate = fs.readFileSync(path.join(finalTemplatePath, 'script.hbs'), 'utf-8');

    // Generate enhanced content using AI
    const enhancedContent = await this.generateEnhancedContent(portfolioData, options);

    // Compile templates with enhanced data
    const templateData = {
      ...portfolioData,
      ...enhancedContent,
      currentYear: new Date().getFullYear(),
      style: options.style,
    };

    const htmlCompiled = Handlebars.compile(htmlTemplate)(templateData);
    const cssCompiled = Handlebars.compile(cssTemplate)(templateData);
    const jsCompiled = Handlebars.compile(jsTemplate)(templateData);

    // Create ZIP file
    await this.createZipFile(options.outputPath, {
      'index.html': htmlCompiled,
      'styles.css': cssCompiled,
      'script.js': jsCompiled,
    });

    return {
      html: htmlCompiled,
      css: cssCompiled,
      js: jsCompiled,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: options.provider,
        style: options.style,
        name: portfolioData.personalInfo.name,
      },
    };
  }

  private async generateEnhancedContent(
    portfolioData: PortfolioData,
    options: GenerationOptions
  ): Promise<any> {
    const prompt = this.createPrompt(portfolioData, options.style);

    try {
      let response: string = '';

      switch (options.provider) {
        case 'openai':
          response = await this.generateWithOpenAI(prompt);
          break;
        case 'gemini':
          response = await this.generateWithGemini(prompt);
          break;
        case 'anthropic':
          response = await this.generateWithAnthropic(prompt);
          break;
        case 'ollama':
          response = await this.generateWithOllama(prompt);
          break;
        case 'openrouter':
          if (!options.model) {
            throw new Error('Model must be specified for OpenRouter provider');
          }
          response = await this.generateWithOpenRouter(prompt, options.model);
          break;
        default:
          throw new Error(`Unsupported provider: ${options.provider}`);
      }

      return this.parseEnhancedContent(response);
    } catch (error) {
      console.error(`Error generating with ${options.provider}:`, error);
      // Return fallback content
      return this.getFallbackContent(portfolioData);
    }
  }

  private createPrompt(portfolioData: PortfolioData, style: string): string {
    return `
You are a professional portfolio designer. Based on the following portfolio data, generate enhanced content for a ${style} style portfolio website.

Portfolio Data:
Name: ${portfolioData.personalInfo.name}
About: ${portfolioData.aboutMe}
Projects: ${portfolioData.projects.map(p => `${p.name}: ${p.description}`).join(', ')}
Education: ${portfolioData.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join(', ')}

Please provide:
1. An enhanced "About Me" section that's more engaging and professional
2. Improved project descriptions that highlight impact and technical skills
3. A professional tagline/headline
4. SEO-friendly meta description
5. Color scheme suggestions for the ${style} style

Return your response in JSON format with these keys:
{
  "enhancedAbout": "...",
  "tagline": "...",
  "metaDescription": "...",
  "colorScheme": {...},
  "enhancedProjects": [...]
}
`;
  }

  private async generateWithOpenAI(prompt: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    if (!this.gemini) throw new Error('Gemini not initialized');

    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async generateWithAnthropic(prompt: string): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');

    const completion = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    return completion.content[0]?.type === 'text' ? completion.content[0].text : '';
  }

  private async generateWithOllama(prompt: string): Promise<string> {
    if (!this.ollama) throw new Error('Ollama not initialized');

    const response = await this.ollama.chat({
      model: 'llama2',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.message.content;
  }

  private async generateWithOpenRouter(prompt: string, model: string): Promise<string> {
    if (!this.openrouter) throw new Error('OpenRouter not initialized');

    const completion = await this.openrouter.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private parseEnhancedContent(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Return basic enhanced content if parsing fails
    return {
      enhancedAbout: response.substring(0, 500),
      tagline: 'Professional Developer & Designer',
      metaDescription: 'Professional portfolio showcasing projects and experience',
      colorScheme: { primary: '#3b82f6', secondary: '#1e40af', accent: '#f59e0b' },
      enhancedProjects: [],
    };
  }

  private getFallbackContent(portfolioData: PortfolioData): any {
    return {
      enhancedAbout: portfolioData.aboutMe,
      tagline: `${portfolioData.personalInfo.name} - Professional Portfolio`,
      metaDescription: `Portfolio of ${portfolioData.personalInfo.name} showcasing projects and experience`,
      colorScheme: { primary: '#3b82f6', secondary: '#1e40af', accent: '#f59e0b' },
      enhancedProjects: portfolioData.projects,
    };
  }

  private async createZipFile(outputPath: string, files: Record<string, string>): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);

      // Add files to archive
      Object.entries(files).forEach(([filename, content]) => {
        archive.append(content, { name: filename });
      });

      archive.finalize();
    });
  }
}

export default new LLMService();