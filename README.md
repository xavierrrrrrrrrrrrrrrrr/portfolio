# AI-Powered Portfolio Generator

A full-stack application that helps users create unique, professional portfolios using AI technology.

## Features

- **Data Collection**: User-friendly forms to collect personal information, projects, education, achievements, and social links
- **Project Management**: Add GitHub projects with descriptions, images, and links
- **AI Portfolio Generation**: Generate unique, non-generic portfolio websites using LLM technology
- **Multiple Style Options**: Choose from minimal, creative, or professional styles
- **Export Options**: Download generated portfolios or save data for later use

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Vite for fast development

### Backend
- Node.js with Express
- TypeScript
- Zod for validation

### AI Integration
- OpenAI API (GPT-4)
- Google Gemini API
- Anthropic Claude API
- Ollama (local LLM option)

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/portfolio-generator.git
cd portfolio-generator
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
Create a `.env` file in the server directory with your API keys:
```
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OLLAMA_HOST=http://localhost:11434
```

4. Run the application
```bash
# From the root directory
./run.sh
```

## Usage

1. Fill out the portfolio information forms
2. Add your projects with GitHub links, descriptions, and images
3. Review and save your portfolio data
4. Generate a unique portfolio website using AI
5. Download or deploy your generated portfolio

## Commercial Use

This application is designed for commercial use with the following features:

- **Unique Portfolio Generation**: Each portfolio is uniquely generated based on user data
- **Multiple LLM Options**: Support for various LLM providers
- **Customization Options**: Different styles and design options
- **Export Flexibility**: Download or deploy options

## Future Enhancements

- User authentication and accounts
- Subscription tiers (free, premium, enterprise)
- More portfolio styles and templates
- Direct deployment to hosting services
- Analytics for portfolio views
- Custom domain integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI, Google, and Anthropic for their LLM APIs
- The open-source community for various libraries and tools used in this project