// SponFin Public Website Client Engine
document.addEventListener('DOMContentLoaded', () => {
  initGlobalUI();
  loadGlobalSettings();
  
  // Page-specific loaders
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html' || path === '') {
    loadHomeContent();
  } else if (path.includes('/about')) {
    loadAboutContent();
  } else if (path.includes('/service-detail') || (path.startsWith('/service/') && path.split('/').length > 2)) {
    loadServiceDetailPageContent();
  } else if (path.includes('/services')) {
    loadServicesPageContent();
  } else if (path.includes('/portfolio')) {
    loadPortfolioPageContent();
  } else if (path.includes('/blog-detail') || (path.startsWith('/blog/') && path.split('/').length > 2)) {
    loadBlogDetailPageContent();
  } else if (path.includes('/blog')) {
    loadBlogPageContent();
  } else if (path.includes('/contact')) {
    initContactPageForm();
  } else if (path.includes('/subscription-request')) {
    initSubscriptionRequestPage();
  }
});

// 1. GLOBAL UI INTERACTIONS (Header scroll, Mobile menu)
function initGlobalUI() {
  const header = document.querySelector('header');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navList = document.querySelector('nav ul');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (toggleBtn && navList) {
    toggleBtn.addEventListener('click', () => {
      navList.classList.toggle('active');
      toggleBtn.innerHTML = navList.classList.contains('active') ? '&#10005;' : '&#9776;';
    });
  }

  // Active link highlighters
  const navLinks = document.querySelectorAll('nav ul a');
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath === href || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // Smooth scroll for nav/footer links pointing to hash sections on the same page
  document.querySelectorAll('nav ul a, footer a, .btn-plans-cta').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/#')) {
        const targetId = href.substring(2); // Remove "/#"
        const targetEl = document.getElementById(targetId);
        if (targetEl && (currentPath === '/' || currentPath === '/index.html' || currentPath === '')) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, null, href);

          // Close mobile menu if open
          if (navList && navList.classList.contains('active')) {
            navList.classList.remove('active');
            if (toggleBtn) toggleBtn.innerHTML = '&#9776;';
          }
        }
      }
    });
  });
}

// Image fallback helper
function handleImageFallback(img, text = 'Image Missing') {
  img.addEventListener('error', () => {
    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23131926"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="20" fill="%2364748b">${encodeURIComponent(text)}</text></svg>`;
  });
}

// 2. LOAD GLOBAL SETTINGS (Navbar, Footer, Contact info)
async function loadGlobalSettings() {
  try {
    const response = await API.getSettings();
    if (response.success && response.data) {
      const s = response.data;

      // Update Company Logo
      const logoContainers = document.querySelectorAll('.logo');
      logoContainers.forEach(container => {
        const img = container.querySelector('img');
        const span = container.querySelector('span');
        
        if (img && s.logo && s.logo.imageUrl) {
          img.src = s.logo.imageUrl;
          img.alt = `${s.companyName} Logo`;
          handleImageFallback(img, s.companyName);
        }
        if (span) {
          span.textContent = s.companyName;
        }
      });

      // Update dynamic footer email / phone / address / socials
      const footerDesc = document.getElementById('footer-desc');
      if (footerDesc) footerDesc.textContent = s.companyDescription;

      const footerEmail = document.getElementById('footer-email');
      if (footerEmail && s.email) footerEmail.textContent = s.email;

      const footerPhone = document.getElementById('footer-phone');
      if (footerPhone && s.phone) footerPhone.textContent = s.phone;

      const footerAddress = document.getElementById('footer-address');
      if (footerAddress && s.address) footerAddress.textContent = s.address;

      const footerSocials = document.getElementById('footer-socials');
      if (footerSocials && s.socialLinks) {
        let socialHTML = '';
        if (s.socialLinks.facebook) socialHTML += `<a href="${s.socialLinks.facebook}" target="_blank" class="social-circle" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>`;
        if (s.socialLinks.twitter) socialHTML += `<a href="${s.socialLinks.twitter}" target="_blank" class="social-circle" aria-label="Twitter"><i class="fab fa-twitter"></i></a>`;
        if (s.socialLinks.linkedin) socialHTML += `<a href="${s.socialLinks.linkedin}" target="_blank" class="social-circle" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>`;
        if (s.socialLinks.instagram) socialHTML += `<a href="${s.socialLinks.instagram}" target="_blank" class="social-circle" aria-label="Instagram"><i class="fab fa-instagram"></i></a>`;
        footerSocials.innerHTML = socialHTML;
      }

      // Return settings object for page-specific use
      return s;
    }
  } catch (error) {
    console.error('Error fetching global settings:', error);
  }
}

