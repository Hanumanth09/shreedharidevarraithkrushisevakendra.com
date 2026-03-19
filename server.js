const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Simple session store (in-memory)
const sessions = {};
function generateToken() { return Math.random().toString(36).slice(2) + Date.now(); }
function isAdmin(req) {
  const token = req.headers['x-admin-token'] || req.query.token || (req.body && req.body.token);
  return token && sessions[token];
}
function adminMiddleware(req, res, next) {
  const token = req.cookies && req.cookies.adminToken || req.query.token;
  if (token && sessions[token]) { req.adminToken = token; return next(); }
  res.redirect('/admin/login');
}

// Cookie parser (simple)
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie || '';
  cookieHeader.split(';').forEach(c => {
    const [k, v] = c.trim().split('=');
    if (k) req.cookies[k.trim()] = decodeURIComponent((v || '').trim());
  });
  next();
});

// ===================== PUBLIC ROUTES =====================

app.get('/', (req, res) => {
  const company = db.get('company').value();
  const services = db.get('services').value();
  const gallery = db.get('gallery').take(6).value();
  const featuredCrops = db.get('products').filter({ featured: true }).value();
  const token = req.cookies.adminToken;
  const isLoggedIn = !!(token && sessions[token]);
  res.render('index', { services, gallery, company, featuredCrops, page: 'home', isLoggedIn });
});

app.get('/about', (req, res) => {
  const company = db.get('company').value();
  res.render('about', { company, page: 'about' });
});

app.get('/services', (req, res) => {
  const company = db.get('company').value();
  const services = db.get('services').value();
  res.render('services', { services, company, page: 'services' });
});

app.get('/gallery', (req, res) => {
  const company = db.get('company').value();
  const gallery = db.get('gallery').value();
  res.render('gallery', { gallery, company, page: 'gallery' });
});

app.get('/products', (req, res) => {
  const company = db.get('company').value();
  const products = db.get('products').value();
  res.render('products', { products, company, page: 'products' });
});

app.get('/contact', (req, res) => {
  const company = db.get('company').value();
  res.render('contact', { company, page: 'contact', success: false, error: false });
});

app.post('/contact', (req, res) => {
  const company = db.get('company').value();
  const { name, phone, email, message } = req.body;
  try {
    if (!name || !phone || !message) throw new Error('Required fields missing');
    db.get('contacts').push({ id: Date.now(), name, phone, email: email || '', message, created_at: new Date().toISOString(), read: false }).write();
    res.render('contact', { company, page: 'contact', success: true, error: false });
  } catch (e) {
    res.render('contact', { company, page: 'contact', success: false, error: true });
  }
});

// ===================== ADMIN ROUTES =====================

// ---- INLINE ADMIN LOGIN/LOGOUT (used from homepage panel) ----
app.post('/admin/inline-login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.get('admin').value();
  if (username === admin.username && password === admin.password) {
    const token = generateToken();
    sessions[token] = { username, loginTime: Date.now() };
    res.setHeader('Set-Cookie', `adminToken=${token}; Path=/; HttpOnly`);
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid username or password' });
  }
});

app.post('/admin/inline-logout', (req, res) => {
  const token = req.cookies.adminToken;
  if (token) delete sessions[token];
  res.setHeader('Set-Cookie', 'adminToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.json({ success: true });
});

// ---- INLINE ADMIN API (JSON responses for homepage panel) ----
app.get('/admin/api/data', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ auth: false });
  res.json({
    auth: true,
    company: db.get('company').value(),
    services: db.get('services').value(),
    gallery: db.get('gallery').value(),
    contacts: db.get('contacts').orderBy('created_at', 'desc').value(),
    stats: {
      services: db.get('services').size().value(),
      gallery: db.get('gallery').size().value(),
      contacts: db.get('contacts').size().value(),
      unread: db.get('contacts').filter({ read: false }).size().value()
    }
  });
});

app.post('/admin/api/company', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  const { name, tagline, address, phone, email, status, status_message, about, kannada_name } = req.body;
  db.set('company', { name, tagline, address, phone, email, status, status_message, about, kannada_name }).write();
  res.json({ success: true });
});

