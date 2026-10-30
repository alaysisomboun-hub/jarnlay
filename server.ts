import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialSales,
  initialExpenses,
  initialStockMovements,
  initialStaff,
  initialSettings,
  initialAuditLogs,
} from './src/lib/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'pos-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface PosDbSchema {
  products: any[];
  customers: any[];
  suppliers: any[];
  sales: any[];
  incomeExpenses: any[];
  stockMovements: any[];
  staffList: any[];
  settings: any;
  auditLogs: any[];
  lastUpdated: number;
}

// Initialize database file if missing or corrupt
function getInitialDbState(): PosDbSchema {
  return {
    products: initialProducts,
    customers: initialCustomers,
    suppliers: initialSuppliers,
    sales: initialSales,
    incomeExpenses: initialExpenses,
    stockMovements: initialStockMovements,
    staffList: initialStaff,
    settings: initialSettings,
    auditLogs: initialAuditLogs,
    lastUpdated: Date.now(),
  };
}

let dbMemory: PosDbSchema;

function loadDatabase(): PosDbSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading pos-db.json, using defaults:', err);
  }
  const initial = getInitialDbState();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: PosDbSchema) {
  try {
    dbMemory = data;
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Error saving pos-db.json:', err);
  }
}

// Load into memory on start
dbMemory = loadDatabase();

// SSE Client Connections for Instant Real-Time Push
interface SseClient {
  id: string;
  res: Response;
}
let sseClients: SseClient[] = [];

function broadcastSse(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify({ ...payload, timestamp: Date.now() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch {
      // Handled by close event
    }
  });
}

// Heartbeat ping every 15s to keep mobile browser connections open
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(': keepalive\n\n');
    } catch {
      // Ignore
    }
  });
}, 15000);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS for local testing & device access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    productCount: dbMemory.products.length,
    activeConnections: sseClients.length,
  });
});

// Real-Time SSE Stream Endpoint
app.get('/api/sync/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newClient: SseClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, lastUpdated: dbMemory.lastUpdated })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Full Sync Fetch (Used on app startup or reconnect)
app.get('/api/sync', (_req, res) => {
  res.json({
    success: true,
    lastUpdated: dbMemory.lastUpdated,
    data: dbMemory,
  });
});

// Full Sync Push / Merge (Used when updating products, checkout, stock adjust)
app.post('/api/sync', (req, res) => {
  try {
    const payload = req.body;
    const now = Date.now();

    if (payload.products && Array.isArray(payload.products)) {
      dbMemory.products = payload.products;
    }
    if (payload.customers && Array.isArray(payload.customers)) {
      dbMemory.customers = payload.customers;
    }
    if (payload.suppliers && Array.isArray(payload.suppliers)) {
      dbMemory.suppliers = payload.suppliers;
    }
    if (payload.sales && Array.isArray(payload.sales)) {
      dbMemory.sales = payload.sales;
    }
    if (payload.incomeExpenses && Array.isArray(payload.incomeExpenses)) {
      dbMemory.incomeExpenses = payload.incomeExpenses;
    }
    if (payload.stockMovements && Array.isArray(payload.stockMovements)) {
      dbMemory.stockMovements = payload.stockMovements;
    }
    if (payload.staffList && Array.isArray(payload.staffList)) {
      dbMemory.staffList = payload.staffList;
    }
    if (payload.settings && typeof payload.settings === 'object') {
      dbMemory.settings = payload.settings;
    }
    if (payload.auditLogs && Array.isArray(payload.auditLogs)) {
      dbMemory.auditLogs = payload.auditLogs;
    }

    dbMemory.lastUpdated = now;
    saveDatabase(dbMemory);

    // Broadcast instant update to all other devices/browsers!
    broadcastSse('sync_update', {
      source: payload.sourceDevice || 'client',
      updatedKeys: Object.keys(payload).filter((k) => k !== 'sourceDevice'),
      lastUpdated: now,
      data: dbMemory,
    });

    res.json({ success: true, lastUpdated: now });
  } catch (err: any) {
    console.error('Error during /api/sync POST:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Specific Product CRUD for fast incremental mobile updates
app.post('/api/products', (req, res) => {
  try {
    const newProduct = req.body;
    if (!newProduct || !newProduct.name) {
      res.status(400).json({ error: 'Product name is required' });
      return;
    }

    // Check if product already exists by id
    const existingIndex = dbMemory.products.findIndex((p) => p.id === newProduct.id);
    if (existingIndex >= 0) {
      dbMemory.products[existingIndex] = {
        ...dbMemory.products[existingIndex],
        ...newProduct,
        updatedAt: new Date().toISOString(),
      };
    } else {
      dbMemory.products.unshift({
        ...newProduct,
        id: newProduct.id || `prod-${Date.now()}`,
        createdAt: newProduct.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const now = Date.now();
    dbMemory.lastUpdated = now;
    saveDatabase(dbMemory);

    broadcastSse('product_updated', {
      product: newProduct,
      allProducts: dbMemory.products,
      lastUpdated: now,
    });

    res.json({ success: true, product: newProduct, lastUpdated: now });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const index = dbMemory.products.findIndex((p) => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    dbMemory.products[index] = {
      ...dbMemory.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const now = Date.now();
    dbMemory.lastUpdated = now;
    saveDatabase(dbMemory);

    broadcastSse('product_updated', {
      productId: id,
      updatedProduct: dbMemory.products[index],
      allProducts: dbMemory.products,
      lastUpdated: now,
    });

    res.json({ success: true, product: dbMemory.products[index], lastUpdated: now });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    dbMemory.products = dbMemory.products.filter((p) => p.id !== id);

    const now = Date.now();
    dbMemory.lastUpdated = now;
    saveDatabase(dbMemory);

    broadcastSse('product_deleted', {
      productId: id,
      allProducts: dbMemory.products,
      lastUpdated: now,
    });

    res.json({ success: true, id, lastUpdated: now });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup Frontend Serving: Vite in Dev, Static in Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev middleware mounted');
  } else {
    // Production mode: Serve dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('📦 Serving production build from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LaoPOS Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Real-time Sync API ready at /api/sync & /api/sync/events`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