// 3. HOME PAGE RENDERING
async function loadHomeContent() {
  const settings = await API.getSettings();
  if (settings && settings.success && settings.data) {
    const s = settings.data;

    // Apply Hero Content
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroBtn = document.getElementById('hero-btn');
    const heroImg = document.getElementById('hero-img');

    if (heroTitle && s.heroContent.title) heroTitle.textContent = s.heroContent.title;
    if (heroSubtitle && s.heroContent.subtitle) heroSubtitle.textContent = s.heroContent.subtitle;
    if (heroBtn && s.heroContent.buttonText) {
      heroBtn.textContent = s.heroContent.buttonText;
      heroBtn.href = s.heroContent.buttonLink || '#contact';
    }
    if (heroImg && s.heroContent.imageUrl) {
      heroImg.src = s.heroContent.imageUrl;
      handleImageFallback(heroImg, 'SponFin Solutions');
    }

    // Apply About Content Preview
    const aboutTitle = document.getElementById('about-preview-title');
    const aboutText = document.getElementById('about-preview-text');
    const aboutImg = document.getElementById('about-preview-img');

    if (aboutTitle && s.aboutContent.title) aboutTitle.textContent = s.aboutContent.title;
    if (aboutText && s.aboutContent.text) {
      aboutText.textContent = s.aboutContent.text.length > 220 
        ? s.aboutContent.text.substring(0, 220) + '...' 
        : s.aboutContent.text;
    }
    if (aboutImg && s.aboutContent.imageUrl) {
      aboutImg.src = s.aboutContent.imageUrl;
      handleImageFallback(aboutImg, 'About SponFin');
    }
  }

  // Load Services (Up to 3 or 4)
  await loadServicesGrid('#services-grid', 3);

  // Load Portfolio Projects (Up to 3 featured)
  await loadPortfolioGrid('#portfolio-grid', 3, { featured: true });

  // Load Latest Blogs (Up to 3)
  await loadBlogGrid('#blog-grid', 3);

  // Load Subscription Plans
  await loadPricingPlansGrid();

  // Load Contact Form bindings
  initContactPageForm();

  // Scroll to hash target if present (ensures correct scroll position after dynamic content resolves)
  const hash = window.location.hash;
  if (hash) {
    setTimeout(() => {
      const targetEl = document.querySelector(hash);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }
}

// 4. ABOUT PAGE RENDERING
async function loadAboutContent() {
  const settings = await API.getSettings();
  if (settings && settings.success && settings.data) {
    const s = settings.data;
    const aboutTitle = document.getElementById('about-page-title');
    const aboutText = document.getElementById('about-page-text');
    const aboutImg = document.getElementById('about-page-img');

    if (aboutTitle && s.aboutContent.title) aboutTitle.textContent = s.aboutContent.title;
    if (aboutText && s.aboutContent.text) aboutText.textContent = s.aboutContent.text;
    if (aboutImg && s.aboutContent.imageUrl) {
      aboutImg.src = s.aboutContent.imageUrl;
      handleImageFallback(aboutImg, 'About SponFin');
    }
  }
}

// 5. SERVICES PAGE RENDERING
function loadServicesPageContent() {
  loadServicesGrid('#services-page-grid');
}

// Load Services helper
async function loadServicesGrid(selector, limit = null) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const response = await API.getServices();
    if (response.success && response.data && response.data.length > 0) {
      let services = response.data;
      if (limit) {
        services = services.slice(0, limit);
      }

      container.innerHTML = services.map(s => `
        <a href="/service/${s._id}" target="_blank" class="service-card-link">
          <div class="service-card">
            <div class="service-icon">
              <img src="${s.imageUrl}" alt="${s.title}" class="service-thumb">
            </div>
            <h3>${s.title}</h3>
            <p>${s.shortDescription}</p>
          </div>
        </a>
      `).join('');

      // Attach image fallback handler to all service thumbs
      container.querySelectorAll('.service-thumb').forEach(img => {
        handleImageFallback(img, 'Service');
      });
    } else {
      // Fallback: hide the parent section if homepage, or show placeholder message
      handleEmptySection(container, 'No services available at this time.');
    }
  } catch (error) {
    console.error('Error rendering services grid:', error);
    handleEmptySection(container, 'Error loading services.');
  }
}