app.post('/admin/api/gallery/add', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  const { title, image_url, category } = req.body;
  if (!title || !image_url) return res.json({ success: false, error: 'Title and URL required' });
  const item = { id: Date.now(), title, image_url, category: category || 'general' };
  db.get('gallery').push(item).write();
  res.json({ success: true, item });
});

app.post('/admin/api/gallery/delete', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  db.get('gallery').remove({ id: parseInt(req.body.id) }).write();
  res.json({ success: true });
});

app.post('/admin/api/services/add', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  const { name, description, icon } = req.body;
  if (!name || !description) return res.json({ success: false });
  const item = { id: Date.now(), name, description, icon: icon || '🌱', color: '#2d6a4f' };
  db.get('services').push(item).write();
  res.json({ success: true, item });
});

app.post('/admin/api/services/delete', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  db.get('services').remove({ id: parseInt(req.body.id) }).write();
  res.json({ success: true });
});

app.post('/admin/api/contacts/read', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  db.get('contacts').find({ id: parseInt(req.body.id) }).assign({ read: true }).write();
  res.json({ success: true });
});

app.post('/admin/api/contacts/delete', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  db.get('contacts').remove({ id: parseInt(req.body.id) }).write();
  res.json({ success: true });
});

app.post('/admin/api/password', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token || !sessions[token]) return res.json({ success: false });
  const { current_password, new_password } = req.body;
  const admin = db.get('admin').value();
  if (current_password !== admin.password) return res.json({ success: false, error: 'Wrong current password' });
  db.set('admin.password', new_password).write();
  res.json({ success: true });
});

// Login page (keep for direct access)
app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: false });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.get('admin').value();
  if (username === admin.username && password === admin.password) {
    const token = generateToken();
    sessions[token] = { username, loginTime: Date.now() };
    res.setHeader('Set-Cookie', `adminToken=${token}; Path=/; HttpOnly`);
    res.redirect('/admin/dashboard');
  } else {
    res.render('admin/login', { error: true });
  }
});

