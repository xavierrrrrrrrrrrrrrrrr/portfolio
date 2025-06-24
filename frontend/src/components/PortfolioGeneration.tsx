import React, { useState } from 'react';
import { Sparkles, Download, ExternalLink, Check, AlertCircle, Code, Cpu } from 'lucide-react';
import { PortfolioData } from '../types/portfolio';

interface PortfolioGenerationProps {
  data: PortfolioData;
}

type PortfolioStyle = 'minimal' | 'creative' | 'professional' | 'modern' | 'dark' | 'glassmorphism';
type LLMProvider = 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'openrouter';

interface StyleOption {
  id: PortfolioStyle;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ProviderOption {
  id: LLMProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface GeneratedPortfolio {
  html: string;
  css: string;
  js: string;
  metadata: {
    generatedAt: string;
    provider: string;
    style: string;
  };
}

interface GenerationResponse {
  success: boolean;
  message: string;
  portfolio: GeneratedPortfolio;
  downloadUrl: string;
}

export const PortfolioGeneration: React.FC<PortfolioGenerationProps> = ({ data }) => {
  const [selectedStyle, setSelectedStyle] = useState<PortfolioStyle>('minimal');
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [selectedModel, setSelectedModel] = useState<string>(''); // For OpenRouter model selection
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResponse, setGenerationResponse] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const styleOptions: StyleOption[] = [
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean, simple design with focus on content',
      icon: <div className="w-5 h-5 bg-gray-800 rounded-full"></div>,
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Unique, artistic design with bold elements',
      icon: <div className="w-5 h-5 bg-purple-600 rounded-full"></div>,
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Polished, business-oriented design',
      icon: <div className="w-5 h-5 bg-teal-600 rounded-full"></div>,
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Contemporary design with sidebar navigation',
      icon: <div className="w-5 h-5 bg-blue-600 rounded-full"></div>,
    },
  ];

  const providerOptions: ProviderOption[] = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      description: 'Powerful, high-quality portfolio generation',
      icon: <Cpu className="w-5 h-5 text-green-500" />,
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Creative, modern portfolio designs',
      icon: <Cpu className="w-5 h-5 text-blue-500" />,
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Detailed, thoughtful portfolio layouts',
      icon: <Cpu className="w-5 h-5 text-purple-500" />,
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      description: 'Private, on-device portfolio generation',
      icon: <Cpu className="w-5 h-5 text-orange-500" />,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      description: 'API gateway to Gemini/DeepSeek models',
      icon: <Cpu className="w-5 h-5 text-indigo-500" />,
    },
  ];

  const generatePortfolio = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationResponse(null);
    
    try {
      let apiUrl = `http://localhost:12000/api/generate?provider=${selectedProvider}&style=${selectedStyle}`;
      
      // Add model parameter for OpenRouter
      if (selectedProvider === 'openrouter' && selectedModel) {
        apiUrl += `&model=${selectedModel}`;
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate portfolio');
      }
      
      const result = await response.json();
      setGenerationResponse(result);
    } catch (err) {
      console.error('Error generating portfolio:', err);
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Failed to generate portfolio: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPortfolio = () => {
    if (!generationResponse) return;
    
    // Create a link to download the ZIP file
    const downloadUrl = `http://localhost:12000${generationResponse.downloadUrl}`;
    window.open(downloadUrl, '_blank');
  };

  const previewPortfolio = () => {
    if (!generationResponse?.portfolio) return;
    
    // Create a new window with the generated HTML
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Please allow popups to preview your portfolio');
      return;
    }
    
    // Write the HTML, CSS, and JS to the new window
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.personalInfo.name} - Portfolio Preview</title>
        <style>${generationResponse.portfolio.css}</style>
      </head>
      <body>
        ${generationResponse.portfolio.html}
        <script>${generationResponse.portfolio.js}</script>
      </body>
      </html>
    `);
    newWindow.document.close();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center mb-6">
        <Sparkles className="w-6 h-6 text-blue-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Generate Your Portfolio</h2>
      </div>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">AI-Powered Portfolio Generation</h3>
        <p className="text-blue-700">
          Our AI will create a unique, beautiful portfolio website based on your information.
          Choose a style and AI provider below, then click "Generate Portfolio" to begin.
        </p>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Choose a Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {styleOptions.map((style) => (
            <div
              key={style.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedStyle === style.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {style.icon}
                  <span className="ml-2 font-medium">{style.name}</span>
                </div>
                {selectedStyle === style.id && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">{style.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Choose an AI Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerOptions.map((provider) => (
            <div
              key={provider.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedProvider === provider.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
              onClick={() => setSelectedProvider(provider.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {provider.icon}
                  <span className="ml-2 font-medium">{provider.name}</span>
                </div>
                {selectedProvider === provider.id && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">{provider.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Model selection for OpenRouter */}
      {selectedProvider === 'openrouter' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Select Model</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a model</option>
            <option value="google/gemini-pro">Google Gemini Pro</option>
            <option value="deepseek-ai/deepseek-coder">DeepSeek-R1</option>
          </select>
        </div>
      )}
      
      <div className="flex justify-center mb-8">
        <button
          onClick={generatePortfolio}
          disabled={isGenerating || (selectedProvider === 'openrouter' && !selectedModel)}
          className={`flex items-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 ${
            isGenerating || (selectedProvider === 'openrouter' && !selectedModel)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Portfolio'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {generationResponse && (
        <div className="border border-green-200 rounded-lg p-6 bg-green-50">
          <div className="flex items-center mb-4">
            <Check className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-green-800">Portfolio Generated Successfully!</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-green-700 mb-4">
              Your portfolio has been generated in the {selectedStyle} style using {selectedProvider.toUpperCase()}. 
              You can now download it or preview it.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadPortfolio}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Portfolio
              </button>
              
              <button
                onClick={previewPortfolio}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Portfolio
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-100">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'html' ? 'bg-white text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('html')}
              >
                <Code className="w-4 h-4 inline mr-1" />
                HTML
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'css' ? 'bg-white text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('css')}
              >
                <Code className="w-4 h-4 inline mr-1" />
                CSS
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'js' ? 'bg-white text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('js')}
              >
                <Code className="w-4 h-4 inline mr-1" />
                JavaScript
              </button>
            </div>
            <div className="bg-white p-4 overflow-auto max-h-60">
              <pre className="text-xs text-gray-700">
                {activeTab === 'html' && generationResponse.portfolio.html}
                {activeTab === 'css' && generationResponse.portfolio.css}
                {activeTab === 'js' && generationResponse.portfolio.js}
              </pre>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Generated at: {new Date(generationResponse.portfolio.metadata.generatedAt).toLocaleString()}</p>
            <p>Provider: {generationResponse.portfolio.metadata.provider}</p>
            <p>Style: {generationResponse.portfolio.metadata.style}</p>
          </div>
        </div>
      )}
    </div>
  );
};