// 6. PORTFOLIO PAGE RENDERING
async function loadPortfolioPageContent() {
  const gridSelector = '#portfolio-page-grid';
  const tabsSelector = '#portfolio-page-tabs';
  
  await loadPortfolioGrid(gridSelector);
  setupPortfolioFiltering(gridSelector, tabsSelector);
}

// Load Portfolio helper
async function loadPortfolioGrid(selector, limit = null, params = {}) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const response = await API.getProjects(params);
    if (response.success && response.data && response.data.length > 0) {
      let projects = response.data;
      if (limit) {
        projects = projects.slice(0, limit);
      }

      container.innerHTML = projects.map(p => {
        const featImg = p.images && p.images.length > 0 ? p.images[0].imageUrl : '';
        const techHTML = p.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');
        const externalLink = p.projectUrl 
          ? `<a href="${p.projectUrl}" target="_blank" class="portfolio-link">Launch Project &rarr;</a>` 
          : `<span class="portfolio-link text-muted">Internal Release Only</span>`;

        return `
          <div class="portfolio-card" data-category="${p.category}">
            <div class="portfolio-img">
              <img src="${featImg}" alt="${p.title}" class="proj-thumb">
              <span class="portfolio-badge">${p.category}</span>
            </div>
            <div class="portfolio-info">
              <h3>${p.title}</h3>
              <p>${p.description}</p>
              <div class="portfolio-tech">${techHTML}</div>
              ${externalLink}
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.proj-thumb').forEach(img => {
        handleImageFallback(img, 'Project Showcase');
      });
    } else {
      handleEmptySection(container, 'No portfolio projects found.');
    }
  } catch (error) {
    console.error('Error rendering portfolio grid:', error);
    handleEmptySection(container, 'Error loading projects.');
  }
}

// Category filter tabs wiring
function setupPortfolioFiltering(gridSelector, tabsSelector) {
  const tabsContainer = document.querySelector(tabsSelector);
  const cards = document.querySelectorAll(`${gridSelector} .portfolio-card`);

  if (!tabsContainer || cards.length === 0) return;

  const tabs = tabsContainer.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // Handle fallback message if all items are filtered out
      const visibleCards = document.querySelectorAll(`${gridSelector} .portfolio-card:not(.hidden)`);
      const existingFallback = document.querySelector(`${gridSelector} .fallback-message`);
      
      if (visibleCards.length === 0) {
        if (!existingFallback) {
          const fallback = document.createElement('div');
          fallback.className = 'fallback-message';
          fallback.innerHTML = `<h4>No Projects Found</h4><p>No projects match the selected category.</p>`;
          document.querySelector(gridSelector).appendChild(fallback);
        }
      } else if (existingFallback) {
        existingFallback.remove();
      }
    });
  });
}

// 7. BLOG FEED PAGE RENDERING
function loadBlogPageContent() {
  loadBlogGrid('#blog-page-grid');
}

// Load Blogs helper
async function loadBlogGrid(selector, limit = null) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const response = await API.getBlogs();
    if (response.success && response.data && response.data.length > 0) {
      let blogs = response.data;
      if (limit) {
        blogs = blogs.slice(0, limit);
      }

      container.innerHTML = blogs.map(b => {
        const pubDate = new Date(b.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const authorName = b.author ? b.author.name : 'SponFin Editor';
        const snippet = b.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
        const tagsHTML = b.tags.map(t => `<span class="blog-tag">${t}</span>`).join('');

        return `
          <div class="blog-card">
            <div class="blog-img">
              <img src="${b.featuredImage}" alt="${b.title}" class="blog-thumb">
            </div>
            <div class="blog-content">
              <div class="blog-meta">
                <span>${pubDate}</span>
                <span>By ${authorName}</span>
              </div>
              <h3>${b.title}</h3>
              <p>${snippet}</p>
              <div class="blog-tags">${tagsHTML}</div>
              <a href="/blog/${b.slug}" class="blog-readmore">Read Full Post &rarr;</a>
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.blog-thumb').forEach(img => {
        handleImageFallback(img, 'Blog post');
      });
    } else {
      handleEmptySection(container, 'No blogs articles published yet.');
    }
  } catch (error) {
    console.error('Error rendering blog grid:', error);
    handleEmptySection(container, 'Error loading blog entries.');
  }
}

