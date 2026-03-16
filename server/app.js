const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.resolve(__dirname, '../dist');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '../public/uploads');

const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  charset: 'utf8mb4_unicode_ci',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logDir, 'production.log'), { flags: 'a' });

app.use(express.json({ limit: '100mb' }));
app.use(compression());
app.use(helmet());
app.use(morgan('combined', { stream: accessLogStream }));

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.get('/api/health', async (req, res) => {
  let dbOk = false;
  let uploadsWritable = false;
  let memory = { total: os.totalmem(), free: os.freemem() };
  let disk = { total: null, used: null, free: null };
  try {
    const conn = await dbPool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    dbOk = true;
  } catch (e) {}
  try {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const testFile = path.join(UPLOADS_DIR, `.writetest_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    uploadsWritable = true;
  } catch (e) {}
  try {
    exec('df -Pk', (err, stdout) => {
      if (!err && stdout) {
        const lines = stdout.trim().split('\n');
        const parts = lines[lines.length - 1].split(/\s+/);
        disk.total = parseInt(parts[1], 10) * 1024;
        disk.used = parseInt(parts[2], 10) * 1024;
        disk.free = parseInt(parts[3], 10) * 1024;
      }
      res.json({ db: dbOk, uploadsWritable, memory, disk });
    });
  } catch (e) {
    res.json({ db: dbOk, uploadsWritable, memory, disk });
  }
});

app.post('/api/sync-status', async (req, res) => {
  const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
  const results = [];
  for (const u of urls) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(u, { 
        method: 'HEAD', 
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      clearTimeout(t);
      results.push({ url: u, ok: r.ok, status: r.status });
    } catch (e) {
      results.push({ url: u, ok: false });
    }
  }
  res.json({ items: results });
});

// Scraper logic kept in Node.js because of CORS restrictions on client-side scraping
app.post('/api/scrape', async (req, res) => {
  const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
  if (urls.length === 0) return res.status(400).json({ error: 'no_urls' });

  const results = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await response.text();

      let title = '';
      let description = '';
      let images = [];

      // Simple regex based parsing (mimicking the robust PHP logic)
      const titleMatch = html.match(/<(?:meta|title)[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["']/i) || 
                         html.match(/<title>([^<]+)<\/title>/i) ||
                         html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (titleMatch) title = titleMatch[1].trim();

      const descMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:)?description["'][^>]*content=["']([^"']+)["']/i);
      if (descMatch) description = descMatch[1].trim();

      const imgMatches = html.matchAll(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi);
      for (const m of imgMatches) images.push(m[1]);

      if (images.length === 0) {
        const fallbackImgs = html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
        for (const m of fallbackImgs) {
          if (m[1].includes('property') || m[1].includes('listing')) images.push(m[1]);
        }
      }

      // Keywords
      const keywords = [];
      const features = [
        'all ensuite', 'servant quarters', 'sq', 'modern finishes', 'gated community', 
        'electric fence', 'cctv', 'borehole', 'generator', 'solar', 'airbnb', 
        'furnished', 'electricity available', 'beacons', 'ready for construction', 
        'scenic views', 'title deed ready', 'fenced', 'main road', 'bypass', 
        'installment', 'payment plan', 'financing', '50x100', '1/8 acre', '1/4 acre'
      ];
      for (const f of features) {
        if (html.toLowerCase().includes(f)) keywords.push(f);
      }

      results.push({
        url,
        title,
        description,
        images: [...new Set(images)],
        keywords
      });
    } catch (e) {
      results.push({ url, error: e.message });
    }
  }
  res.json({ items: results });
});


app.post('/api/import', async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    for (const it of items) {
      const title = it.title || 'Untitled';
      const description = it.description || '';
      const price = Number(it.price || 0);
      const currency = it.currency || 'KES';
      const location = it.location || '';
      const type = it.type === 'Rent' ? 'Rent' : 'Sale';
      const status = it.status || 'available';
      const bedrooms = Number(it.bedrooms || 0);
      const bathrooms = Number(it.bathrooms || 0);
      const sqm = Number(it.sqm || 0);
      const lat = it.lat ?? null;
      const lng = it.lng ?? null;
      const property_type = it.property_type || null;
      const virtual_tour_url = it.virtual_tour_url || null;
      const images = Array.isArray(it.images) ? it.images : [];
      const amenities = Array.isArray(it.amenities) ? it.amenities : [];
      const keywords = Array.isArray(it.keywords) ? it.keywords.map(s => String(s).toLowerCase()) : [];
      const land_category = it.land_category || null;
      const tenure_type = it.tenure_type || null;
      const plot_size = it.plot_size || null;
      const doc_ready_title = keywords.some(k => k.includes('title')) ? 1 : 0;
      const doc_allotment_letter = keywords.some(k => k.includes('allotment')) ? 1 : 0;
      const doc_search_conducted = keywords.some(k => k.includes('search')) ? 1 : 0;
      const invest_fenced = keywords.some(k => k.includes('gated') || k.includes('fenced')) ? 1 : 0;
      const invest_beacons = keywords.some(k => k.includes('beacons')) ? 1 : 0;
      const invest_borehole = keywords.some(k => k.includes('borehole')) ? 1 : 0;
      const invest_electricity = keywords.some(k => k.includes('electricity')) ? 1 : 0;
      const proximity_near_main_road = keywords.some(k => k.includes('main road')) ? 1 : 0;
      const proximity_distance_cbd = it.proximity_distance_cbd ?? null;
      const proximity_future_infra = keywords.some(k => k.includes('bypass') || k.includes('future')) ? 1 : 0;
      const topography = it.topography || null;
      const payment_plan = it.payment_plan || null;
      const verified_listing = it.verified_listing ? 1 : 0;
      const [ins] = await conn.execute(
        'INSERT INTO properties (title, description, price, currency, location, type, status, bedrooms, bathrooms, sqm, lat, lng, property_type, virtual_tour_url, land_category, tenure_type, plot_size, doc_ready_title, doc_allotment_letter, doc_search_conducted, invest_fenced, invest_beacons, invest_borehole, invest_electricity, proximity_near_main_road, proximity_distance_cbd, proximity_future_infra, topography, payment_plan, verified_listing, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
        [title, description, price, currency, location, type, status, bedrooms, bathrooms, sqm, lat, lng, property_type, virtual_tour_url, land_category, tenure_type, plot_size, doc_ready_title, doc_allotment_letter, doc_search_conducted, invest_fenced, invest_beacons, invest_borehole, invest_electricity, proximity_near_main_road, proximity_distance_cbd, proximity_future_infra, topography, payment_plan, verified_listing]
      );
      const pid = ins.insertId;
      for (let i = 0; i < images.length; i++) {
        await conn.execute('INSERT INTO property_images (property_id, url, is_primary) VALUES (?,?,?)', [pid, images[i], i === 0 ? 1 : 0]);
      }
      for (const a of amenities) {
        await conn.execute('INSERT INTO property_amenities (property_id, name) VALUES (?,?)', [pid, a]);
      }
    }
    await conn.commit();
    res.status(201).json({ imported: items.length });
  } catch (e) {
    await conn.rollback();
    accessLogStream.write(`IMPORT_ERROR ${e.message}\n`);
    res.status(500).json({ error: 'import_failed' });
  } finally {
    conn.release();
  }
});

// Properties CRUD
app.get('/api/properties', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const type = req.query.type;
    const status = req.query.status;
    const minPrice = Number(req.query.minPrice) || 0;
    const maxPrice = Number(req.query.maxPrice) || 999999999;
    const bedrooms = req.query.bedrooms;
    
    // Kenyan Filters
    const land_category = req.query.land_category;
    const tenure_type = req.query.tenure_type;
    const plot_size = req.query.plot_size;
    const doc_ready_title = req.query.doc_ready_title;
    const verified_listing = req.query.verified_listing;
    const topography = req.query.topography;
    const payment_plan = req.query.payment_plan;
    const proximity_near_main_road = req.query.proximity_near_main_road;

    let where = 'WHERE price BETWEEN ? AND ?';
    let params = [minPrice, maxPrice];

    if (type) { where += ' AND type = ?'; params.push(type); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (bedrooms && bedrooms !== 'any') { where += ' AND bedrooms >= ?'; params.push(Number(bedrooms)); }
    
    if (land_category && land_category !== 'any') { where += ' AND land_category = ?'; params.push(land_category); }
    if (tenure_type && tenure_type !== 'any') { where += ' AND tenure_type = ?'; params.push(tenure_type); }
    if (plot_size && plot_size !== 'any') { where += ' AND plot_size = ?'; params.push(plot_size); }
    if (doc_ready_title === 'true') { where += ' AND doc_ready_title = 1'; }
    if (verified_listing === 'true') { where += ' AND verified_listing = 1'; }
    if (topography && topography !== 'any') { where += ' AND topography = ?'; params.push(topography); }
    if (payment_plan && payment_plan !== 'any') { where += ' AND payment_plan = ?'; params.push(payment_plan); }
    if (proximity_near_main_road === 'true') { where += ' AND proximity_near_main_road = 1'; }

    const [rows] = await dbPool.execute(
      `SELECT p.*, 
       (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
       (SELECT JSON_ARRAYAGG(url) FROM property_images WHERE property_id = p.id) as images,
       (SELECT JSON_ARRAYAGG(name) FROM property_amenities WHERE property_id = p.id) as amenities
       FROM properties p ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await dbPool.execute(`SELECT COUNT(*) as total FROM properties ${where}`, params);

    res.json({
      page,
      limit,
      total,
      data: rows.map(r => ({
        ...r,
        images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
        amenities: typeof r.amenities === 'string' ? JSON.parse(r.amenities) : (r.amenities || [])
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/properties', async (req, res) => {
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const p = req.body;
    const [ins] = await conn.execute(
      `INSERT INTO properties (
        title, description, price, currency, location, type, status, bedrooms, bathrooms, sqm, lat, lng, property_type, virtual_tour_url,
        land_category, tenure_type, plot_size, doc_ready_title, doc_allotment_letter, doc_search_conducted, invest_fenced, invest_beacons, 
        invest_borehole, invest_electricity, proximity_near_main_road, proximity_distance_cbd, proximity_future_infra, topography, 
        payment_plan, verified_listing, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [
        p.title, p.description, p.price, p.currency || 'KES', p.location, p.type, p.status || 'available', p.bedrooms || 0, p.bathrooms || 0, p.sqm || 0, p.lat, p.lng, p.property_type, p.virtual_tour_url,
        p.land_category || null, p.tenure_type || null, p.plot_size || null, p.doc_ready_title ? 1 : 0, p.doc_allotment_letter ? 1 : 0, p.doc_search_conducted ? 1 : 0, 
        p.invest_fenced ? 1 : 0, p.invest_beacons ? 1 : 0, p.invest_borehole ? 1 : 0, p.invest_electricity ? 1 : 0, p.proximity_near_main_road ? 1 : 0, 
        p.proximity_distance_cbd ?? null, p.proximity_future_infra ? 1 : 0, p.topography || null, p.payment_plan || null, p.verified_listing ? 1 : 0
      ]
    );
    const pid = ins.insertId;
    if (Array.isArray(p.images)) {
      for (let i = 0; i < p.images.length; i++) {
        await conn.execute('INSERT INTO property_images (property_id, url, is_primary) VALUES (?,?,?)', [pid, p.images[i], i === 0 ? 1 : 0]);
      }
    }
    if (Array.isArray(p.amenities)) {
      for (const a of p.amenities) {
        await conn.execute('INSERT INTO property_amenities (property_id, name) VALUES (?,?)', [pid, a]);
      }
    }
    await conn.commit();
    res.status(201).json({ id: pid, message: 'Created' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.put('/api/properties/:id', async (req, res) => {
  const id = req.params.id;
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const p = req.body;
    await conn.execute(
      `UPDATE properties SET 
        title=?, description=?, price=?, currency=?, location=?, type=?, status=?, bedrooms=?, bathrooms=?, sqm=?, lat=?, lng=?, property_type=?, virtual_tour_url=?,
        land_category=?, tenure_type=?, plot_size=?, doc_ready_title=?, doc_allotment_letter=?, doc_search_conducted=?, invest_fenced=?, invest_beacons=?, 
        invest_borehole=?, invest_electricity=?, proximity_near_main_road=?, proximity_distance_cbd=?, proximity_future_infra=?, topography=?, 
        payment_plan=?, verified_listing=?, updated_at=NOW() 
      WHERE id=?`,
      [
        p.title, p.description, p.price, p.currency, p.location, p.type, p.status, p.bedrooms, p.bathrooms, p.sqm, p.lat, p.lng, p.property_type, p.virtual_tour_url,
        p.land_category || null, p.tenure_type || null, p.plot_size || null, p.doc_ready_title ? 1 : 0, p.doc_allotment_letter ? 1 : 0, p.doc_search_conducted ? 1 : 0, 
        p.invest_fenced ? 1 : 0, p.invest_beacons ? 1 : 0, p.invest_borehole ? 1 : 0, p.invest_electricity ? 1 : 0, p.proximity_near_main_road ? 1 : 0, 
        p.proximity_distance_cbd ?? null, p.proximity_future_infra ? 1 : 0, p.topography || null, p.payment_plan || null, p.verified_listing ? 1 : 0,
        id
      ]
    );
    if (Array.isArray(p.images)) {
      await conn.execute('DELETE FROM property_images WHERE property_id = ?', [id]);
      for (let i = 0; i < p.images.length; i++) {
        await conn.execute('INSERT INTO property_images (property_id, url, is_primary) VALUES (?,?,?)', [id, p.images[i], i === 0 ? 1 : 0]);
      }
    }
    if (Array.isArray(p.amenities)) {
      await conn.execute('DELETE FROM property_amenities WHERE property_id = ?', [id]);
      for (const a of p.amenities) {
        await conn.execute('INSERT INTO property_amenities (property_id, name) VALUES (?,?)', [id, a]);
      }
    }
    await conn.commit();
    res.json({ message: 'Updated' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await dbPool.execute('DELETE FROM property_images WHERE property_id = ?', [id]);
    await dbPool.execute('DELETE FROM property_amenities WHERE property_id = ?', [id]);
    await dbPool.execute('DELETE FROM properties WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Inquiries CRUD
app.get('/api/inquiries', async (req, res) => {
  try {
    const [rows] = await dbPool.execute('SELECT * FROM inquiries ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const i = req.body;
    const [ins] = await dbPool.execute(
      'INSERT INTO inquiries (customer_name, email, phone, message, property_id, status, created_at) VALUES (?,?,?,?,?,?,NOW())',
      [i.name, i.email, i.phone, i.message, i.propertyId || null, 'new']
    );
    res.status(201).json({ id: ins.insertId, message: 'Inquiry sent' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/inquiries/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status, notes } = req.body;
    if (status !== undefined) await dbPool.execute('UPDATE inquiries SET status = ? WHERE id = ?', [status, id]);
    if (notes !== undefined) await dbPool.execute('UPDATE inquiries SET notes = ? WHERE id = ?', [notes, id]);
    res.json({ message: 'Updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Auth - DEPRECATED (Moved to Supabase)
// CRM Analytics - DEPRECATED (Moved to Supabase)
// Properties CRUD - DEPRECATED (Moved to Supabase)
// Inquiries CRUD - DEPRECATED (Moved to Supabase)



app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found' });
});

app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  accessLogStream.write(`ERROR ${err.message}\n`);
  res.status(500).json({ error: 'server_error' });
});

app.listen(PORT, () => {});
