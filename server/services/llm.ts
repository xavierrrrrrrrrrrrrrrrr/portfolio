import { PortfolioData } from '../types/portfolio';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import Handlebars from 'handlebars';
import { EventEmitter } from 'events';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

export interface GenerationOptions {
  provider: 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'openrouter' | 'cohere' | 'mistral';
  style: 'minimal' | 'modern' | 'creative' | 'professional' | 'dark' | 'glassmorphism';
  outputPath: string;
  model?: string; // Optional model specification for providers like OpenRouter
  streaming?: boolean; // Enable streaming responses
  temperature?: number; // Control creativity
  maxTokens?: number; // Control response length
  contextId?: string; // For conversation continuity
}

export interface GeneratedPortfolio {
  html: string;
  css: string;
  js: string;
  metadata: {
    generatedAt: string;
    provider: string;
    model?: string;
    style: string;
    name: string;
    tokensUsed?: number;
    generationTime?: number;
    quality?: {
      accessibility: number;
      performance: number;
      seo: number;
    };
  };
}

export interface StreamingResponse {
  type: 'progress' | 'content' | 'complete' | 'error';
  data: any;
  timestamp: number;
}

export interface ConversationContext {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  metadata: {
    provider: string;
    model?: string;
    totalTokens: number;
    createdAt: number;
    lastUpdated: number;
  };
}

export interface GenerationHistory {
  id: string;
  portfolioData: PortfolioData;
  options: GenerationOptions;
  result: GeneratedPortfolio;
  timestamp: number;
  cost?: {
    amount: number;
    currency: string;
    breakdown: {
      inputTokens: number;
      outputTokens: number;
      inputCost: number;
      outputCost: number;
    };
  };
  performance: {
    generationTime: number;
    tokensPerSecond: number;
    quality: {
      accessibility: number;
      performance: number;
      seo: number;
    };
  };
}

export interface CostEstimate {
  estimatedCost: number;
  currency: string;
  breakdown: {
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
  };
  confidence: number; // 0-1 score
}

export interface ModelRecommendation {
  model: string;
  provider: string;
  score: number;
  reasoning: string;
  estimatedCost: number;
  estimatedTime: number;
}

export interface ProviderConfig {
  name: string;
  apiKey?: string;
  baseURL?: string;
  defaultModel: string;
  supportedModels: string[];
  maxTokens: number;
  supportsStreaming: boolean;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  pricing?: {
    inputTokens: number; // cost per 1K input tokens
    outputTokens: number; // cost per 1K output tokens
    currency: string;
  };
  capabilities: {
    codeGeneration: boolean;
    multimodal: boolean;
    functionCalling: boolean;
    jsonMode: boolean;
  };
  performance: {
    averageLatency: number; // ms
    reliability: number; // 0-1 score
  };
}

class LLMService extends EventEmitter {
  private providers: Map<string, any> = new Map();
  private providerConfigs: Map<string, ProviderConfig> = new Map();
  private conversations: Map<string, ConversationContext> = new Map();
  private cache: Map<string, any> = new Map();
  private rateLimiters: Map<string, { requests: number[], tokens: number[], lastReset: number }> = new Map();
  private generationHistory: Map<string, GenerationHistory> = new Map();
  private performanceMetrics: Map<string, { latencies: number[], successes: number, failures: number }> = new Map();

  constructor() {
    super();
    this.initializeProviders();
    this.setupRateLimiting();
  }