// 8. BLOG DETAIL PAGE RENDERING
async function loadBlogDetailPageContent() {
  const container = document.querySelector('.blog-detail-container');
  if (!container) return;

  // Extract slug from URL (e.g. /blog/some-slug)
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

  if (!slug || slug === 'blog' || slug === 'blog-detail.html') {
    window.location.href = '/blog';
    return;
  }

  try {
    const response = await API.getBlog(slug);
    if (response.success && response.data) {
      const b = response.data;
      const pubDate = new Date(b.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const authorName = b.author ? b.author.name : 'SponFin Editor';
      const tagsHTML = b.tags.map(t => `<span class="blog-tag">${t}</span>`).join('');

      document.getElementById('blog-title').textContent = b.title;
      document.getElementById('blog-date').textContent = pubDate;
      document.getElementById('blog-author').textContent = `By ${authorName}`;
      
      const tagsBox = document.getElementById('blog-tags');
      if (tagsBox) tagsBox.innerHTML = tagsHTML;

      const featImg = document.getElementById('blog-featured-image');
      if (featImg) {
        featImg.src = b.featuredImage;
        handleImageFallback(featImg, b.title);
      }

      document.getElementById('blog-content-body').innerHTML = b.content;
    } else {
      container.innerHTML = `<h2>Blog Not Found</h2><p>The requested blog article does not exist or has been removed.</p><a href="/blog">&larr; Back to Blogs</a>`;
    }
  } catch (error) {
    console.error('Error loading blog details:', error);
    container.innerHTML = `<h2>Error</h2><p>Failed to load the article.</p><a href="/blog">&larr; Back to Blogs</a>`;
  }
}

// 8.5 SERVICE DETAIL PAGE RENDERING
async function loadServiceDetailPageContent() {
  const container = document.querySelector('.service-detail-container');
  if (!container) return;

  const pathParts = window.location.pathname.split('/');
  const id = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

  if (!id || id === 'service' || id === 'service-detail.html' || !id.match(/^[0-9a-fA-F]{24}$/)) {
    window.location.href = '/services';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const isAdminView = urlParams.get('view') === 'admin';
  if (isAdminView) {
    document.body.classList.add('admin-preview-mode');
    
    // Hide public elements
    const publicHeader = document.querySelector('header');
    if (publicHeader) publicHeader.style.display = 'none';
    
    const publicFooter = document.querySelector('footer');
    if (publicFooter) publicFooter.style.display = 'none';
    
    document.querySelectorAll('.blur-circle').forEach(el => el.style.display = 'none');
  }

  try {
    const response = await API.getService(id);
    if (response.success && response.data) {
      const s = response.data;
      
      // Update DOM
      document.getElementById('service-title').textContent = s.title;
      
      const featImg = document.getElementById('service-featured-image');
      if (featImg) {
        featImg.src = s.imageUrl;
        handleImageFallback(featImg, s.title);
      }

      // Convert newlines in plain text to HTML paragraphs and line breaks
      const formattedDescription = s.description
        .split(/\n\s*\n/)
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
        
      document.getElementById('service-content-body').innerHTML = formattedDescription;

      if (isAdminView) {
        // Customize back button for close tab
        const backLink = document.getElementById('service-back-link');
        if (backLink) {
          backLink.innerHTML = '<i class="fas fa-times"></i> Close Preview';
          backLink.href = '#';
          backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.close();
          });
        }
        
        // Hide recommendations completely
        const recSection = document.querySelector('.service-recommendations');
        if (recSection) recSection.style.display = 'none';
      } else {
        // Recommendations logic (show 1-2 random other active services)
        loadServiceRecommendations(s._id);
      }
    } else {
      container.innerHTML = `<h2>Service Not Found</h2><p>The requested service does not exist or has been removed.</p><a href="/services">&larr; Back to Services</a>`;
    }
  } catch (error) {
    console.error('Error loading service details:', error);
    container.innerHTML = `<h2>Error</h2><p>Failed to load the service details.</p><a href="/services">&larr; Back to Services</a>`;
  }
}

