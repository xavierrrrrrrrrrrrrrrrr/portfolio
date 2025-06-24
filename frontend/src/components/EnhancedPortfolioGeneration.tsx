import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Download, ExternalLink, Check, AlertCircle, Code, Cpu, 
  DollarSign, Clock, TrendingUp, History, RefreshCw, Settings,
  Zap, Shield, Target, BarChart3, Lightbulb, Star
} from 'lucide-react';
import { PortfolioData } from '../types/portfolio';

interface EnhancedPortfolioGenerationProps {
  data: PortfolioData;
}

interface Provider {
  name: string;
  displayName: string;
  available: boolean;
  description: string;
  models: string[];
  defaultModel: string;
  maxTokens: number;
  supportsStreaming: boolean;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  pricing?: {
    inputTokens: number;
    outputTokens: number;
    currency: string;
  };
  capabilities: {
    codeGeneration: boolean;
    multimodal: boolean;
    functionCalling: boolean;
    jsonMode: boolean;
  };
  performance: {
    averageLatency: number;
    reliability: number;
  };
}

interface ModelRecommendation {
  model: string;
  provider: string;
  score: number;
  reasoning: string;
  estimatedCost: number;
  estimatedTime: number;
}

interface CostEstimate {
  estimatedCost: number;
  currency: string;
  breakdown: {
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
  };
  confidence: number;
}

