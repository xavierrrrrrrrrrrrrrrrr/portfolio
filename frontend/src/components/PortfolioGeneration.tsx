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
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResponse, setGenerationResponse] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [useStreaming, setUseStreaming] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<any>(null);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [contextId, setContextId] = useState<string | null>(null);

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

  // Fetch available providers on component mount
  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/generate/providers');
        const data = await response.json();
        setAvailableProviders(data.providers || []);
        
        // Set default provider to first available one
        const firstAvailable = data.providers?.find((p: any) => p.available);
        if (firstAvailable) {
          setSelectedProvider(firstAvailable.name);
          setSelectedModel(firstAvailable.defaultModel);
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    };

    fetchProviders();
  }, []);

  const providerOptions: ProviderOption[] = availableProviders.map(provider => ({
    id: provider.name,
    name: provider.displayName,
    description: provider.description,
    icon: <Cpu className="w-5 h-5 text-blue-500" />,
  }));

  const generatePortfolio = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationResponse(null);
    setGenerationProgress(null);
    
    try {
      if (useStreaming) {
        await generateWithStreaming();
      } else {
        await generateWithoutStreaming();
      }
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

  const generateWithStreaming = async () => {
    const params = new URLSearchParams({
      provider: selectedProvider,
      style: selectedStyle,
      ...(selectedModel && { model: selectedModel }),
      streaming: 'true',
      temperature: temperature.toString(),
      maxTokens: maxTokens.toString()
    });

    const response = await fetch(`/api/generate/stream?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to start streaming generation');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            
            if (eventData.type === 'progress') {
              setGenerationProgress(eventData.data);
            } else if (eventData.type === 'complete') {
              setGenerationResponse(eventData.data);
              setContextId(eventData.data.contextId);
            } else if (eventData.type === 'error') {
              throw new Error(eventData.data.message);
            }
          } catch (parseError) {
            console.error('Error parsing streaming data:', parseError);
          }
        }
      }
    }
  };

  const generateWithoutStreaming = async () => {
    const params = new URLSearchParams({
      provider: selectedProvider,
      style: selectedStyle,
      ...(selectedModel && { model: selectedModel }),
      temperature: temperature.toString(),
      maxTokens: maxTokens.toString()
    });
    
    const response = await fetch(`/api/generate?${params}`, {
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
    setContextId(result.contextId);
  };

  const downloadPortfolio = () => {
    if (!generationResponse) return;
    
    // Create a link to download the ZIP file
    const downloadUrl = generationResponse.downloadUrl;
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
      
      {/* Model selection */}
      {selectedProvider && availableProviders.find(p => p.name === selectedProvider)?.models && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Select Model</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableProviders.find(p => p.name === selectedProvider)?.models.map((model: string) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      )}

      {/* Advanced Options */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Advanced Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (Creativity): {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative</span>
              <span>Creative</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens: {maxTokens}
            </label>
            <input
              type="range"
              min="1000"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Short</span>
              <span>Detailed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="streaming"
            checked={useStreaming}
            onChange={(e) => setUseStreaming(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="streaming" className="ml-2 block text-sm text-gray-700">
            Enable real-time streaming (see progress as it generates)
          </label>
        </div>
      </div>
      
      <div className="flex justify-center mb-8">
        <button
          onClick={generatePortfolio}
          disabled={isGenerating || !selectedProvider || (selectedProvider && availableProviders.find(p => p.name === selectedProvider)?.models && !selectedModel)}
          className={`flex items-center px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 ${
            isGenerating || !selectedProvider || (selectedProvider && availableProviders.find(p => p.name === selectedProvider)?.models && !selectedModel)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Portfolio'}
        </button>
      </div>

      {/* Progress Display */}
      {isGenerating && generationProgress && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Sparkles className="w-5 h-5 text-blue-500 mr-2 animate-spin" />
            <h3 className="text-lg font-medium text-blue-800">Generation Progress</h3>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-blue-700 mb-1">
              <span>{generationProgress.stage?.replace('_', ' ') || 'Processing...'}</span>
              <span>{generationProgress.progress || 0}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress.progress || 0}%` }}
              ></div>
            </div>
          </div>
          {generationProgress.stage && (
            <p className="text-sm text-blue-600">
              {getProgressMessage(generationProgress.stage)}
            </p>
          )}
        </div>
      )}
      
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
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <p><strong>Generated:</strong> {new Date(generationResponse.portfolio.metadata.generatedAt).toLocaleString()}</p>
              <p><strong>Provider:</strong> {generationResponse.portfolio.metadata.provider}</p>
              <p><strong>Model:</strong> {generationResponse.portfolio.metadata.model || 'Default'}</p>
              <p><strong>Style:</strong> {generationResponse.portfolio.metadata.style}</p>
            </div>
            <div>
              {generationResponse.portfolio.metadata.tokensUsed && (
                <p><strong>Tokens Used:</strong> {generationResponse.portfolio.metadata.tokensUsed.toLocaleString()}</p>
              )}
              {generationResponse.portfolio.metadata.generationTime && (
                <p><strong>Generation Time:</strong> {(generationResponse.portfolio.metadata.generationTime / 1000).toFixed(2)}s</p>
              )}
              {generationResponse.portfolio.metadata.quality && (
                <div>
                  <p><strong>Quality Scores:</strong></p>
                  <p className="ml-2">Accessibility: {generationResponse.portfolio.metadata.quality.accessibility}%</p>
                  <p className="ml-2">Performance: {generationResponse.portfolio.metadata.quality.performance}%</p>
                  <p className="ml-2">SEO: {generationResponse.portfolio.metadata.quality.seo}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getProgressMessage(stage: string): string {
    const messages: Record<string, string> = {
      'initializing': 'Setting up generation parameters...',
      'templates_loaded': 'Loading portfolio templates...',
      'ai_content_generated': 'AI is enhancing your content...',
      'templates_compiled': 'Compiling your portfolio...',
      'complete': 'Portfolio generation complete!'
    };
    
    return messages[stage] || 'Processing...';
  }
};