// Helper to load other active services randomly
async function loadServiceRecommendations(currentServiceId) {
  const recContainer = document.getElementById('random-services-grid');
  if (!recContainer) return;

  try {
    const response = await API.getServices();
    if (response.success && response.data && response.data.length > 0) {
      // Filter out current service
      let otherServices = response.data.filter(s => s._id !== currentServiceId && s.isActive);
      
      if (otherServices.length === 0) {
        const recommendationsSection = document.querySelector('.service-recommendations');
        if (recommendationsSection) recommendationsSection.style.display = 'none';
        return;
      }

      // Shuffle otherServices
      for (let i = otherServices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherServices[i], otherServices[j]] = [otherServices[j], otherServices[i]];
      }

      // Pick 1 or 2 random services
      const limit = Math.min(otherServices.length, Math.floor(Math.random() * 2) + 1); // 1 or 2
      const chosenServices = otherServices.slice(0, limit);

      recContainer.innerHTML = chosenServices.map(s => `
        <a href="/service/${s._id}" target="_blank" class="service-card-link">
          <div class="service-card">
            <div class="service-icon">
              <img src="${s.imageUrl}" alt="${s.title}" class="service-thumb">
            </div>
            <h3>${s.title}</h3>
            <p>${s.shortDescription}</p>
          </div>
        </a>
      `).join('');

      // Attach image fallback handler to recommended service thumbs
      recContainer.querySelectorAll('.service-thumb').forEach(img => {
        handleImageFallback(img, 'Service');
      });
    } else {
      const recommendationsSection = document.querySelector('.service-recommendations');
      if (recommendationsSection) recommendationsSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading service recommendations:', error);
    recContainer.innerHTML = '';
  }
}