  private initializeProviders() {
    try {
      // OpenAI Configuration
      if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.providers.set('openai', openai);
        this.providerConfigs.set('openai', {
          name: 'OpenAI',
          apiKey: process.env.OPENAI_API_KEY,
          defaultModel: 'gpt-4o',
          supportedModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          maxTokens: 4096,
          supportsStreaming: true,
          rateLimits: { requestsPerMinute: 500, tokensPerMinute: 150000 },
          pricing: {
            inputTokens: 0.005, // $5 per 1K input tokens
            outputTokens: 0.015, // $15 per 1K output tokens
            currency: 'USD'
          },
          capabilities: {
            codeGeneration: true,
            multimodal: true,
            functionCalling: true,
            jsonMode: true
          },
          performance: {
            averageLatency: 2000,
            reliability: 0.99
          }
        });
      }

      // Google Gemini Configuration
      if (process.env.GEMINI_API_KEY) {
        const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.providers.set('gemini', gemini);
        this.providerConfigs.set('gemini', {
          name: 'Google Gemini',
          apiKey: process.env.GEMINI_API_KEY,
          defaultModel: 'gemini-1.5-pro',
          supportedModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
          maxTokens: 8192,
          supportsStreaming: true,
          rateLimits: { requestsPerMinute: 60, tokensPerMinute: 32000 },
          pricing: {
            inputTokens: 0.00125, // $1.25 per 1K input tokens
            outputTokens: 0.005, // $5 per 1K output tokens
            currency: 'USD'
          },
          capabilities: {
            codeGeneration: true,
            multimodal: true,
            functionCalling: true,
            jsonMode: true
          },
          performance: {
            averageLatency: 1500,
            reliability: 0.97
          }
        });
      }

      // Anthropic Claude Configuration
      if (process.env.ANTHROPIC_API_KEY) {
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.providers.set('anthropic', anthropic);
        this.providerConfigs.set('anthropic', {
          name: 'Anthropic Claude',
          apiKey: process.env.ANTHROPIC_API_KEY,
          defaultModel: 'claude-3-5-sonnet-20241022',
          supportedModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
          maxTokens: 4096,
          supportsStreaming: true,
          rateLimits: { requestsPerMinute: 50, tokensPerMinute: 40000 },
          pricing: {
            inputTokens: 0.003, // $3 per 1K input tokens
            outputTokens: 0.015, // $15 per 1K output tokens
            currency: 'USD'
          },
          capabilities: {
            codeGeneration: true,
            multimodal: true,
            functionCalling: true,
            jsonMode: false
          },
          performance: {
            averageLatency: 2200,
            reliability: 0.98
          }
        });
      }

      // Ollama Configuration
      if (process.env.OLLAMA_HOST) {
        const ollama = new Ollama({
          host: process.env.OLLAMA_HOST || 'http://localhost:11434',
        });
        this.providers.set('ollama', ollama);
        this.providerConfigs.set('ollama', {
          name: 'Ollama (Local)',
          baseURL: process.env.OLLAMA_HOST || 'http://localhost:11434',
          defaultModel: 'llama3.1:8b',
          supportedModels: ['llama3.1:8b', 'llama3.1:70b', 'codellama:7b', 'mistral:7b'],
          maxTokens: 4096,
          supportsStreaming: true,
          rateLimits: { requestsPerMinute: 1000, tokensPerMinute: 100000 },
          pricing: {
            inputTokens: 0, // Free local hosting
            outputTokens: 0,
            currency: 'USD'
          },
          capabilities: {
            codeGeneration: true,
            multimodal: false,
            functionCalling: false,
            jsonMode: true
          },
          performance: {
            averageLatency: 3000,
            reliability: 0.90
          }
        });
      }

      // OpenRouter Configuration
      if (process.env.OPENROUTER_API_KEY) {
        const openrouter = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY,
          defaultHeaders: {
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'Portfolio Generator'
          }
        });
        this.providers.set('openrouter', openrouter);
        this.providerConfigs.set('openrouter', {
          name: 'OpenRouter',
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultModel: 'anthropic/claude-3.5-sonnet',
          supportedModels: [
            'anthropic/claude-3.5-sonnet',
            'google/gemini-pro-1.5',
            'deepseek/deepseek-r1',
            'meta-llama/llama-3.1-405b-instruct',
            'openai/gpt-4o'
          ],
          maxTokens: 4096,
          supportsStreaming: true,
          rateLimits: { requestsPerMinute: 200, tokensPerMinute: 100000 },
          pricing: {
            inputTokens: 0.003, // Average pricing across models
            outputTokens: 0.015,
            currency: 'USD'
          },
          capabilities: {
            codeGeneration: true,
            multimodal: true,
            functionCalling: true,
            jsonMode: true
          },
          performance: {
            averageLatency: 2500,
            reliability: 0.95
          }
        });
      }

      // Cohere Configuration
      if (process.env.COHERE_API_KEY) {
        // Note: Would need to install cohere SDK
        this.providerConfigs.set('cohere', {
          name: 'Cohere',
          apiKey: process.env.COHERE_API_KEY,
          defaultModel: 'command-r-plus',
          supportedModels: ['command-r-plus', 'command-r', 'command'],
          maxTokens: 4096,
          supportsStreaming: true,
          rateLimits: { requestsPerMinute: 100, tokensPerMinute: 50000 },
          pricing: {
            inputTokens: 0.003,
            outputTokens: 0.015,
            currency: 'USD'
          },
          capabilities: {
            codeGeneration: true,
            multimodal: false,
            functionCalling: true,
            jsonMode: true
          },
          performance: {
            averageLatency: 2000,
            reliability: 0.94
          }
        });
      }

      // Mistral Configuration
      if (process.env.MISTRAL_API_KEY) {
        // Note: Would need to install mistral SDK
        this.providerConfigs.set('mistral', {
          name: 'Mistral AI',
          apiKey: process.env.MISTRAL_API_KEY,
          defaultModel: 'mistral-large-latest',
          supportedModels: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
          maxTokens: 4096,
          supportsStreaming: true,
          rateLimits: { requestsPerMinute: 100, tokensPerMinute: 50000 },
          pricing: {
            inputTokens: 0.004,
            outputTokens: 0.012,
            currency: 'USD'
          },
          capabilities: {
            codeGeneration: true,
            multimodal: false,
            functionCalling: true,
            jsonMode: true
          },
          performance: {
            averageLatency: 1800,
            reliability: 0.96
          }
        });
      }

      console.log(`Initialized ${this.providers.size} LLM providers`);
    } catch (error) {
      console.error('Error initializing LLM providers:', error);
    }
  }

  private setupRateLimiting() {
    // Initialize rate limiters for each provider
    for (const [provider, config] of this.providerConfigs) {
      this.rateLimiters.set(provider, {
        requests: [],
        tokens: [],
        lastReset: Date.now()
      });
    }

    // Clean up rate limiter data every minute
    setInterval(() => {
      const now = Date.now();
      for (const [provider, limiter] of this.rateLimiters) {
        const oneMinuteAgo = now - 60000;
        limiter.requests = limiter.requests.filter(time => time > oneMinuteAgo);
        limiter.tokens = limiter.tokens.filter(time => time > oneMinuteAgo);
      }
    }, 60000);
  }

  // Utility methods
  private async checkRateLimit(provider: string, estimatedTokens: number = 1000): Promise<boolean> {
    const config = this.providerConfigs.get(provider);
    const limiter = this.rateLimiters.get(provider);
    
    if (!config || !limiter) return true;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old entries
    limiter.requests = limiter.requests.filter(time => time > oneMinuteAgo);
    limiter.tokens = limiter.tokens.filter(time => time > oneMinuteAgo);
    
    // Check limits
    const requestsInLastMinute = limiter.requests.length;
    const tokensInLastMinute = limiter.tokens.length;
    
    return requestsInLastMinute < config.rateLimits.requestsPerMinute && 
           tokensInLastMinute + estimatedTokens < config.rateLimits.tokensPerMinute;
  }

  private recordUsage(provider: string, tokens: number) {
    const limiter = this.rateLimiters.get(provider);
    if (limiter) {
      const now = Date.now();
      limiter.requests.push(now);
      for (let i = 0; i < tokens; i++) {
        limiter.tokens.push(now);
      }
    }
  }

  private getCacheKey(portfolioData: PortfolioData, options: GenerationOptions): string {
    const dataHash = JSON.stringify({
      name: portfolioData.personalInfo.name,
      aboutMe: portfolioData.aboutMe,
      projectsCount: portfolioData.projects.length,
      provider: options.provider,
      style: options.style,
      model: options.model
    });
    return Buffer.from(dataHash).toString('base64');
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async selectOptimalProvider(options: GenerationOptions): Promise<string> {
    // If specific provider requested, use it
    if (options.provider && this.providers.has(options.provider)) {
      const canUse = await this.checkRateLimit(options.provider);
      if (canUse) return options.provider;
    }

    // Find best available provider based on rate limits and capabilities
    const availableProviders = Array.from(this.providers.keys());
    for (const provider of availableProviders) {
      const canUse = await this.checkRateLimit(provider);
      if (canUse) return provider;
    }

    throw new Error('No available providers within rate limits');
  }

  async generatePortfolio(
    portfolioData: PortfolioData,
    options: GenerationOptions
  ): Promise<GeneratedPortfolio> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.getCacheKey(portfolioData, options);
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached portfolio');
      return this.cache.get(cacheKey);
    }

    // Select optimal provider
    const selectedProvider = await this.selectOptimalProvider(options);
    console.log(`Generating portfolio with ${selectedProvider} using ${options.style} style`);

    // Emit progress event
    this.emit('progress', {
      type: 'progress',
      data: { stage: 'initializing', progress: 10 },
      timestamp: Date.now()
    });

    // Load base template
    const templatePath = path.join(__dirname, '..', 'templates', options.style);
    const finalTemplatePath = fs.existsSync(templatePath) 
      ? templatePath 
      : path.join(__dirname, '..', 'templates', 'minimal');

    const htmlTemplate = fs.readFileSync(path.join(finalTemplatePath, 'index.hbs'), 'utf-8');
    const cssTemplate = fs.readFileSync(path.join(finalTemplatePath, 'styles.hbs'), 'utf-8');
    const jsTemplate = fs.readFileSync(path.join(finalTemplatePath, 'script.hbs'), 'utf-8');

    this.emit('progress', {
      type: 'progress',
      data: { stage: 'templates_loaded', progress: 20 },
      timestamp: Date.now()
    });

    // Generate enhanced content using AI with retry logic
    const enhancedContent = await this.retryWithBackoff(async () => {
      return await this.generateEnhancedContent(portfolioData, { ...options, provider: selectedProvider as any });
    });

    this.emit('progress', {
      type: 'progress',
      data: { stage: 'ai_content_generated', progress: 70 },
      timestamp: Date.now()
    });

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

    this.emit('progress', {
      type: 'progress',
      data: { stage: 'templates_compiled', progress: 85 },
      timestamp: Date.now()
    });

    // Analyze quality
    const quality = await this.analyzeQuality(htmlCompiled, cssCompiled);

    // Create ZIP file
    await this.createZipFile(options.outputPath, {
      'index.html': htmlCompiled,
      'styles.css': cssCompiled,
      'script.js': jsCompiled,
    });

    const generationTime = Date.now() - startTime;
    const result: GeneratedPortfolio = {
      html: htmlCompiled,
      css: cssCompiled,
      js: jsCompiled,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: selectedProvider,
        model: options.model || this.providerConfigs.get(selectedProvider)?.defaultModel,
        style: options.style,
        name: portfolioData.personalInfo.name,
        tokensUsed: enhancedContent.tokensUsed || 0,
        generationTime,
        quality
      },
    };

    // Record performance metrics
    this.recordPerformanceMetrics(selectedProvider, generationTime, true);

    // Calculate cost if pricing is available
    const costEstimate = this.estimateCost(portfolioData, { ...options, provider: selectedProvider as any });
    const actualCost = costEstimate.estimatedCost; // In a real implementation, this would come from the API response

    // Save to generation history
    const historyId = this.saveGenerationHistory(
      portfolioData,
      { ...options, provider: selectedProvider as any },
      result,
      {
        amount: actualCost,
        currency: costEstimate.currency,
        breakdown: costEstimate.breakdown
      },
      {
        generationTime,
        tokensPerSecond: enhancedContent.tokensUsed ? (enhancedContent.tokensUsed / (generationTime / 1000)) : 0,
        quality
      }
    );

    // Cache the result
    this.cache.set(cacheKey, result);

    this.emit('progress', {
      type: 'complete',
      data: { result, historyId, cost: actualCost },
      timestamp: Date.now()
    });

    return result;
  }

  private async generateEnhancedContent(
    portfolioData: PortfolioData,
    options: GenerationOptions
  ): Promise<any> {
    const messages = this.createAdvancedPrompt(portfolioData, options.style);
    const startTime = Date.now();

    try {
      let response: string = '';
      let tokensUsed = 0;

      // Get conversation context if available
      const context = options.contextId ? this.conversations.get(options.contextId) : null;
      const conversationMessages = context ? context.messages : [];

      const allMessages = [...conversationMessages, ...messages];

      switch (options.provider) {
        case 'openai':
          const openaiResult = await this.generateWithOpenAI(allMessages, options);
          response = openaiResult.content;
          tokensUsed = openaiResult.tokensUsed;
          break;
        case 'gemini':
          const geminiResult = await this.generateWithGemini(allMessages, options);
          response = geminiResult.content;
          tokensUsed = geminiResult.tokensUsed;
          break;
        case 'anthropic':
          const anthropicResult = await this.generateWithAnthropic(allMessages, options);
          response = anthropicResult.content;
          tokensUsed = anthropicResult.tokensUsed;
          break;
        case 'ollama':
          const ollamaResult = await this.generateWithOllama(allMessages, options);
          response = ollamaResult.content;
          tokensUsed = ollamaResult.tokensUsed;
          break;
        case 'openrouter':
          if (!options.model) {
            throw new Error('Model must be specified for OpenRouter provider');
          }
          const openrouterResult = await this.generateWithOpenRouter(allMessages, options);
          response = openrouterResult.content;
          tokensUsed = openrouterResult.tokensUsed;
          break;
        default:
          throw new Error(`Unsupported provider: ${options.provider}`);
      }

      // Record usage for rate limiting
      this.recordUsage(options.provider, tokensUsed);

      // Update conversation context
      if (options.contextId) {
        this.updateConversationContext(options.contextId, allMessages, response, options.provider as string, tokensUsed);
      }

      const result = this.parseEnhancedContent(response);
      result.tokensUsed = tokensUsed;
      result.generationTime = Date.now() - startTime;

      return result;
    } catch (error) {
      console.error(`Error generating with ${options.provider}:`, error);
      // Return fallback content
      return this.getFallbackContent(portfolioData);
    }
  }

  private createAdvancedPrompt(portfolioData: PortfolioData, style: string): Array<{role: string, content: string}> {
    const systemPrompt = `You are an expert portfolio designer and UX writer with 10+ years of experience creating compelling digital portfolios. You specialize in ${style} design aesthetics and understand how to craft content that converts visitors into opportunities.

Your expertise includes:
- Modern web design principles and accessibility standards
- SEO optimization and content strategy
- Psychology of user engagement and conversion
- Technical writing that showcases skills effectively
- Color theory and visual hierarchy for ${style} designs

Always provide responses in valid JSON format with proper escaping.`;

    const fewShotExamples = `Here are examples of excellent portfolio content transformations:

Example 1 - Before: "I'm a developer who likes coding"
After: "Passionate full-stack developer with 5+ years crafting scalable web applications that serve millions of users. I transform complex business requirements into elegant, performant solutions using modern technologies."

Example 2 - Before: "Built a todo app with React"
After: "Architected a collaborative task management platform using React, Node.js, and PostgreSQL, serving 10,000+ active users with 99.9% uptime and real-time synchronization across devices."`;

    const userPrompt = `Transform this portfolio data into compelling, professional content for a ${style} style website:

PORTFOLIO DATA:
Name: ${portfolioData.personalInfo.name}
Email: ${portfolioData.personalInfo.email}
Location: ${portfolioData.personalInfo.location || 'Not specified'}

About Me: ${portfolioData.aboutMe}

Projects:
${portfolioData.projects.map((p, i) => `${i + 1}. ${p.name}
   Description: ${p.description}
   Technologies: ${p.technologies?.join(', ') || 'Not specified'}
   GitHub: ${p.githubUrl || 'Not provided'}
   Live URL: ${p.liveUrl || 'Not provided'}`).join('\n\n')}

Education:
${portfolioData.education.map((e, i) => `${i + 1}. ${e.degree} in ${e.field}
   Institution: ${e.institution}
   Period: ${e.startYear} - ${e.endYear}
   GPA: ${e.gpa || 'Not specified'}`).join('\n\n')}

Achievements:
${portfolioData.achievements?.map((a, i) => `${i + 1}. ${a.title}: ${a.description} (${(a as any).year || 'N/A'})`).join('\n') || 'None specified'}

Social Links:
${Object.entries(portfolioData.socialLinks || {}).map(([platform, url]) => `${platform}: ${url}`).join('\n')}

REQUIREMENTS:
1. Create an engaging "About Me" section (150-200 words) that highlights unique value proposition
2. Enhance each project description to showcase impact, technical depth, and problem-solving skills
3. Generate a compelling tagline/headline (10-15 words) that captures professional identity
4. Write an SEO-optimized meta description (150-160 characters)
5. Suggest a cohesive color scheme that matches ${style} aesthetic principles
6. Provide accessibility improvements and performance suggestions
7. Generate relevant keywords for SEO

STYLE GUIDELINES for ${style}:
${this.getStyleGuidelines(style)}

Return ONLY valid JSON in this exact format:
{
  "enhancedAbout": "string",
  "tagline": "string", 
  "metaDescription": "string",
  "colorScheme": {
    "primary": "#hexcode",
    "secondary": "#hexcode", 
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode"
  },
  "enhancedProjects": [
    {
      "name": "string",
      "enhancedDescription": "string",
      "impact": "string",
      "technicalHighlights": ["string"],
      "keywords": ["string"]
    }
  ],
  "seoKeywords": ["string"],
  "accessibilityTips": ["string"],
  "performanceTips": ["string"]
}`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: fewShotExamples },
      { role: 'user', content: userPrompt }
    ];
  }

  private getStyleGuidelines(style: string): string {
    const guidelines = {
      minimal: 'Clean lines, ample whitespace, monochromatic or limited color palette, focus on typography and content hierarchy',
      modern: 'Bold typography, geometric shapes, vibrant colors, asymmetrical layouts, contemporary visual elements',
      creative: 'Artistic flair, unique layouts, experimental typography, bold color combinations, visual storytelling elements',
      professional: 'Conservative color scheme, structured layouts, readable fonts, corporate-friendly design elements',
      dark: 'Dark backgrounds, high contrast text, neon or bright accent colors, modern tech aesthetic',
      glassmorphism: 'Translucent elements, blur effects, subtle gradients, layered depth, modern glass-like appearance'
    };
    return guidelines[style as keyof typeof guidelines] || guidelines.minimal;
  }

  private async generateWithOpenAI(
    messages: Array<{role: string, content: string}>, 
    options: GenerationOptions
  ): Promise<{content: string, tokensUsed: number}> {
    const provider = this.providers.get('openai');
    if (!provider) throw new Error('OpenAI not initialized');

    const config = this.providerConfigs.get('openai')!;
    const model = options.model || config.defaultModel;

    const completion = await provider.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || 0.7,
      stream: options.streaming || false,
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    return { content, tokensUsed };
  }

  private async generateWithGemini(
    messages: Array<{role: string, content: string}>, 
    options: GenerationOptions
  ): Promise<{content: string, tokensUsed: number}> {
    const provider = this.providers.get('gemini');
    if (!provider) throw new Error('Gemini not initialized');

    const config = this.providerConfigs.get('gemini')!;
    const modelName = options.model || config.defaultModel;

    // Convert messages to Gemini format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const model = provider.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        maxOutputTokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature || 0.7,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    // Gemini doesn't provide token usage in the same way, estimate it
    const tokensUsed = Math.ceil(content.length / 4);

    return { content, tokensUsed };
  }

  private async generateWithAnthropic(
    messages: Array<{role: string, content: string}>, 
    options: GenerationOptions
  ): Promise<{content: string, tokensUsed: number}> {
    const provider = this.providers.get('anthropic');
    if (!provider) throw new Error('Anthropic not initialized');

    const config = this.providerConfigs.get('anthropic')!;
    const model = options.model || config.defaultModel;

    // Filter out system messages for Anthropic format
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');

    const completion = await provider.messages.create({
      model,
      max_tokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || 0.7,
      system: systemMessage,
      messages: userMessages as any,
    });

    const content = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
    const tokensUsed = completion.usage?.input_tokens + completion.usage?.output_tokens || 0;

    return { content, tokensUsed };
  }

  private async generateWithOllama(
    messages: Array<{role: string, content: string}>, 
    options: GenerationOptions
  ): Promise<{content: string, tokensUsed: number}> {
    const provider = this.providers.get('ollama');
    if (!provider) throw new Error('Ollama not initialized');

    const config = this.providerConfigs.get('ollama')!;
    const model = options.model || config.defaultModel;

    const response = await provider.chat({
      model,
      messages: messages as any,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || config.maxTokens,
      }
    });

    const content = response.message.content;
    // Ollama doesn't provide token usage, estimate it
    const tokensUsed = Math.ceil(content.length / 4);

    return { content, tokensUsed };
  }

  private async generateWithOpenRouter(
    messages: Array<{role: string, content: string}>, 
    options: GenerationOptions
  ): Promise<{content: string, tokensUsed: number}> {
    const provider = this.providers.get('openrouter');
    if (!provider) throw new Error('OpenRouter not initialized');

    const config = this.providerConfigs.get('openrouter')!;
    const model = options.model || config.defaultModel;

    const completion = await provider.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || 0.7,
      stream: options.streaming || false,
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    return { content, tokensUsed };
  }

  private updateConversationContext(
    contextId: string, 
    messages: Array<{role: string, content: string}>, 
    response: string, 
    provider: string, 
    tokensUsed: number
  ) {
    let context = this.conversations.get(contextId);
    
    if (!context) {
      context = {
        id: contextId,
        messages: [],
        metadata: {
          provider,
          totalTokens: 0,
          createdAt: Date.now(),
          lastUpdated: Date.now()
        }
      };
    }

    // Add new messages with timestamps
    const messagesWithTimestamp = messages.map(msg => ({
      ...msg,
      role: msg.role as 'user' | 'assistant' | 'system',
      timestamp: Date.now()
    }));
    
    context.messages.push(...messagesWithTimestamp);
    context.messages.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });

    // Update metadata
    context.metadata.totalTokens += tokensUsed;
    context.metadata.lastUpdated = Date.now();

    this.conversations.set(contextId, context);
  }

  private async analyzeQuality(html: string, css: string): Promise<{accessibility: number, performance: number, seo: number}> {
    // Basic quality analysis - in a real implementation, this could use tools like axe-core, lighthouse, etc.
    let accessibility = 70; // Base score
    let performance = 70;
    let seo = 70;

    // Check for accessibility features
    if (html.includes('alt=')) accessibility += 10;
    if (html.includes('aria-')) accessibility += 10;
    if (html.includes('role=')) accessibility += 5;
    if (html.includes('<h1>')) accessibility += 5;

    // Check for performance features
    if (css.includes('font-display')) performance += 10;
    if (!css.includes('@import')) performance += 10;
    if (html.includes('loading="lazy"')) performance += 10;

    // Check for SEO features
    if (html.includes('<meta name="description"')) seo += 10;
    if (html.includes('<title>')) seo += 10;
    if (html.includes('og:')) seo += 10;

    return {
      accessibility: Math.min(100, accessibility),
      performance: Math.min(100, performance),
      seo: Math.min(100, seo)
    };
  }

  private parseEnhancedContent(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (parsed.enhancedAbout && parsed.tagline && parsed.metaDescription) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw response:', response.substring(0, 500));
    }

    // Return enhanced fallback content if parsing fails
    return {
      enhancedAbout: response.substring(0, 500) || 'Passionate developer with experience in modern technologies.',
      tagline: 'Professional Developer & Designer',
      metaDescription: 'Professional portfolio showcasing projects and experience',
      colorScheme: { 
        primary: '#3b82f6', 
        secondary: '#1e40af', 
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937'
      },
      enhancedProjects: [],
      seoKeywords: ['developer', 'portfolio', 'web development'],
      accessibilityTips: ['Add alt text to images', 'Use semantic HTML'],
      performanceTips: ['Optimize images', 'Minimize CSS']
    };
  }

  private getFallbackContent(portfolioData: PortfolioData): any {
    return {
      enhancedAbout: portfolioData.aboutMe,
      tagline: `${portfolioData.personalInfo.name} - Professional Portfolio`,
      metaDescription: `Portfolio of ${portfolioData.personalInfo.name} showcasing projects and experience`,
      colorScheme: { 
        primary: '#3b82f6', 
        secondary: '#1e40af', 
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937'
      },
      enhancedProjects: portfolioData.projects.map(p => ({
        name: p.name,
        enhancedDescription: p.description,
        impact: 'Contributed to project success',
        technicalHighlights: p.technologies || [],
        keywords: p.technologies || []
      })),
      seoKeywords: ['developer', 'portfolio', 'web development'],
      accessibilityTips: ['Add alt text to images', 'Use semantic HTML'],
      performanceTips: ['Optimize images', 'Minimize CSS'],
      tokensUsed: 0
    };
  }

  // Public API methods
  public getAvailableProviders(): Array<{name: string, config: ProviderConfig, available: boolean}> {
    return Array.from(this.providerConfigs.entries()).map(([name, config]) => ({
      name,
      config,
      available: this.providers.has(name)
    }));
  }

  public getProviderStatus(provider: string): {available: boolean, rateLimitStatus: any} {
    const available = this.providers.has(provider);
    const limiter = this.rateLimiters.get(provider);
    const config = this.providerConfigs.get(provider);
    
    let rateLimitStatus = null;
    if (limiter && config) {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      const recentRequests = limiter.requests.filter(time => time > oneMinuteAgo).length;
      const recentTokens = limiter.tokens.filter(time => time > oneMinuteAgo).length;
      
      rateLimitStatus = {
        requestsUsed: recentRequests,
        requestsLimit: config.rateLimits.requestsPerMinute,
        tokensUsed: recentTokens,
        tokensLimit: config.rateLimits.tokensPerMinute,
        requestsRemaining: Math.max(0, config.rateLimits.requestsPerMinute - recentRequests),
        tokensRemaining: Math.max(0, config.rateLimits.tokensPerMinute - recentTokens)
      };
    }

    return { available, rateLimitStatus };
  }

  public createConversationContext(provider: string, model?: string): string {
    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: ConversationContext = {
      id: contextId,
      messages: [],
      metadata: {
        provider,
        model,
        totalTokens: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      }
    };

    this.conversations.set(contextId, context);
    return contextId;
  }

  public getConversationContext(contextId: string): ConversationContext | null {
    return this.conversations.get(contextId) || null;
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('LLM cache cleared');
  }

  public getCacheStats(): {size: number, keys: string[]} {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  public async generateStreamingPortfolio(
    portfolioData: PortfolioData,
    options: GenerationOptions,
    onProgress?: (progress: StreamingResponse) => void
  ): Promise<GeneratedPortfolio> {
    // Set up streaming
    if (onProgress) {
      this.on('progress', onProgress);
    }

    try {
      const result = await this.generatePortfolio(portfolioData, { ...options, streaming: true });
      return result;
    } finally {
      if (onProgress) {
        this.off('progress', onProgress);
      }
    }
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

  // Enhanced methods for modern AI code editor experience

  public estimateCost(portfolioData: PortfolioData, options: GenerationOptions): CostEstimate {
    const config = this.providerConfigs.get(options.provider);
    if (!config?.pricing) {
      return {
        estimatedCost: 0,
        currency: 'USD',
        breakdown: { inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0 },
        confidence: 0
      };
    }

    // Estimate token usage based on portfolio complexity
    const baseInputTokens = 1000; // Base prompt tokens
    const portfolioComplexity = this.calculatePortfolioComplexity(portfolioData);
    const estimatedInputTokens = baseInputTokens + portfolioComplexity * 200;
    const estimatedOutputTokens = Math.min(options.maxTokens || config.maxTokens, 3000);

    const inputCost = (estimatedInputTokens / 1000) * config.pricing.inputTokens;
    const outputCost = (estimatedOutputTokens / 1000) * config.pricing.outputTokens;

    return {
      estimatedCost: inputCost + outputCost,
      currency: config.pricing.currency,
      breakdown: {
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        inputCost,
        outputCost
      },
      confidence: 0.8 // High confidence for estimation
    };
  }

  public getModelRecommendations(portfolioData: PortfolioData, requirements?: {
    maxCost?: number;
    maxTime?: number;
    prioritizeQuality?: boolean;
  }): ModelRecommendation[] {
    const recommendations: ModelRecommendation[] = [];
    const complexity = this.calculatePortfolioComplexity(portfolioData);

    for (const [providerName, config] of this.providerConfigs) {
      if (!this.providers.has(providerName)) continue;

      for (const model of config.supportedModels) {
        const options: GenerationOptions = {
          provider: providerName as any,
          style: 'minimal',
          outputPath: '',
          model
        };

        const costEstimate = this.estimateCost(portfolioData, options);
        const estimatedTime = config.performance.averageLatency + (complexity * 100);

        // Skip if exceeds requirements
        if (requirements?.maxCost && costEstimate.estimatedCost > requirements.maxCost) continue;
        if (requirements?.maxTime && estimatedTime > requirements.maxTime) continue;

        let score = config.performance.reliability * 0.4;
        
        // Adjust score based on capabilities
        if (config.capabilities.codeGeneration) score += 0.2;
        if (config.capabilities.jsonMode) score += 0.1;
        
        // Adjust for cost efficiency
        score += Math.max(0, (1 - costEstimate.estimatedCost / 0.1)) * 0.2;
        
        // Adjust for speed
        score += Math.max(0, (1 - estimatedTime / 5000)) * 0.1;

        recommendations.push({
          model,
          provider: providerName,
          score,
          reasoning: this.generateRecommendationReasoning(config, costEstimate, estimatedTime, complexity),
          estimatedCost: costEstimate.estimatedCost,
          estimatedTime
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  public getGenerationHistory(limit: number = 10): GenerationHistory[] {
    return Array.from(this.generationHistory.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public getGenerationById(id: string): GenerationHistory | null {
    return this.generationHistory.get(id) || null;
  }

  public regenerateFromHistory(historyId: string, modifications?: Partial<GenerationOptions>): Promise<GeneratedPortfolio> {
    const history = this.generationHistory.get(historyId);
    if (!history) {
      throw new Error('Generation history not found');
    }

    const options = { ...history.options, ...modifications };
    return this.generatePortfolio(history.portfolioData, options);
  }

  public getProviderHealthStatus(): Record<string, {
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    successRate: number;
    lastChecked: number;
  }> {
    const status: Record<string, any> = {};

    for (const [provider, metrics] of this.performanceMetrics) {
      const recentLatencies = metrics.latencies.slice(-10);
      const avgLatency = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length || 0;
      const totalRequests = metrics.successes + metrics.failures;
      const successRate = totalRequests > 0 ? metrics.successes / totalRequests : 1;

      let healthStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (successRate < 0.8 || avgLatency > 10000) healthStatus = 'degraded';
      if (successRate < 0.5 || avgLatency > 30000) healthStatus = 'down';

      status[provider] = {
        status: healthStatus,
        latency: avgLatency,
        successRate,
        lastChecked: Date.now()
      };
    }

    return status;
  }

  public async refineGeneration(
    originalResult: GeneratedPortfolio,
    refinementPrompt: string,
    options: GenerationOptions
  ): Promise<GeneratedPortfolio> {
    // Create a refinement context
    const contextId = this.createConversationContext(options.provider, options.model);
    const context = this.conversations.get(contextId)!;

    // Add the original generation and refinement request to context
    context.messages.push(
      {
        role: 'assistant',
        content: `Generated portfolio with metadata: ${JSON.stringify(originalResult.metadata)}`,
        timestamp: Date.now()
      },
      {
        role: 'user',
        content: `Please refine the portfolio based on this feedback: ${refinementPrompt}`,
        timestamp: Date.now()
      }
    );

    // Generate refined version
    return this.generatePortfolio(
      {} as PortfolioData, // Will be reconstructed from context
      { ...options, contextId }
    );
  }

  private calculatePortfolioComplexity(portfolioData: PortfolioData): number {
    let complexity = 0;
    
    // Base complexity
    complexity += 1;
    
    // Projects complexity
    complexity += (portfolioData.projects?.length || 0) * 2;
    complexity += (portfolioData.projects || []).reduce((sum, p) => sum + (p.technologies?.length || 0), 0) * 0.5;
    
    // Education complexity
    complexity += (portfolioData.education?.length || 0);
    
    // Achievements complexity
    complexity += (portfolioData.achievements?.length || 0) * 1.5;
    
    // Social links complexity
    complexity += Object.keys(portfolioData.socialLinks || {}).length * 0.5;
    
    // Content length complexity
    complexity += Math.min((portfolioData.aboutMe?.length || 0) / 100, 5);
    
    return Math.round(complexity);
  }

  private generateRecommendationReasoning(
    config: ProviderConfig,
    costEstimate: CostEstimate,
    estimatedTime: number,
    complexity: number
  ): string {
    const reasons = [];
    
    if (config.performance.reliability > 0.95) {
      reasons.push('highly reliable');
    }
    
    if (costEstimate.estimatedCost < 0.05) {
      reasons.push('cost-effective');
    }
    
    if (estimatedTime < 3000) {
      reasons.push('fast generation');
    }
    
    if (config.capabilities.codeGeneration) {
      reasons.push('excellent for code generation');
    }
    
    if (complexity > 5 && config.maxTokens > 4000) {
      reasons.push('handles complex portfolios well');
    }

    return reasons.length > 0 
      ? `Recommended because it's ${reasons.join(', ')}.`
      : 'Good general-purpose option for portfolio generation.';
  }

  private recordPerformanceMetrics(provider: string, latency: number, success: boolean) {
    if (!this.performanceMetrics.has(provider)) {
      this.performanceMetrics.set(provider, { latencies: [], successes: 0, failures: 0 });
    }

    const metrics = this.performanceMetrics.get(provider)!;
    metrics.latencies.push(latency);
    
    // Keep only recent latencies (last 100)
    if (metrics.latencies.length > 100) {
      metrics.latencies = metrics.latencies.slice(-100);
    }

    if (success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }
  }

  private saveGenerationHistory(
    portfolioData: PortfolioData,
    options: GenerationOptions,
    result: GeneratedPortfolio,
    cost?: any,
    performance?: any
  ) {
    const historyId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const history: GenerationHistory = {
      id: historyId,
      portfolioData,
      options,
      result,
      timestamp: Date.now(),
      cost,
      performance: performance || {
        generationTime: result.metadata.generationTime || 0,
        tokensPerSecond: result.metadata.tokensUsed ? 
          (result.metadata.tokensUsed / ((result.metadata.generationTime || 1) / 1000)) : 0,
        quality: result.metadata.quality || { accessibility: 0, performance: 0, seo: 0 }
      }
    };

    this.generationHistory.set(historyId, history);

    // Keep only recent history (last 100 generations)
    if (this.generationHistory.size > 100) {
      const oldestKey = Array.from(this.generationHistory.keys())[0];
      this.generationHistory.delete(oldestKey);
    }

    return historyId;
  }
}

export default new LLMService();