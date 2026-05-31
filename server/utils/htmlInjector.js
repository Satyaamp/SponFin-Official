const fs = require('fs');
const path = require('path');
const Setting = require('../models/Setting');

/**
 * Injects dynamic SEO tags and company settings into HTML templates
 * @param {string} filePath - Absolute path to the HTML template
 * @param {object} seoData - Custom SEO parameters for the page
 * @param {object} req - Express request object for building canonical URLs
 * @returns {Promise<string>} - Injected HTML string
 */
const injectSEO = async (filePath, seoData = {}, req) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file not found at ${filePath}`);
    }

    let html = fs.readFileSync(filePath, 'utf8');

    // Fetch dynamic global company settings from DB
    let settings = await Setting.findOne();
    if (!settings) {
      settings = {
        companyName: 'SponFin',
        companyDescription: 'Dynamic Business Solutions and Financial Consulting',
        logo: { imageUrl: '/client/assets/logo.png' }
      };
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    // Resolve details
    const siteName = settings.companyName;
    const pageTitle = seoData.title 
      ? `${seoData.title} | ${siteName}` 
      : `${siteName} - ${settings.companyDescription}`;
    
    const pageDesc = seoData.description || settings.companyDescription;
    const ogType = seoData.ogType || 'website';
    const canonical = seoData.canonical || fullUrl;
    
    // Resolve logo/OG image
    let ogImage = settings.logo.imageUrl;
    if (seoData.ogImage) {
      ogImage = seoData.ogImage;
    }
    // Make image URL absolute if it is relative
    if (ogImage && ogImage.startsWith('/')) {
      ogImage = `${protocol}://${host}${ogImage}`;
    }

    // Perform replacements
    html = html.replaceAll('{{SEO_TITLE}}', pageTitle);
    html = html.replaceAll('{{SEO_DESCRIPTION}}', pageDesc);
    html = html.replaceAll('{{OG_TITLE}}', seoData.title || siteName);
    html = html.replaceAll('{{OG_DESCRIPTION}}', pageDesc);
    html = html.replaceAll('{{OG_IMAGE}}', ogImage);
    html = html.replaceAll('{{OG_URL}}', fullUrl);
    html = html.replaceAll('{{OG_TYPE}}', ogType);
    html = html.replaceAll('{{CANONICAL_URL}}', canonical);
    html = html.replaceAll('{{COMPANY_NAME}}', siteName);

    return html;
  } catch (error) {
    console.error('HTML Injection Error:', error.message);
    // Return original file or error representation so page doesn't crash completely
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return `Server Error loading template: ${error.message}`;
  }
};

module.exports = injectSEO;