// 9. LEADS / CONTACT FORM SUBMISSION
function initContactPageForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;

  populateServicesDropdown();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.btn-submit');
    const msgBox = document.getElementById('form-message');
    
    // Read input values
    const name = document.getElementById('lead-name').value;
    const email = document.getElementById('lead-email').value;
    const phone = document.getElementById('lead-phone') ? document.getElementById('lead-phone').value : '';
    const company = document.getElementById('lead-company') ? document.getElementById('lead-company').value : '';
    const service = document.getElementById('lead-service') ? document.getElementById('lead-service').value : 'General Inquiry';
    const message = document.getElementById('lead-message').value;

    if (!name || !email || !message) {
      showFormMessage(msgBox, 'Please fill out all required fields.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      const response = await API.submitLead({
        name,
        email,
        phone,
        company,
        service,
        message
      });

      if (response.success) {
        showFormMessage(msgBox, 'Thank you! Your inquiry has been submitted successfully. We will get back to you shortly.', 'success');
        form.reset();
      } else {
        showFormMessage(msgBox, response.message || 'Submission failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Inquiry Submission Error:', error);
      showFormMessage(msgBox, 'A connection error occurred. Please try again later.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}

function showFormMessage(box, text, type) {
  if (!box) return;
  box.textContent = text;
  box.className = `form-message ${type}`;
  box.style.display = 'block';
  setTimeout(() => {
    box.style.display = 'none';
  }, 6000);
}

// 10. SECTION FALLBACK ACTIONS (Self-hiding when empty)
function handleEmptySection(element, messageText) {
  const section = element.closest('.section');
  if (section && (section.id === 'services' || section.id === 'portfolio' || section.id === 'blog')) {
    // Hide entire homepage section dynamically if empty database
    console.log(`Hiding empty home section: #${section.id}`);
    section.classList.add('hidden');
  } else {
    // If we are on sub-pages, show placeholders inside element
    element.innerHTML = `
      <div class="fallback-message">
        <h4>Content Unavailable</h4>
        <p>${messageText}</p>
      </div>
    `;
  }
}

// Dynamically load active services from CMS to populate select input options
async function populateServicesDropdown() {
  const selectEl = document.getElementById('lead-service');
  if (!selectEl) return;

  try {
    const response = await API.getServices(false); // fetch only active services
    if (response.success && response.data) {
      const activeServices = response.data;
      let optionsHTML = '';

      if (activeServices.length > 0) {
        optionsHTML += activeServices.map(s => `
          <option value="${escapeHTML(s.title)}">${escapeHTML(s.title)}</option>
        `).join('');
      } else {
        // Fallback default options if DB is empty
        optionsHTML += `
          <option value="Sponsorship Brokerage">Sponsorship Brokerage</option>
          <option value="Audience Demographics Analytics">Audience Demographics Analytics</option>
          <option value="Digital Campaign Activation">Digital Campaign Activation</option>
        `;
      }

      // Keep General Inquiry at the bottom
      optionsHTML += `<option value="General Inquiry" selected>General Inquiry</option>`;
      selectEl.innerHTML = optionsHTML;
    }
  } catch (err) {
    console.error('Failed to populate services dropdown dynamically:', err);
    // Keep existing static fallback in HTML
  } finally {
    selectParameterValue(selectEl);
  }
}

// Pre-select service/plan dropdown based on URL query parameters
function selectParameterValue(selectEl) {
  if (!selectEl) return;
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');
  const serviceParam = urlParams.get('service');
  const targetValue = planParam || serviceParam;

  if (targetValue) {
    let optionExists = false;
    for (let i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].value.toLowerCase() === targetValue.toLowerCase()) {
        selectEl.selectedIndex = i;
        optionExists = true;
        break;
      }
    }

    if (!optionExists) {
      // If it doesn't exist, dynamically add it to the top of the dropdown and select it
      const newOpt = document.createElement('option');
      newOpt.value = targetValue;
      newOpt.textContent = targetValue;
      newOpt.selected = true;
      selectEl.insertBefore(newOpt, selectEl.firstChild);
      selectEl.value = targetValue;
    }
  }
}

