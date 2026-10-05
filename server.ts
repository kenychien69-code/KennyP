import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  checkSupabaseStatus,
  pullAllFromSupabase,
  pushAllToSupabase,
  upsertSupabaseProduct,
  deleteSupabaseProduct,
  upsertSupabaseIngredient,
  deleteSupabaseIngredient,
  insertSupabaseOrder,
  upsertSupabaseUser,
  deleteSupabaseUser,
  saveForecastToSupabase,
  getLatestForecastFromSupabase,
} from './src/server/supabaseService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // ============================================================================
  // Supabase Database Auto-Sync Endpoints
  // ============================================================================

  // 1. Connection Health & Configuration Check
  app.get('/api/supabase/status', async (req, res) => {
    try {
      const status = await checkSupabaseStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ connected: false, message: err.message || 'Status check failed' });
    }
  });

  // 2. Pull all records from Supabase tables
  app.get('/api/supabase/pull', async (req, res) => {
    try {
      const data = await pullAllFromSupabase();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to pull data from Supabase' });
    }
  });

  // 3. Push full data / initialize seed to Supabase
  app.post('/api/supabase/push-all', async (req, res) => {
    try {
      const result = await pushAllToSupabase(req.body);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to push data to Supabase' });
    }
  });

  // Static serving for persistent user uploaded product photos
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Image Upload API (Permanently stores image to disk as a static asset)
  app.post('/api/upload-image', (req, res) => {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      let buffer: Buffer;
      let extension = 'jpg';

      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) extension = 'png';
        else if (mime.includes('webp')) extension = 'webp';
        else if (mime.includes('gif')) extension = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image, 'base64');
      }

      const cleanName = (name || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 20);
      const filename = `prod_${cleanName}_${Date.now()}.${extension}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      // Also copy to dist/uploads if dist directory exists
      const distDir = path.join(__dirname, 'dist', 'uploads');
      if (fs.existsSync(path.join(__dirname, 'dist'))) {
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        fs.writeFileSync(path.join(distDir, filename), buffer);
      }

      const publicUrl = `/uploads/${filename}`;
      return res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error('Image upload error:', err);
      return res.status(500).json({ error: err.message || 'Failed to upload image' });
    }
  });

  // 4. Products CRUD
  app.post('/api/supabase/product', async (req, res) => {
    try {
      const result = await upsertSupabaseProduct(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/supabase/product/:id', async (req, res) => {
    try {
      const result = await deleteSupabaseProduct(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Ingredients CRUD & Restocking
  app.post('/api/supabase/ingredient', async (req, res) => {
    try {
      const result = await upsertSupabaseIngredient(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/supabase/ingredient/:id', async (req, res) => {
    try {
      const result = await deleteSupabaseIngredient(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Complete Order POS Transaction
  app.post('/api/supabase/order', async (req, res) => {
    try {
      const result = await insertSupabaseOrder(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Users / Staff Accounts CRUD
  app.post('/api/supabase/user', async (req, res) => {
    try {
      const result = await upsertSupabaseUser(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/supabase/user/:username', async (req, res) => {
    try {
      const result = await deleteSupabaseUser(req.params.username);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Forecast automatic persistence directly into Supabase `sales_forecasts` table
  let cachedLatestForecast: any = null;
  app.post('/api/supabase/forecast', async (req, res) => {
    try {
      cachedLatestForecast = {
        ...req.body,
        savedAt: new Date().toISOString(),
      };
      // Write into Supabase database table `sales_forecasts`
      const supabaseResult = await saveForecastToSupabase(req.body);
      res.json({ success: true, savedAt: cachedLatestForecast.savedAt, supabaseResult });
    } catch (err: any) {
      console.warn('Forecast persistence warning:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/supabase/forecast', async (req, res) => {
    try {
      const fromDb = await getLatestForecastFromSupabase();
      if (fromDb) {
        return res.json(fromDb);
      }
      res.json(cachedLatestForecast || { null: true });
    } catch {
      res.json(cachedLatestForecast || { null: true });
    }
  });

  // API to execute the predictive engine directly
  app.post('/api/forecast', (req, res) => {
    const inputData = req.body;
    const pythonProc = spawn('python3', [path.join(__dirname, 'forecaster.py'), '--json-input']);

    let stdout = '';
    let stderr = '';

    pythonProc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProc.on('close', async (code) => {
      if (code !== 0) {
        console.warn('Python forecaster process warning:', stderr);
        return res.status(500).json({ error: 'Python execution error', details: stderr });
      }
      try {
        const parsed = JSON.parse(stdout);
        // Persist to Supabase in the background
        saveForecastToSupabase(parsed).catch((e) => console.warn('Background forecast save notice:', e));
        res.json(parsed);
      } catch (err) {
        res.status(500).json({ error: 'Failed to parse Python forecaster output', raw: stdout });
      }
    });

    // Write input JSON to python stdin
    pythonProc.stdin.write(JSON.stringify(inputData));
    pythonProc.stdin.end();
  });

  // Health and System Capabilities API
  app.get('/api/system-info', (req, res) => {
    res.json({
      status: 'operational',
      engine: 'KENNY Brew Intelligence POS & ML Server',
      pythonAvailable: true,
      database: 'Supabase PostgreSQL (Active / Configurable)',
      timestamp: new Date().toISOString(),
    });
  });

  // Setup Vite development middleware
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KENNY Brew Intelligence running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