app.get('/admin/logout', (req, res) => {
  const token = req.cookies.adminToken;
  if (token) delete sessions[token];
  res.setHeader('Set-Cookie', 'adminToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.redirect('/');
});

// Dashboard
app.get('/admin/dashboard', adminMiddleware, (req, res) => {
  const stats = {
    services: db.get('services').size().value(),
    gallery: db.get('gallery').size().value(),
    contacts: db.get('contacts').size().value(),
    unread: db.get('contacts').filter({ read: false }).size().value(),
    products: db.get('products').size().value()
  };
  const recentContacts = db.get('contacts').orderBy('created_at', 'desc').take(5).value();
  res.render('admin/dashboard', { stats, recentContacts, token: req.adminToken });
});

// ---- COMPANY SETTINGS ----
app.get('/admin/company', adminMiddleware, (req, res) => {
  const company = db.get('company').value();
  res.render('admin/company', { company, token: req.adminToken, success: false });
});

app.post('/admin/company', adminMiddleware, (req, res) => {
  const { name, tagline, address, phone, email, status, status_message, about, kannada_name, open_time, close_time, open_days, sunday_closed } = req.body;
  db.set('company', { name, tagline, address, phone, email, status, status_message, about, kannada_name, open_time, close_time, open_days, sunday_closed: sunday_closed === 'true' }).write();
  const company = db.get('company').value();
  res.render('admin/company', { company, token: req.adminToken, success: true });
});

// ---- GALLERY MANAGEMENT ----
app.get('/admin/gallery', adminMiddleware, (req, res) => {
  const gallery = db.get('gallery').value();
  res.render('admin/gallery', { gallery, token: req.adminToken, success: false });
});

app.post('/admin/gallery/add', adminMiddleware, (req, res) => {
  const { title, image_url, category } = req.body;
  if (title && image_url) {
    db.get('gallery').push({ id: Date.now(), title, image_url, category: category || 'general' }).write();
  }
  res.redirect('/admin/gallery');
});

app.post('/admin/gallery/delete', adminMiddleware, (req, res) => {
  const id = parseInt(req.body.id);
  db.get('gallery').remove({ id }).write();
  res.redirect('/admin/gallery');
});

app.post('/admin/gallery/edit', adminMiddleware, (req, res) => {
  const { id, title, image_url, category } = req.body;
  db.get('gallery').find({ id: parseInt(id) }).assign({ title, image_url, category }).write();
  res.redirect('/admin/gallery');
});

// ---- SERVICES MANAGEMENT ----
app.get('/admin/services', adminMiddleware, (req, res) => {
  const services = db.get('services').value();
  res.render('admin/services', { services, token: req.adminToken, success: false });
});

app.post('/admin/services/add', adminMiddleware, (req, res) => {
  const { name, description, icon } = req.body;
  if (name && description) {
    db.get('services').push({ id: Date.now(), name, description, icon: icon || '🌱', color: '#2d6a4f' }).write();
  }
  res.redirect('/admin/services');
});

app.post('/admin/services/delete', adminMiddleware, (req, res) => {
  const id = parseInt(req.body.id);
  db.get('services').remove({ id }).write();
  res.redirect('/admin/services');
});

app.post('/admin/services/edit', adminMiddleware, (req, res) => {
  const { id, name, description, icon } = req.body;
  db.get('services').find({ id: parseInt(id) }).assign({ name, description, icon }).write();
  res.redirect('/admin/services');
});

// ---- PRODUCTS MANAGEMENT ----
app.get('/admin/products', adminMiddleware, (req, res) => {
  const products = db.get('products').value();
  res.render('admin/products', { products, token: req.adminToken });
});

app.post('/admin/products/add', adminMiddleware, (req, res) => {
  const { name, image_url, price, category, uses, featured } = req.body;
  if (name && price) {
    db.get('products').push({ id: Date.now(), name, image_url: image_url || '', price, category: category || 'general', uses: uses || '', featured: featured === 'true' }).write();
  }
  res.redirect('/admin/products');
});

app.post('/admin/products/delete', adminMiddleware, (req, res) => {
  db.get('products').remove({ id: parseInt(req.body.id) }).write();
  res.redirect('/admin/products');
});

app.post('/admin/products/edit', adminMiddleware, (req, res) => {
  const { id, name, image_url, price, category, uses, featured } = req.body;
  db.get('products').find({ id: parseInt(id) }).assign({ name, image_url, price, category, uses, featured: featured === 'true' }).write();
  res.redirect('/admin/products');
});
app.get('/admin/contacts', adminMiddleware, (req, res) => {
  const contacts = db.get('contacts').orderBy('created_at', 'desc').value();
  res.render('admin/contacts', { contacts, token: req.adminToken });
});

app.post('/admin/contacts/delete', adminMiddleware, (req, res) => {
  const id = parseInt(req.body.id);
  db.get('contacts').remove({ id }).write();
  res.redirect('/admin/contacts');
});

app.post('/admin/contacts/read', adminMiddleware, (req, res) => {
  const id = parseInt(req.body.id);
  db.get('contacts').find({ id }).assign({ read: true }).write();
  res.redirect('/admin/contacts');
});

// ---- CHANGE ADMIN PASSWORD ----
app.get('/admin/settings', adminMiddleware, (req, res) => {
  res.render('admin/settings', { token: req.adminToken, success: false, error: false });
});

app.post('/admin/settings', adminMiddleware, (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const admin = db.get('admin').value();
  if (current_password !== admin.password) {
    return res.render('admin/settings', { token: req.adminToken, success: false, error: 'Current password is wrong' });
  }
  if (new_password !== confirm_password) {
    return res.render('admin/settings', { token: req.adminToken, success: false, error: 'Passwords do not match' });
  }
  db.set('admin.password', new_password).write();
  res.render('admin/settings', { token: req.adminToken, success: true, error: false });
});

app.listen(PORT, () => {
  console.log(`\n🌱 Krushi Seva Kendra  →  http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel        →  http://localhost:${PORT}/admin/login`);
  console.log(`   Username: admin    |  Password: krushi@123\n`);
});