// Load Subscription/Pricing plans grid dynamically (omitting price for public display)
async function loadPricingPlansGrid() {
  const container = document.getElementById('pricing-grid');
  if (!container) return;

  try {
    const response = await API.getSubscriptions(false); // fetch only active plans
    if (response.success && response.data && response.data.length > 0) {
      const plans = response.data;

      container.innerHTML = plans.map(p => {
        // Split features by newline
        const featuresList = p.features
          ? p.features.split('\n').filter(f => f.trim() !== '').map(f => `<li><i class="fas fa-check"></i> ${escapeHTML(f.trim())}</li>`).join('')
          : '';

        const descriptionHTML = p.description ? `<p class="pricing-card-desc">${escapeHTML(p.description)}</p>` : '';
        const objectiveHTML = p.objective ? `<p class="pricing-card-objective">${escapeHTML(p.objective)}</p>` : '';

        // CTA link
        const contactLink = `/subscription-request?plan=${encodeURIComponent(p.title)}`;

        return `
          <div class="pricing-card">
            <div class="pricing-card-header">
              <h3>${escapeHTML(p.title)}</h3>
              ${descriptionHTML}
            </div>
            <div class="pricing-card-body">
              <ul class="pricing-features">
                ${featuresList}
              </ul>
              ${objectiveHTML}
            </div>
            <div class="pricing-card-footer">
              <a href="${contactLink}" target="_blank" class="btn-pricing">TO KNOW MORE</a>
            </div>
          </div>
        `;
      }).join('');
    } else {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) pricingSection.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error rendering pricing plans grid:', error);
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) pricingSection.classList.add('hidden');
  }
}

// 9.5 SUBSCRIPTION REQUEST FORM PAGE
function initSubscriptionRequestPage() {
  const form = document.getElementById('subscribe-form');
  if (!form) return;

  populateSubscriptionPlansDropdown();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.btn-submit');
    const msgBox = document.getElementById('form-message');
    
    // Read input values
    const name = document.getElementById('sub-name').value;
    const email = document.getElementById('sub-email').value;
    const phone = document.getElementById('sub-phone') ? document.getElementById('sub-phone').value : '';
    const company = document.getElementById('sub-company') ? document.getElementById('sub-company').value : '';
    const plan = document.getElementById('sub-plan').value;
    const message = document.getElementById('sub-message').value;

    if (!name || !email || !plan || !message) {
      showFormMessage(msgBox, 'Please fill out all required fields.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Request...';

      const response = await API.submitSubscriptionRequest({
        name,
        email,
        phone,
        company,
        plan,
        message
      });

      if (response.success) {
        showFormMessage(msgBox, 'Thank you! Your subscription inquiry has been submitted. We will contact you soon.', 'success');
        form.reset();
      } else {
        showFormMessage(msgBox, response.message || 'Submission failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Subscription Submission Error:', error);
      showFormMessage(msgBox, 'A connection error occurred. Please try again later.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Subscription Inquiry';
    }
  });
}

// Dynamically fetch active subscription plans to populate select dropdown options
async function populateSubscriptionPlansDropdown() {
  const selectEl = document.getElementById('sub-plan');
  if (!selectEl) return;

  try {
    const response = await API.getSubscriptions(false); // fetch only active plans
    if (response.success && response.data) {
      const activePlans = response.data;
      let optionsHTML = '';

      if (activePlans.length > 0) {
        optionsHTML += activePlans.map(p => `
          <option value="${escapeHTML(p.title)}">${escapeHTML(p.title)}</option>
        `).join('');
      } else {
        // Fallback default options if DB is empty
        optionsHTML += `
          <option value="Growth Plan">Growth Plan</option>
          <option value="Business Growth Plan">Business Growth Plan</option>
          <option value="Premium Brand Plan">Premium Brand Plan</option>
          <option value="Enterprise Growth Plan">Enterprise Growth Plan</option>
          <option value="Maintenance & Support Policy">Maintenance & Support Policy</option>
        `;
      }

      selectEl.innerHTML = optionsHTML;
    }
  } catch (err) {
    console.error('Failed to populate subscription plans dropdown dynamically:', err);
  } finally {
    // Select the plan specified in URL query
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    if (planParam) {
      let optionExists = false;
      for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value.toLowerCase() === planParam.toLowerCase()) {
          selectEl.selectedIndex = i;
          optionExists = true;
          break;
        }
      }
      if (!optionExists) {
        const newOpt = document.createElement('option');
        newOpt.value = planParam;
        newOpt.textContent = planParam;
        newOpt.selected = true;
        selectEl.insertBefore(newOpt, selectEl.firstChild);
        selectEl.value = planParam;
      }
    }
  }
}

// HTML Character Sanitizer Helper
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