interface GenerationHistory {
  id: string;
  timestamp: number;
  options: any;
  result: any;
  cost?: {
    amount: number;
    currency: string;
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

export const EnhancedPortfolioGeneration: React.FC<EnhancedPortfolioGenerationProps> = ({ data }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('minimal');
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  const [providerHealth, setProviderHealth] = useState<Record<string, any>>({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<any>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [useStreaming, setUseStreaming] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'health'>('generate');

  // Fetch initial data
  useEffect(() => {
    fetchProviders();
    fetchRecommendations();
    fetchGenerationHistory();
    fetchProviderHealth();
    
    // Set up periodic health checks
    const healthInterval = setInterval(fetchProviderHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  // Update cost estimate when parameters change
  useEffect(() => {
    if (selectedProvider && data) {
      updateCostEstimate();
    }
  }, [selectedProvider, selectedModel, selectedStyle, temperature, maxTokens, data]);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/generate/providers');
      const result = await response.json();
      setProviders(result.providers || []);
      
      // Set default selections
      const firstAvailable = result.providers?.find((p: Provider) => p.available);
      if (firstAvailable) {
        setSelectedProvider(firstAvailable.name);
        setSelectedModel(firstAvailable.defaultModel);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/generate/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          portfolioData: data,
          requirements: { maxCost: 0.5, prioritizeQuality: true }
        })
      });
      const result = await response.json();
      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const updateCostEstimate = async () => {
    try {
      const response = await fetch('/api/generate/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioData: data,
          options: {
            provider: selectedProvider,
            style: selectedStyle,
            model: selectedModel,
            temperature,
            maxTokens
          }
        })
      });
      const estimate = await response.json();
      setCostEstimate(estimate);
    } catch (error) {
      console.error('Failed to estimate cost:', error);
    }
  };

  const fetchGenerationHistory = async () => {
    try {
      const response = await fetch('/api/generate/history');
      const result = await response.json();
      setGenerationHistory(result.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchProviderHealth = async () => {
    try {
      const response = await fetch('/api/generate/health');
      const result = await response.json();
      setProviderHealth(result.providers || {});
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    }
  };

  const generatePortfolio = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);
    setGenerationProgress(null);

    try {
      const params = new URLSearchParams({
        provider: selectedProvider,
        style: selectedStyle,
        model: selectedModel,
        streaming: useStreaming.toString(),
        temperature: temperature.toString(),
        maxTokens: maxTokens.toString()
      });

      if (useStreaming) {
        await generateWithStreaming(params);
      } else {
        await generateWithoutStreaming(params);
      }
      
      // Refresh history after generation
      fetchGenerationHistory();
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithStreaming = async (params: URLSearchParams) => {
    const response = await fetch(`/api/generate/stream?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to start generation');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response reader available');

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
              setGenerationResult(eventData.data);
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

  const generateWithoutStreaming = async (params: URLSearchParams) => {
    const response = await fetch(`/api/generate?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Generation failed');
    
    const result = await response.json();
    setGenerationResult(result);
  };

  const regenerateFromHistory = async (historyId: string) => {
    try {
      const response = await fetch(`/api/generate/history/${historyId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modifications: {
            provider: selectedProvider,
            model: selectedModel,
            style: selectedStyle
          }
        })
      });

      if (!response.ok) throw new Error('Regeneration failed');
      
      const result = await response.json();
      setGenerationResult(result);
      fetchGenerationHistory();
    } catch (error) {
      console.error('Regeneration failed:', error);
      setError('Failed to regenerate portfolio');
    }
  };

  const applyRecommendation = (recommendation: ModelRecommendation) => {
    setSelectedProvider(recommendation.provider);
    setSelectedModel(recommendation.model);
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Shield className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">AI Portfolio Generator</h2>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'generate' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              History
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'health' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Health
            </button>
          </div>
        </div>

        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* AI Model Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.slice(0, 2).map((rec, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-lg p-3 border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => applyRecommendation(rec)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-sm">{rec.provider}/{rec.model}</span>
                        </div>
                        <span className="text-xs text-gray-500">Score: {(rec.score * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{rec.reasoning}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatCurrency(rec.estimatedCost, 'USD')}</span>
                        <span>{formatDuration(rec.estimatedTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provider Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    const provider = providers.find(p => p.name === e.target.value);
                    if (provider) setSelectedModel(provider.defaultModel);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {providers.map(provider => (
                    <option key={provider.name} value={provider.name} disabled={!provider.available}>
                      {provider.displayName} {!provider.available && '(Unavailable)'}
                    </option>
                  ))}
                </select>
                
                {selectedProvider && providerHealth[selectedProvider] && (
                  <div className="mt-2 flex items-center space-x-2 text-sm">
                    {getHealthStatusIcon(providerHealth[selectedProvider].status)}
                    <span className="text-gray-600">
                      {formatDuration(providerHealth[selectedProvider].latency)} avg latency
                    </span>
                    <span className="text-gray-600">
                      {(providerHealth[selectedProvider].successRate * 100).toFixed(1)}% success rate
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {providers.find(p => p.name === selectedProvider)?.models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost Estimation */}
            {costEstimate && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Cost Estimate</h3>
                  <span className="text-sm text-gray-500">
                    ({(costEstimate.confidence * 100).toFixed(0)}% confidence)
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Cost</span>
                    <div className="font-semibold text-green-700">
                      {formatCurrency(costEstimate.estimatedCost, costEstimate.currency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Input Tokens</span>
                    <div className="font-semibold">{costEstimate.breakdown.inputTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Output Tokens</span>
                    <div className="font-semibold">{costEstimate.breakdown.outputTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. Time</span>
                    <div className="font-semibold">
                      {providers.find(p => p.name === selectedProvider)?.performance.averageLatency 
                        ? formatDuration(providers.find(p => p.name === selectedProvider)!.performance.averageLatency)
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <Settings className="w-4 h-4" />
                <span>Advanced Settings</span>
              </button>
              
              {showAdvanced && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature: {temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Lower = more focused, Higher = more creative
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Tokens: {maxTokens}
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="8000"
                      step="500"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="streaming"
                      checked={useStreaming}
                      onChange={(e) => setUseStreaming(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="streaming" className="text-sm text-gray-700">
                      Enable Streaming
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePortfolio}
              disabled={isGenerating || !selectedProvider}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Generate Portfolio</span>
                </>
              )}
            </button>

            {/* Progress Display */}
            {generationProgress && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Generation Progress</span>
                </div>
                <div className="text-sm text-gray-600">
                  Stage: {generationProgress.stage} ({generationProgress.progress}%)
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {/* Results Display */}
            {generationResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Portfolio Generated Successfully!</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
                
                {generationResult.cost && (
                  <div className="text-sm text-gray-600">
                    Cost: {formatCurrency(generationResult.cost, 'USD')} | 
                    Generation Time: {formatDuration(generationResult.portfolio?.metadata?.generationTime || 0)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generation History</h3>
            {generationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No generation history yet. Generate your first portfolio to see it here.
              </div>
            ) : (
              <div className="space-y-3">
                {generationHistory.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.options?.provider}/{item.options?.model}
                        </span>
                      </div>
                      <button
                        onClick={() => regenerateFromHistory(item.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Cost</span>
                        <div className="font-medium">
                          {item.cost ? formatCurrency(item.cost.amount, item.cost.currency) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Time</span>
                        <div className="font-medium">{formatDuration(item.performance.generationTime)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Speed</span>
                        <div className="font-medium">{item.performance.tokensPerSecond.toFixed(1)} tok/s</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Quality</span>
                        <div className="font-medium">
                          {((item.performance.quality.accessibility + item.performance.quality.performance + item.performance.quality.seo) / 3 * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Provider Health Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(providerHealth).map(([provider, health]) => (
                <div key={provider} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getHealthStatusIcon(health.status)}
                      <span className="font-medium text-gray-900">
                        {providers.find(p => p.name === provider)?.displayName || provider}
                      </span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      health.status === 'healthy' ? 'bg-green-100 text-green-800' :
                      health.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {health.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Latency</span>
                      <div className="font-medium">{formatDuration(health.latency)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Success Rate</span>
                      <div className="font-medium">{(health.successRate * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Last checked: {new Date(health.lastChecked).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};