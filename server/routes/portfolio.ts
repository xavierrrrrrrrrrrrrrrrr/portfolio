import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PortfolioSchema } from '../types/portfolio';

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// POST: Save portfolio JSON
router.post('/', async (req: Request, res: Response) => {
  console.log('Received POST request to /api/portfolio');
  try {
    console.log('Request body:', JSON.stringify(req.body));
    const parsed = PortfolioSchema.parse(req.body);
    console.log('Validation passed');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${parsed.personalInfo.name.replace(/\s+/g, '_')}_${timestamp}.json`;
    const filepath = path.join(DATA_DIR, filename);
    
    // Save the portfolio data
    fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2));
    
    console.log(`Portfolio saved: ${filename}`);
    res.status(201).json({ 
      message: 'Portfolio saved successfully', 
      filename,
      timestamp: new Date().toISOString(),
      path: filepath
    });
  } catch (err) {
    console.error('Error saving portfolio:', err);
    console.error('Error details:', err);
    res.status(400).json({ error: 'Validation failed', details: err });
  }
});

// GET: List all JSON files
router.get('/', async (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const portfolios = files.map(filename => {
      try {
        const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
        const data = JSON.parse(content);
        return {
          filename,
          name: data.personalInfo?.name || 'Unknown',
          createdAt: data.generatedAt || 'Unknown',
          projectCount: data.projects?.length || 0
        };
      } catch (err) {
        return {
          filename,
          name: 'Error reading file',
          createdAt: 'Unknown',
          projectCount: 0
        };
      }
    });
    
    res.json({ portfolios });
  } catch (err) {
    console.error('Error listing portfolios:', err);
    res.status(500).json({ error: 'Could not list files', details: err });
  }
});

// GET: Fetch specific JSON file by filename
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const filename = req.params.name;
    const filepath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ error: 'Internal error', details: err });
  }
});

// PUT: Update existing portfolio
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const filename = req.params.name;
    const filepath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const parsed = PortfolioSchema.parse(req.body);
    
    // Update the portfolio data
    fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2));
    
    console.log(`Portfolio updated: ${filename}`);
    res.json({ 
      message: 'Portfolio updated successfully', 
      filename,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error updating portfolio:', err);
    res.status(400).json({ error: 'Update failed', details: err });
  }
});

// DELETE: Remove portfolio
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const filename = req.params.name;
    const filepath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    fs.unlinkSync(filepath);
    
    console.log(`Portfolio deleted: ${filename}`);
    res.json({ 
      message: 'Portfolio deleted successfully', 
      filename 
    });
  } catch (err) {
    console.error('Error deleting portfolio:', err);
    res.status(500).json({ error: 'Delete failed', details: err });
  }
});

// POST: Duplicate portfolio
router.post('/:name/duplicate', async (req: Request, res: Response) => {
  try {
    const filename = req.params.name;
    const filepath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const portfolioData = JSON.parse(content);
    
    // Update timestamp and create new filename
    portfolioData.generatedAt = new Date().toISOString();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFilename = `${portfolioData.personalInfo.name.replace(/\s+/g, '_')}_copy_${timestamp}.json`;
    const newFilepath = path.join(DATA_DIR, newFilename);
    
    fs.writeFileSync(newFilepath, JSON.stringify(portfolioData, null, 2));
    
    console.log(`Portfolio duplicated: ${filename} -> ${newFilename}`);
    res.status(201).json({ 
      message: 'Portfolio duplicated successfully', 
      originalFilename: filename,
      newFilename,
      timestamp: portfolioData.generatedAt
    });
  } catch (err) {
    console.error('Error duplicating portfolio:', err);
    res.status(500).json({ error: 'Duplication failed', details: err });
  }
});

// GET: Search portfolios
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const query = req.params.query.toLowerCase();
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    
    const matchingPortfolios = files
      .map(filename => {
        try {
          const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
          const data = JSON.parse(content);
          
          // Search in name, about, project names, and technologies
          const searchableText = [
            data.personalInfo?.name || '',
            data.aboutMe || '',
            ...(data.projects?.map((p: any) => p.name) || []),
            ...(data.projects?.flatMap((p: any) => p.technologies) || [])
          ].join(' ').toLowerCase();
          
          if (searchableText.includes(query)) {
            return {
              filename,
              name: data.personalInfo?.name || 'Unknown',
              createdAt: data.generatedAt || 'Unknown',
              projectCount: data.projects?.length || 0,
              relevance: (searchableText.match(new RegExp(query, 'g')) || []).length
            };
          }
          return null;
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.relevance - a.relevance);
    
    res.json({ portfolios: matchingPortfolios, query });
  } catch (err) {
    console.error('Error searching portfolios:', err);
    res.status(500).json({ error: 'Search failed', details: err });
  }
});

export default router;
