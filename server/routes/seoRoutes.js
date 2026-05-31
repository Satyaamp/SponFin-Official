const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Service = require('../models/Service');
const Project = require('../models/Project');

// robots.txt route
router.get('/robots.txt', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${protocol}://${host}/sitemap.xml
`;
  res.type('text/plain');
  res.send(content);
});

// sitemap.xml route
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    // Base routes
    const paths = [
      '',
      '/about',
      '/services',
      '/portfolio',
      '/blog',
      '/contact'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static paths
    const today = new Date().toISOString().split('T')[0];
    paths.forEach(p => {
      xml += `
  <url>
    <loc>${baseUrl}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Add blogs
    const blogs = await Blog.find({ status: 'published' }).select('slug createdAt');
    blogs.forEach(blog => {
      const blogDate = blog.createdAt.toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${blogDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
