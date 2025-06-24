#!/bin/bash

# Kill any existing processes
pkill -f "npm run dev" || true

# Set environment variables for LLM integration
# In a real implementation, these would be stored securely
# and not in the script
# Uncomment and add your API keys to use the actual LLM services

# OpenAI API
# export OPENAI_API_KEY="your-openai-api-key"

# Google Gemini API (via OpenRouter)
export GEMINI_API_KEY="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"

# Anthropic Claude API
# export ANTHROPIC_API_KEY="your-anthropic-api-key"

# OpenRouter API (supports multiple models including DeepSeek)
export OPENROUTER_API_KEY="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"
export OPENROUTER_API_URL="hhttps://openrouter.ai/api/v1"

# DeepSeek API (direct)
export DEEPSEEK_API_KEY=""
export DEEPSEEK_API_URL="https://api.deepseek.com/v1/chat/completions"

# Ollama (local)
# export OLLAMA_HOST="http://localhost:11434"
# export OLLAMA_MODEL="llama3"

# Start the server
(cd server && PORT=12000 npm run dev > ../server.log 2>&1) &
SERVER_PID=$!
echo "Server started with PID $SERVER_PID"

# Wait a moment for the server to start
sleep 3

# Start the frontend
(cd frontend && npm run dev > ../frontend.log 2>&1) &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID"

# Display the URLs
echo "Server running at: http://localhost:12000"
echo "Frontend running at: http://localhost:12002"
echo "API endpoints:"
echo "  - Save portfolio: POST http://localhost:12000/api/portfolio"
echo "  - Generate portfolio: POST http://localhost:12000/api/generate"
echo "  - List generated portfolios: GET http://localhost:12000/api/generate/list"
echo "  - Download portfolio: GET http://localhost:12000/api/generate/download/:filename"

# Print LLM configuration
echo ""
echo "LLM Configuration:"
if [ -n "$OPENAI_API_KEY" ]; then
  echo "  - OpenAI: Configured"
else
  echo "  - OpenAI: Not configured (will use template fallback)"
fi

if [ -n "$GEMINI_API_KEY" ]; then
  echo "  - Gemini: Configured"
else
  echo "  - Gemini: Not configured (will use template fallback)"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "  - Claude: Configured"
else
  echo "  - Claude: Not configured (will use template fallback)"
fi

if [ -n "$OLLAMA_HOST" ]; then
  echo "  - Ollama: Configured ($OLLAMA_HOST, model: ${OLLAMA_MODEL:-llama3})"
else
  echo "  - Ollama: Not configured (will use template fallback)"
fi

if [ -n "$OPENROUTER_API_KEY" ]; then
  echo "  - OpenRouter: Configured (supports multiple models)"
else
  echo "  - OpenRouter: Not configured (will use template fallback)"
fi

if [ -n "$DEEPSEEK_API_KEY" ]; then
  echo "  - DeepSeek: Configured"
else
  echo "  - DeepSeek: Not configured (will use template fallback)"
fi

echo ""
echo "Press Ctrl+C to stop both processes"

# Keep the script running
wait