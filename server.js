require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./server/config/db');
const errorHandler = require('./server/middleware/errorMiddleware');
const injectSEO = require('./server/utils/htmlInjector');
const Blog = require('./server/models/Blog');

// Connect to Database
connectDB();

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve assets statically
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/css', express.static(path.join(__dirname, 'client/css')));
app.use('/js', express.static(path.join(__dirname, 'client/js')));
app.use('/uploads', express.static(path.join(__dirname, 'client/uploads')));
app.use('/client', express.static(path.join(__dirname, 'client')));

// Top-level SEO utility routes (robots.txt, sitemap.xml)
app.use('/', require('./server/routes/seoRoutes'));

// API Routes
app.use('/api/auth', require('./server/routes/authRoutes'));
app.use('/api/services', require('./server/routes/serviceRoutes'));
app.use('/api/projects', require('./server/routes/projectRoutes'));
app.use('/api/blogs', require('./server/routes/blogRoutes'));
app.use('/api/leads', require('./server/routes/leadRoutes'));
app.use('/api/settings', require('./server/routes/settingRoutes'));
app.use('/api/users', require('./server/routes/userRoutes'));
app.use('/api/logs', require('./server/routes/logRoutes'));

// Frontend Page Routes (with server-side SEO HTML injection)
app.get('/', async (req, res, next) => {
  try {
    const html = await injectSEO(path.join(__dirname, 'client/index.html'), {}, req);
    res.send(html);
  } catch (err) { next(err); }
});

app.get('/about', async (req, res, next) => {
  try {
    const html = await injectSEO(path.join(__dirname, 'client/pages/about.html'), { title: 'About Us' }, req);
    res.send(html);
  } catch (err) { next(err); }
});

app.get('/services', async (req, res, next) => {
  try {
    const html = await injectSEO(path.join(__dirname, 'client/pages/services.html'), { title: 'Our Services' }, req);
    res.send(html);
  } catch (err) { next(err); }
});

app.get('/portfolio', async (req, res, next) => {
  try {
    const html = await injectSEO(path.join(__dirname, 'client/pages/portfolio.html'), { title: 'Portfolio Projects' }, req);
    res.send(html);
  } catch (err) { next(err); }
});

app.get('/blog', async (req, res, next) => {
  try {
    const html = await injectSEO(path.join(__dirname, 'client/pages/blog.html'), { title: 'Blog Insights' }, req);
    res.send(html);
  } catch (err) { next(err); }
});

app.get('/blog/:slug', async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.redirect('/blog');
    }
    const html = await injectSEO(path.join(__dirname, 'client/pages/blog-detail.html'), {
      title: blog.title,
      description: blog.metaDescription || blog.seoTitle,
      ogImage: blog.featuredImage,
      ogType: 'article'
    }, req);
    res.send(html);
  } catch (err) { next(err); }
});

app.get('/contact', async (req, res, next) => {
  try {
    const html = await injectSEO(path.join(__dirname, 'client/pages/contact.html'), { title: 'Contact Us' }, req);
    res.send(html);
  } catch (err) { next(err); }
});

app.get('/service/:id', async (req, res, next) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.redirect('/services');
    }
    const Service = require('./server/models/Service');
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.redirect('/services');
    }
    const html = await injectSEO(path.join(__dirname, 'client/pages/service-detail.html'), {
      title: service.title,
      description: service.shortDescription,
      ogImage: service.imageUrl,
      ogType: 'website'
    }, req);
    res.send(html);
  } catch (err) { next(err); }
});

// Admin Panel routes
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/pages/admin-login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/pages/admin.html'));
});

// Redirect simple variants
app.get('/admin/*', (req, res) => {
  res.redirect('/admin');
});


app.get('/googleea88924641ff227b.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'googleea88924641ff227b.html'));
});

// Global Error Handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
