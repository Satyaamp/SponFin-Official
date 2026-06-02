// SponFin Administrative Control Panel Javascript Engine
document.addEventListener('DOMContentLoaded', () => {
  // Identify if we are on the login page or main dashboard
  const isLoginPage = window.location.pathname.includes('/admin/login');

  if (isLoginPage) {
    initLoginFlow();
  } else {
    initDashboardFlow();
  }
});

// ==========================================
// 1. ADMIN LOGIN FLOW
// ==========================================
function initLoginFlow() {
  if (API.isAuthenticated()) {
    window.location.href = '/admin';
    return;
  }

  const form = document.getElementById('admin-login-form');
  const msgBox = document.getElementById('login-msg');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const submitBtn = form.querySelector('button');

      if (!email || !password) {
        showLoginError('Please enter both email and password.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        const response = await API.login(email, password);
        if (response.success) {
          window.location.href = '/admin';
        }
      } catch (error) {
        showLoginError(error.message || 'Invalid admin credentials.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }

  function showLoginError(msg) {
    if (msgBox) {
      msgBox.textContent = msg;
      msgBox.className = 'login-message error';
    }
  }
}

// ==========================================
// 2. DASHBOARD FLOW & GLOBAL NAVIGATION
// ==========================================
let currentUser = null;

// Pagination configuration and state variables
const PAGE_SIZE = 10;
let pageServices = 1;
let pageProjects = 1;
let pageBlogs = 1;
let pageLeads = 1;
let pageUsers = 1;
let pageLogs = 1;

async function initDashboardFlow() {
  if (!API.isAuthenticated()) {
    window.location.href = '/admin/login';
    return;
  }

  // Fetch fresh profile details from database on initialization
  try {
    const freshUser = await API.getMe();
    if (freshUser && freshUser.success && freshUser.user) {
      currentUser = freshUser.user;
      API.setUser(currentUser);
    } else {
      currentUser = API.getUser();
    }
  } catch (err) {
    console.error('Failed to load user profile on startup:', err);
    currentUser = API.getUser();
  }

  if (!currentUser) {
    window.location.href = '/admin/login';
    return;
  }

  const userNameEl = document.getElementById('nav-user-name');
  const userRoleEl = document.getElementById('nav-user-role');
  if (userNameEl) userNameEl.textContent = currentUser.name;
  if (userRoleEl) {
    userRoleEl.textContent = currentUser.role.replace('_', ' ');
    userRoleEl.className = `user-badge ${currentUser.role}`;
  }

  // Hide Leads sidebar item for editor level
  const leadsSidebarItem = document.querySelector('.sidebar-item[data-tab="leads"]');
  if (leadsSidebarItem) {
    if (currentUser.role === 'editor') {
      leadsSidebarItem.style.display = 'none';
    } else {
      leadsSidebarItem.style.display = 'inline-flex';
    }
  }

  // Hide logs sidebar item for non-super_admin levels
  const logsSidebarItem = document.getElementById('sidebar-item-logs');
  if (logsSidebarItem) {
    if (currentUser.role === 'super_admin') {
      logsSidebarItem.style.display = 'inline-flex';
    } else {
      logsSidebarItem.style.display = 'none';
    }
  }

  // Hide fwork sidebar item for non-super_admin levels
  const fworkSidebarItem = document.getElementById('sidebar-item-fwork');
  if (fworkSidebarItem) {
    if (currentUser.role === 'super_admin') {
      fworkSidebarItem.style.display = 'inline-flex';
    } else {
      fworkSidebarItem.style.display = 'none';
    }
  }

  // Setup logout listener
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to log out?')) {
        await API.logout();
        window.location.href = '/admin/login';
      }
    });
  }

  // Setup sidebar navigation switching
  const menuItems = document.querySelectorAll('.sidebar-item');
  const panels = document.querySelectorAll('.tab-panel');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      if (!targetTab) return;

      menuItems.forEach(m => m.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPanel = document.getElementById(`panel-${targetTab}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
        // Trigger load function for specific tab
        triggerPanelLoad(targetTab);
      }

      // Close mobile sidebar on navigation transition
      const sidebarEl = document.querySelector('.admin-sidebar');
      const overlayEl = document.getElementById('sidebar-overlay');
      if (sidebarEl) sidebarEl.classList.remove('active');
      if (overlayEl) overlayEl.classList.remove('active');
    });
  });

  // Mobile navigation drawer toggle wire-up
  const mobileToggle = document.getElementById('sidebar-mobile-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const adminSidebar = document.querySelector('.admin-sidebar');

  if (mobileToggle && adminSidebar && sidebarOverlay) {
    mobileToggle.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        adminSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
      } else {
        adminSidebar.classList.remove('collapsed');
      }
    });

    sidebarOverlay.addEventListener('click', () => {
      adminSidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });

    const sidebarClose = document.getElementById('sidebar-close-btn');
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          adminSidebar.classList.remove('active');
          sidebarOverlay.classList.remove('active');
        } else {
          adminSidebar.classList.add('collapsed');
        }
      });
    }
  }

  // Default: load dashboard stats
  triggerPanelLoad('dashboard');

  // Wire up global modal close handlers
  document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) modal.classList.remove('active');
    });
  });
}

async function triggerPanelLoad(tab) {
  if ((tab === 'logs' || tab === 'fwork') && currentUser && currentUser.role !== 'super_admin') {
    const dashboardMenuItem = document.querySelector('.sidebar-item[data-tab="dashboard"]');
    if (dashboardMenuItem) {
      dashboardMenuItem.click();
      return;
    }
  }

  // Sync the latest user profile state from server on tab load to catch dynamic role changes
  try {
    const freshUser = await API.getMe();
    if (freshUser && freshUser.success && freshUser.user) {
      const oldRole = currentUser ? currentUser.role : null;
      currentUser = freshUser.user;
      API.setUser(currentUser);

      // Update role label
      const userRoleEl = document.getElementById('nav-user-role');
      if (userRoleEl) {
        userRoleEl.textContent = currentUser.role.replace('_', ' ');
        userRoleEl.className = `user-badge ${currentUser.role}`;
      }

      // Dynamic sidebar item visibility
      const leadsSidebarItem = document.querySelector('.sidebar-item[data-tab="leads"]');
      if (leadsSidebarItem) {
        if (currentUser.role === 'editor') {
          leadsSidebarItem.style.display = 'none';
        } else {
          leadsSidebarItem.style.display = 'inline-flex';
        }
      }

      const logsSidebarItem = document.getElementById('sidebar-item-logs');
      if (logsSidebarItem) {
        if (currentUser.role === 'super_admin') {
          logsSidebarItem.style.display = 'inline-flex';
        } else {
          logsSidebarItem.style.display = 'none';
        }
      }

      const fworkSidebarItem = document.getElementById('sidebar-item-fwork');
      if (fworkSidebarItem) {
        if (currentUser.role === 'super_admin') {
          fworkSidebarItem.style.display = 'inline-flex';
        } else {
          fworkSidebarItem.style.display = 'none';
        }
      }

      // If the role changed, reload views
      if (oldRole && oldRole !== currentUser.role) {
        if (currentUser.role === 'editor' && tab === 'leads') {
          // Redirect them to dashboard since they no longer have access to leads
          const dashboardMenuItem = document.querySelector('.sidebar-item[data-tab="dashboard"]');
          if (dashboardMenuItem) {
            dashboardMenuItem.click();
            return;
          }
        }
        if (currentUser.role !== 'super_admin' && tab === 'logs') {
          // Redirect them to dashboard since they no longer have access to logs
          const dashboardMenuItem = document.querySelector('.sidebar-item[data-tab="dashboard"]');
          if (dashboardMenuItem) {
            dashboardMenuItem.click();
            return;
          }
        }
        if (currentUser.role !== 'super_admin' && tab === 'fwork') {
          // Redirect them to dashboard since they no longer have access to fwork
          const dashboardMenuItem = document.querySelector('.sidebar-item[data-tab="dashboard"]');
          if (dashboardMenuItem) {
            dashboardMenuItem.click();
            return;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to sync profile on tab load:', err);
  }

  switch (tab) {
    case 'dashboard':
      loadDashboardStats();
      break;
    case 'services':
      loadServicesManager();
      break;
    case 'projects':
      loadProjectsManager();
      break;
    case 'blogs':
      loadBlogsManager();
      break;
    case 'leads':
      loadLeadsManager();
      break;
    case 'settings':
      loadSettingsManager();
      break;
    case 'users':
      loadUsersManager();
      break;
    case 'permissions':
      loadPermissionsManager();
      break;
    case 'logs':
      loadLogsManager();
      break;
    case 'fwork':
      loadFworkManager();
      break;
  }
}

// Form image file input thumbnails wiring helper
function bindImagePreview(inputId, previewBoxId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(previewBoxId);
  if (!input || !box) return;

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        box.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
}

// ==========================================
// 3. MODULE: DASHBOARD
// ==========================================
async function loadDashboardStats() {
  try {
    const [services, projects, blogs, leads] = await Promise.all([
      API.getServices(true),
      API.getProjects(),
      API.getBlogs(true),
      API.getLeads()
    ]);

    // Update Counter values
    document.getElementById('stat-leads').textContent = leads.success ? leads.count : 0;
    document.getElementById('stat-blogs').textContent = blogs.success ? blogs.count : 0;
    document.getElementById('stat-projects').textContent = projects.success ? projects.count : 0;
    document.getElementById('stat-services').textContent = services.success ? services.count : 0;

    // Load recent leads into dashboard table
    const tableBody = document.getElementById('recent-leads-table');
    if (tableBody && leads.success) {
      const recent = leads.data.slice(0, 5); // top 5
      if (recent.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No leads received yet.</td></tr>`;
        return;
      }

      tableBody.innerHTML = recent.map(l => `
        <tr>
          <td><strong>${escapeHTML(l.name)}</strong></td>
          <td>${escapeHTML(l.email)}</td>
          <td>${escapeHTML(l.service)}</td>
          <td><span class="status-badge ${l.status}">${l.status}</span></td>
          <td>${formatDateOnly(l.createdAt)}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading dashboard KPI metrics:', error);
  }
}

// ==========================================
// 4. MODULE: SERVICES MANAGER
// ==========================================
let servicesData = [];

async function loadServicesManager() {
  const tableBody = document.getElementById('services-table');
  const addBtn = document.getElementById('btn-add-service');

  // Bind Create button
  if (addBtn) {
    addBtn.onclick = () => {
      openServiceModal();
    };
  }

  try {
    const response = await API.getServices(true);
    if (response.success) {
      servicesData = response.data;
      pageServices = 1; // Reset to page 1
      renderServicesTable();
    }
  } catch (e) {
    console.error('Error loading services manager:', e);
  }
}

function renderServicesTable() {
  const tableBody = document.getElementById('services-table');
  if (!tableBody) return;

  const totalCount = servicesData.length;
  if (totalCount === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No services configured. Click "Add Service" to create one.</td></tr>`;
    renderPagination('services', 0, 1);
    return;
  }

  const start = (pageServices - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedData = servicesData.slice(start, end);

  tableBody.innerHTML = paginatedData.map(s => {
    const showDelete = currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin');
    const deleteBtn = showDelete ? `<button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteService('${s._id}')">Delete</button>` : '';
    return `
      <tr>
        <td><img src="${s.imageUrl}" alt="${s.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
        <td><a href="/service/${s._id}?view=admin" target="_blank" style="color: var(--primary-color); text-decoration: underline; font-weight: 600;">${escapeHTML(s.title)}</a></td>
        <td>${escapeHTML(s.shortDescription)}</td>
        <td>${s.displayOrder}</td>
        <td><span class="status-badge active-${s.isActive}">${s.isActive ? 'Active' : 'Draft'}</span></td>
        <td>
          <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="openServiceModal('${s._id}')">Edit</button>
          ${deleteBtn}
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('services', totalCount, pageServices);
}

function openServiceModal(id = null) {
  const modal = document.getElementById('modal-service');
  const form = document.getElementById('form-service');
  const titleEl = document.getElementById('modal-service-title');
  const previewBox = document.getElementById('service-img-preview');

  if (!modal || !form) return;
  form.reset();
  previewBox.innerHTML = '';
  bindImagePreview('service-image', 'service-img-preview');

  if (id) {
    titleEl.textContent = 'Edit Service';
    const s = servicesData.find(item => item._id === id);
    if (s) {
      document.getElementById('service-id').value = s._id;
      document.getElementById('service-title').value = s.title;
      document.getElementById('service-short-desc').value = s.shortDescription;
      document.getElementById('service-desc').value = s.description;
      document.getElementById('service-order').value = s.displayOrder;
      document.getElementById('service-active').checked = s.isActive;
      previewBox.innerHTML = `<img src="${s.imageUrl}" alt="Preview">`;
    }
  } else {
    titleEl.textContent = 'Add Service';
    document.getElementById('service-id').value = '';
    document.getElementById('service-order').value = '0';
    document.getElementById('service-active').checked = true;
  }

  modal.classList.add('active');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const serviceId = document.getElementById('service-id').value;
    const formData = new FormData();

    formData.append('title', document.getElementById('service-title').value);
    formData.append('shortDescription', document.getElementById('service-short-desc').value);
    formData.append('description', document.getElementById('service-desc').value);
    formData.append('displayOrder', document.getElementById('service-order').value);
    formData.append('isActive', document.getElementById('service-active').checked);

    const fileInput = document.getElementById('service-image');
    if (fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      let response;
      if (serviceId) {
        response = await API.updateService(serviceId, formData);
      } else {
        if (!fileInput.files[0]) {
          alert('Please upload an image for the new service.');
          return;
        }
        response = await API.createService(formData);
      }

      if (response.success) {
        modal.classList.remove('active');
        loadServicesManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to save service.');
    }
  };
}

async function deleteService(id) {
  if (confirm('Are you sure you want to delete this service? This will delete the record and its image from storage.')) {
    try {
      const response = await API.deleteService(id);
      if (response.success) {
        loadServicesManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete service.');
    }
  }
}

// ==========================================
// 5. MODULE: PROJECTS MANAGER (Multi-images, Categories)
// ==========================================
let projectsData = [];

async function loadProjectsManager() {
  const addBtn = document.getElementById('btn-add-project');
  if (addBtn) {
    addBtn.onclick = () => openProjectModal();
  }

  try {
    const response = await API.getProjects();
    if (response.success) {
      projectsData = response.data;
      pageProjects = 1; // Reset to page 1
      renderProjectsTable();
    }
  } catch (e) {
    console.error('Error loading projects:', e);
  }
}

function renderProjectsTable() {
  const tableBody = document.getElementById('projects-table');
  if (!tableBody) return;

  const totalCount = projectsData.length;
  if (totalCount === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No portfolio projects found. Click "Add Project" to launch one.</td></tr>`;
    renderPagination('projects', 0, 1);
    return;
  }

  const start = (pageProjects - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedData = projectsData.slice(start, end);

  tableBody.innerHTML = paginatedData.map(p => {
    const featImg = p.images && p.images.length > 0 ? p.images[0].imageUrl : '';
    const showDelete = currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin');
    const deleteBtn = showDelete ? `<button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteProject('${p._id}')">Delete</button>` : '';
    return `
      <tr>
        <td><img src="${featImg}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;"></td>
        <td><strong>${escapeHTML(p.title)}</strong></td>
        <td><span class="status-badge admin">${p.category}</span></td>
        <td>${p.technologies.slice(0, 3).join(', ')}${p.technologies.length > 3 ? '...' : ''}</td>
        <td>${p.featured ? 'Yes' : 'No'}</td>
        <td>
          <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="openProjectModal('${p._id}')">Edit</button>
          ${deleteBtn}
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('projects', totalCount, pageProjects);
}

let deletedProjectImages = []; // tracking list of images to delete when updating

function openProjectModal(id = null) {
  const modal = document.getElementById('modal-project');
  const form = document.getElementById('form-project');
  const titleEl = document.getElementById('modal-project-title');
  const galleryBox = document.getElementById('project-gallery-box');

  if (!modal || !form) return;
  form.reset();
  galleryBox.innerHTML = '';
  deletedProjectImages = [];

  if (id) {
    titleEl.textContent = 'Edit Project';
    const p = projectsData.find(item => item._id === id);
    if (p) {
      document.getElementById('project-id').value = p._id;
      document.getElementById('project-title').value = p.title;
      document.getElementById('project-category').value = p.category;
      document.getElementById('project-desc').value = p.description;
      document.getElementById('project-techs').value = p.technologies.join(', ');
      document.getElementById('project-url').value = p.projectUrl || '';
      document.getElementById('project-featured').checked = p.featured;

      // Render existing project gallery thumbnails with delete icons
      if (p.images && p.images.length > 0) {
        galleryBox.innerHTML = p.images.map(img => `
          <div class="image-preview-box" style="position:relative;" data-publicid="${img.publicId}">
            <img src="${img.imageUrl}" alt="Gallery image">
            <button type="button" class="btn-delete-img" onclick="markImageForDeletion(this, '${img.publicId}')" style="position:absolute; top:2px; right:2px; background:rgba(220,38,38,0.85); color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
          </div>
        `).join('');
      }
    }
  } else {
    titleEl.textContent = 'Add Project';
    document.getElementById('project-id').value = '';
    document.getElementById('project-featured').checked = false;
  }

  modal.classList.add('active');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const projId = document.getElementById('project-id').value;
    const formData = new FormData();

    formData.append('title', document.getElementById('project-title').value);
    formData.append('category', document.getElementById('project-category').value);
    formData.append('description', document.getElementById('project-desc').value);
    formData.append('technologies', document.getElementById('project-techs').value);
    formData.append('projectUrl', document.getElementById('project-url').value);
    formData.append('featured', document.getElementById('project-featured').checked);

    // Append list of deleted public IDs
    if (deletedProjectImages.length > 0) {
      deletedProjectImages.forEach(pid => {
        formData.append('deletedPublicIds', pid);
      });
    }

    // Attach uploaded new files
    const fileInput = document.getElementById('project-images');
    if (fileInput.files.length > 0) {
      for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('images', fileInput.files[i]);
      }
    }

    try {
      let response;
      if (projId) {
        response = await API.updateProject(projId, formData);
      } else {
        response = await API.createProject(formData);
      }

      if (response.success) {
        modal.classList.remove('active');
        loadProjectsManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to save project.');
    }
  };
}

// Local image deletion marker helper
function markImageForDeletion(btn, publicId) {
  if (confirm('Are you sure you want to remove this image from the project gallery? It will be deleted permanently when you save the form.')) {
    deletedProjectImages.push(publicId);
    btn.closest('.image-preview-box').remove();
  }
}

async function deleteProject(id) {
  if (confirm('Are you sure you want to delete this project? All associated gallery images will be deleted.')) {
    try {
      const response = await API.deleteProject(id);
      if (response.success) {
        loadProjectsManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  }
}

// ==========================================
// 6. MODULE: BLOGS MANAGER (Rich Text Editor)
// ==========================================
let blogsData = [];

async function loadBlogsManager() {
  const addBtn = document.getElementById('btn-add-blog');
  if (addBtn) {
    addBtn.onclick = () => openBlogModal();
  }

  // Initialize Rich Text Toolbar buttons
  initRichTextEditor();

  try {
    const response = await API.getBlogs(true); // true to get drafts too
    if (response.success) {
      blogsData = response.data;
      pageBlogs = 1; // Reset to page 1
      renderBlogsTable();
    }
  } catch (e) {
    console.error('Error loading blogs:', e);
  }
}

function renderBlogsTable() {
  const tableBody = document.getElementById('blogs-table');
  if (!tableBody) return;

  const totalCount = blogsData.length;
  if (totalCount === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No blog articles written yet. Click "Add Blog" to write one.</td></tr>`;
    renderPagination('blogs', 0, 1);
    return;
  }

  const start = (pageBlogs - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedData = blogsData.slice(start, end);

  tableBody.innerHTML = paginatedData.map(b => {
    const authorName = b.author ? b.author.name : 'SponFin Editor';
    const showDelete = currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin');
    const deleteBtn = showDelete ? `<button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteBlog('${b._id}')">Delete</button>` : '';
    return `
      <tr>
        <td><img src="${b.featuredImage}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
        <td><strong>${escapeHTML(b.title)}</strong></td>
        <td>${escapeHTML(authorName)}</td>
        <td><span class="status-badge ${b.status}">${b.status}</span></td>
        <td>${formatDateOnly(b.createdAt)}</td>
        <td>
          <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="openBlogModal('${b._id}')">Edit</button>
          ${deleteBtn}
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('blogs', totalCount, pageBlogs);
}

// Rich Text Editor Custom commands binding
function initRichTextEditor() {
  const editor = document.getElementById('blog-editor-area');
  const toolbar = document.querySelector('.editor-toolbar');
  if (!editor || !toolbar) return;

  toolbar.querySelectorAll('.editor-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-cmd');
      const arg = btn.getAttribute('data-arg') || null;

      if (cmd === 'createLink') {
        const url = prompt('Enter the link URL (e.g. https://google.com):');
        if (url) document.execCommand(cmd, false, url);
      } else if (cmd === 'insertImage') {
        const url = prompt('Enter the image URL:');
        if (url) document.execCommand(cmd, false, url);
      } else if (cmd === 'formatBlock' && arg) {
        document.execCommand(cmd, false, arg);
      } else {
        document.execCommand(cmd, false, null);
      }
      editor.focus();
    };
  });
}

function openBlogModal(id = null) {
  const modal = document.getElementById('modal-blog');
  const form = document.getElementById('form-blog');
  const titleEl = document.getElementById('modal-blog-title');
  const previewBox = document.getElementById('blog-img-preview');
  const editorArea = document.getElementById('blog-editor-area');

  if (!modal || !form || !editorArea) return;
  form.reset();
  previewBox.innerHTML = '';
  editorArea.innerHTML = '';
  bindImagePreview('blog-image', 'blog-img-preview');

  if (id) {
    titleEl.textContent = 'Edit Blog Post';
    const b = blogsData.find(item => item._id === id);
    if (b) {
      document.getElementById('blog-id').value = b._id;
      document.getElementById('blog-title').value = b.title;
      document.getElementById('blog-seo-title').value = b.seoTitle || '';
      document.getElementById('blog-meta-desc').value = b.metaDescription || '';
      document.getElementById('blog-tags').value = b.tags.join(', ');
      document.getElementById('blog-status').value = b.status;
      editorArea.innerHTML = b.content;
      previewBox.innerHTML = `<img src="${b.featuredImage}" alt="Featured Image Preview">`;
    }
  } else {
    titleEl.textContent = 'Write Blog Post';
    document.getElementById('blog-id').value = '';
    document.getElementById('blog-status').value = 'draft';
  }

  modal.classList.add('active');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const blogId = document.getElementById('blog-id').value;
    const contentText = editorArea.innerHTML;

    if (!contentText || contentText.trim() === '<br>' || contentText.trim() === '') {
      alert('Please write some content in the blog editor.');
      return;
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('blog-title').value);
    formData.append('seoTitle', document.getElementById('blog-seo-title').value);
    formData.append('metaDescription', document.getElementById('blog-meta-desc').value);
    formData.append('tags', document.getElementById('blog-tags').value);
    formData.append('status', document.getElementById('blog-status').value);
    formData.append('content', contentText);

    const fileInput = document.getElementById('blog-image');
    if (fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      let response;
      if (blogId) {
        response = await API.updateBlog(blogId, formData);
      } else {
        if (!fileInput.files[0]) {
          alert('Please upload a featured image for your post.');
          return;
        }
        response = await API.createBlog(formData);
      }

      if (response.success) {
        modal.classList.remove('active');
        loadBlogsManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to save blog post.');
    }
  };
}

async function deleteBlog(id) {
  if (confirm('Are you sure you want to delete this blog post? It will delete the article and its image from database.')) {
    try {
      const response = await API.deleteBlog(id);
      if (response.success) {
        loadBlogsManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete blog.');
    }
  }
}

// ==========================================
// 7. MODULE: LEADS MANAGER (Status Updates)
// ==========================================
let leadsData = [];
let activeLeadId = null;
let currentLeadToClose = null;
let currentLeadSelectEl = null;

async function loadLeadsManager() {
  try {
    const response = await API.getLeads();
    if (response.success) {
      leadsData = response.data;
      pageLeads = 1; // Reset to page 1
      renderLeadsTable();
      if (activeLeadId) {
        updateLeadDetailsPane(activeLeadId);
      }
    }
  } catch (e) {
    console.error('Error loading leads:', e);
  }
}

function renderLeadsTable() {
  const tableBody = document.getElementById('leads-table');
  if (!tableBody) return;

  const totalCount = leadsData.length;
  if (totalCount === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No contact leads received yet.</td></tr>`;
    renderPagination('leads', 0, 1);
    return;
  }

  const start = (pageLeads - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedData = leadsData.slice(start, end);

  tableBody.innerHTML = paginatedData.map(l => {
    const isActive = l._id === activeLeadId;
    const showDelete = currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin');
    const deleteBtn = showDelete ? `<button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteLead('${l._id}')">Delete</button>` : '';
    return `
      <tr class="${isActive ? 'active-row' : ''}">
        <td><strong>${escapeHTML(l.name)}</strong></td>
        <td>
          <div>${escapeHTML(l.email)}</div>
          <div style="font-size:11px; color:var(--text-muted);">${escapeHTML(l.phone || 'No phone')}</div>
        </td>
        <td>${escapeHTML(l.company || 'N/A')}</td>
        <td><span class="status-badge admin">${escapeHTML(l.service)}</span></td>
        <td>
          <select data-prev="${l.status}" onchange="handleLeadStatusSelectChange('${l._id}', this)" style="padding: 4px; border: 1px solid var(--border-color); border-radius: 4px; font-size:12px; display: block; margin-bottom: 2px;" ${l.status === 'closed' ? 'disabled' : ''}>
            <option value="new" ${l.status === 'new' ? 'selected' : ''}>New</option>
            <option value="contacted" ${l.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="closed" ${l.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
          ${l.status === 'closed' && l.closedBy ? `
            <div style="font-size:10px; color:var(--success-color); font-weight:600; margin-top:2px;" title="Closed by ${escapeHTML(l.closedBy)}">Signed: ${escapeHTML(l.closedBy)}</div>
            ${l.closedAt ? `<div style="font-size:9px; color:var(--text-muted);">${formatDateTime(l.closedAt)}</div>` : ''}
          ` : ''}
        </td>
        <td>
          <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="viewLead('${l._id}')" style="margin-right: 4px;">
            <i class="fas fa-eye"></i> View
          </button>
          ${deleteBtn}
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('leads', totalCount, pageLeads);
}

function viewLead(id) {
  activeLeadId = id;
  renderLeadsTable();
  updateLeadDetailsPane(id);
}

function updateLeadDetailsPane(id) {
  const lead = leadsData.find(l => l._id === id);
  if (!lead) return;

  document.getElementById('detail-lead-name').textContent = lead.name;
  document.getElementById('detail-lead-email').textContent = lead.email;
  document.getElementById('detail-lead-phone').textContent = lead.phone || 'N/A';
  document.getElementById('detail-lead-company').textContent = lead.company || 'N/A';
  document.getElementById('detail-lead-service').textContent = lead.service;
  document.getElementById('detail-lead-message').textContent = lead.message;
  document.getElementById('detail-lead-date').textContent = formatDateTime(lead.createdAt);

  const statusEl = document.getElementById('detail-lead-status');
  if (statusEl) {
    statusEl.textContent = lead.status;
    statusEl.className = `status-badge ${lead.status}`;
  }

  const closedByContainer = document.getElementById('detail-lead-closed-by-container');
  const closedByEl = document.getElementById('detail-lead-closed-by');
  if (closedByContainer && closedByEl) {
    if (lead.status === 'closed' && lead.closedBy) {
      const closedDateStr = lead.closedAt ? ` on ${formatDateTime(lead.closedAt)}` : '';
      closedByEl.textContent = `${lead.closedBy}${closedDateStr}`;
      closedByContainer.style.display = 'block';
    } else {
      closedByContainer.style.display = 'none';
    }
  }

  const pane = document.getElementById('lead-details-pane');
  if (pane) pane.style.display = 'block';
}

function closeLeadDetails() {
  activeLeadId = null;
  const pane = document.getElementById('lead-details-pane');
  if (pane) pane.style.display = 'none';
  renderLeadsTable();
}

function handleLeadStatusSelectChange(id, selectElement) {
  const newStatus = selectElement.value;

  if (newStatus === 'closed') {
    currentLeadToClose = id;
    currentLeadSelectEl = selectElement;
    openSignatureModal();
  } else {
    updateLeadStatus(id, newStatus);
  }
}

function openSignatureModal() {
  const modal = document.getElementById('modal-signature');
  const form = document.getElementById('form-signature');
  if (modal && form) {
    form.reset();
    modal.classList.add('active');

    const cancelBtn = document.getElementById('btn-cancel-sig-modal');
    const closeBtn = document.getElementById('btn-close-sig-modal');

    const onCancel = () => {
      closeSignatureModal();
      if (currentLeadSelectEl) {
        currentLeadSelectEl.value = currentLeadSelectEl.getAttribute('data-prev');
      }
    };

    cancelBtn.onclick = onCancel;
    closeBtn.onclick = onCancel;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const signatureName = document.getElementById('signature-name').value;
      if (!signatureName || signatureName.trim() === '') {
        alert('Signature name is required.');
        return;
      }

      try {
        const response = await API.updateLead(currentLeadToClose, 'closed', signatureName);
        if (response.success) {
          closeSignatureModal();
          loadLeadsManager();
        }
      } catch (err) {
        alert(err.message || 'Failed to close lead.');
        if (currentLeadSelectEl) {
          currentLeadSelectEl.value = currentLeadSelectEl.getAttribute('data-prev');
        }
      }
    };
  }
}

function closeSignatureModal() {
  const modal = document.getElementById('modal-signature');
  if (modal) modal.classList.remove('active');
  currentLeadToClose = null;
  currentLeadSelectEl = null;
}

async function updateLeadStatus(id, newStatus, closedBy = '') {
  try {
    const response = await API.updateLead(id, newStatus, closedBy);
    if (response.success) {
      loadLeadsManager();
    }
  } catch (err) {
    alert(err.message || 'Failed to update lead status.');
  }
}

async function deleteLead(id) {
  if (confirm('Are you sure you want to delete this lead from the logs?')) {
    try {
      const response = await API.deleteLead(id);
      if (response.success) {
        if (activeLeadId === id) {
          closeLeadDetails();
        } else {
          loadLeadsManager();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to delete lead.');
    }
  }
}

// ==========================================
// 8. MODULE: SETTINGS MANAGER
// ==========================================
async function loadSettingsManager() {
  const form = document.getElementById('form-settings');
  if (!form) return;

  // Bind previews
  bindImagePreview('settings-logo', 'logo-preview');
  bindImagePreview('settings-hero-image', 'hero-preview');
  bindImagePreview('settings-about-image', 'about-preview');

  try {
    const response = await API.getSettings();
    if (response.success && response.data) {
      const s = response.data;

      document.getElementById('settings-company-name').value = s.companyName;
      document.getElementById('settings-company-desc').value = s.companyDescription;
      document.getElementById('settings-email').value = s.email || '';
      document.getElementById('settings-phone').value = s.phone || '';
      document.getElementById('settings-address').value = s.address || '';

      // Socials
      document.getElementById('settings-fb').value = s.socialLinks ? s.socialLinks.facebook : '';
      document.getElementById('settings-tw').value = s.socialLinks ? s.socialLinks.twitter : '';
      document.getElementById('settings-li').value = s.socialLinks ? s.socialLinks.linkedin : '';
      document.getElementById('settings-ig').value = s.socialLinks ? s.socialLinks.instagram : '';

      // Hero Content
      document.getElementById('settings-hero-title').value = s.heroContent ? s.heroContent.title : '';
      document.getElementById('settings-hero-subtitle').value = s.heroContent ? s.heroContent.subtitle : '';
      document.getElementById('settings-hero-btn-text').value = s.heroContent ? s.heroContent.buttonText : '';
      document.getElementById('settings-hero-btn-link').value = s.heroContent ? s.heroContent.buttonLink : '';

      // About Content
      document.getElementById('settings-about-title').value = s.aboutContent ? s.aboutContent.title : '';
      document.getElementById('settings-about-text').value = s.aboutContent ? s.aboutContent.text : '';

      // Thumb previews
      if (s.logo && s.logo.imageUrl) {
        document.getElementById('logo-preview').innerHTML = `<img src="${s.logo.imageUrl}" alt="Logo">`;
      }
      if (s.heroContent && s.heroContent.imageUrl) {
        document.getElementById('hero-preview').innerHTML = `<img src="${s.heroContent.imageUrl}" alt="Hero Image">`;
      }
      if (s.aboutContent && s.aboutContent.imageUrl) {
        document.getElementById('about-preview').innerHTML = `<img src="${s.aboutContent.imageUrl}" alt="About Image">`;
      }
    }
  } catch (error) {
    console.error('Error fetching settings form data:', error);
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append('companyName', document.getElementById('settings-company-name').value);
    formData.append('companyDescription', document.getElementById('settings-company-desc').value);
    formData.append('email', document.getElementById('settings-email').value);
    formData.append('phone', document.getElementById('settings-phone').value);
    formData.append('address', document.getElementById('settings-address').value);

    // Social Links compilation
    const socialLinks = {
      facebook: document.getElementById('settings-fb').value,
      twitter: document.getElementById('settings-tw').value,
      linkedin: document.getElementById('settings-li').value,
      instagram: document.getElementById('settings-ig').value
    };
    formData.append('socialLinks', JSON.stringify(socialLinks));

    // Hero Content compilation
    const heroContent = {
      title: document.getElementById('settings-hero-title').value,
      subtitle: document.getElementById('settings-hero-subtitle').value,
      buttonText: document.getElementById('settings-hero-btn-text').value,
      buttonLink: document.getElementById('settings-hero-btn-link').value
    };
    formData.append('heroContent', JSON.stringify(heroContent));

    // About Content compilation
    const aboutContent = {
      title: document.getElementById('settings-about-title').value,
      text: document.getElementById('settings-about-text').value
    };
    formData.append('aboutContent', JSON.stringify(aboutContent));

    // Logo image upload
    const logoFile = document.getElementById('settings-logo').files[0];
    if (logoFile) formData.append('logo', logoFile);

    // Hero visual upload
    const heroFile = document.getElementById('settings-hero-image').files[0];
    if (heroFile) formData.append('heroImage', heroFile);

    // About visual upload
    const aboutFile = document.getElementById('settings-about-image').files[0];
    if (aboutFile) formData.append('aboutImage', aboutFile);

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Settings...';

      const response = await API.updateSettings(formData);
      if (response.success) {
        alert('Global settings updated successfully.');
        loadSettingsManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Settings';
    }
  };
}

// ==========================================
// 9. MODULE: USER MANAGEMENT
// ==========================================
let usersData = [];

async function loadUsersManager() {
  const addBtn = document.getElementById('btn-add-user');
  if (addBtn) {
    // Only display User addition for super_admin
    if (currentUser.role !== 'super_admin') {
      addBtn.style.display = 'none';
    } else {
      addBtn.style.display = 'inline-flex';
      addBtn.onclick = () => openUserModal();
    }
  }

  try {
    const response = await API.getUsers();
    if (response.success) {
      usersData = response.data;
      pageUsers = 1; // Reset to page 1
      renderUsersTable();
    }
  } catch (e) {
    const tableBody = document.getElementById('users-table');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger-color);">Error: Failed to load administrative users list.</td></tr>`;
    }
  }
}

function renderUsersTable() {
  const tableBody = document.getElementById('users-table');
  if (!tableBody) return;

  const tableHeader = tableBody.closest('table').querySelector('thead');
  const isEditor = currentUser && currentUser.role === 'editor';

  if (tableHeader) {
    if (isEditor) {
      tableHeader.innerHTML = `
        <tr>
          <th>Username</th>
          <th>Email Address</th>
          <th>Role Profile</th>
          <th>Actions</th>
        </tr>
      `;
    } else {
      tableHeader.innerHTML = `
        <tr>
          <th>Username</th>
          <th>Email Address</th>
          <th>Role Profile</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      `;
    }
  }

  const totalCount = usersData.length;
  if (totalCount === 0) {
    tableBody.innerHTML = `<tr><td colspan="${isEditor ? 4 : 5}" style="text-align:center;">No users registered.</td></tr>`;
    renderPagination('users', 0, 1);
    return;
  }

  const start = (pageUsers - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedData = usersData.slice(start, end);

  tableBody.innerHTML = paginatedData.map(u => {
    const isSelf = u._id === (currentUser.id || currentUser._id);
    const canEdit = currentUser.role === 'super_admin' || isSelf;
    const canDelete = currentUser.role === 'super_admin' && !isSelf;

    const editBtn = canEdit
      ? `<button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="openUserModal('${u._id}')">Edit</button>`
      : '';
    const deleteBtn = canDelete
      ? `<button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteUser('${u._id}')">Delete</button>`
      : '';

    if (isEditor) {
      return `
        <tr>
          <td><strong>${escapeHTML(u.name)}</strong> ${isSelf ? '<span style="color:var(--text-muted);font-size:11px;">(You)</span>' : ''}</td>
          <td>${escapeHTML(u.email)}</td>
          <td><span class="status-badge ${u.role}">${u.role.replace('_', ' ')}</span></td>
          <td>
            ${editBtn}
          </td>
        </tr>
      `;
    }

    return `
      <tr>
        <td><strong>${escapeHTML(u.name)}</strong> ${isSelf ? '<span style="color:var(--text-muted);font-size:11px;">(You)</span>' : ''}</td>
        <td>${escapeHTML(u.email)}</td>
        <td><span class="status-badge ${u.role}">${u.role.replace('_', ' ')}</span></td>
        <td><span class="status-badge active-${u.isActive}">${u.isActive ? 'Active' : 'Deactive'}</span></td>
        <td>
          ${editBtn}
          ${deleteBtn}
        </td>
      </tr>
    `;
  }).join('');

  renderPagination('users', totalCount, pageUsers);
}

function openUserModal(id = null) {
  const modal = document.getElementById('modal-user');
  const form = document.getElementById('form-user');
  const titleEl = document.getElementById('modal-user-title');
  const pwLabel = document.getElementById('user-pw-label');

  if (!modal || !form) return;
  form.reset();

  const nameInput = document.getElementById('user-name');
  const emailInput = document.getElementById('user-email');
  const roleSelect = document.getElementById('user-role');
  const activeCheckbox = document.getElementById('user-active');

  // Reset inputs to enabled by default
  nameInput.disabled = false;
  emailInput.disabled = false;
  roleSelect.disabled = false;
  activeCheckbox.disabled = false;

  const isSelf = id && id === (currentUser.id || currentUser._id);

  if (isSelf) {
    // Editing self: restrict other fields so user can only change password
    nameInput.disabled = true;
    emailInput.disabled = true;
    roleSelect.disabled = true;
    activeCheckbox.disabled = true;
  } else {
    // If not editing self, lock components if current user is not super_admin
    if (currentUser.role !== 'super_admin') {
      nameInput.disabled = true;
      emailInput.disabled = true;
      roleSelect.disabled = true;
      activeCheckbox.disabled = true;
    }
  }

  if (id) {
    titleEl.textContent = 'Edit User';
    pwLabel.textContent = 'New Password (leave blank to keep current):';
    const u = usersData.find(item => item._id === id);
    if (u) {
      document.getElementById('user-id').value = u._id;
      nameInput.value = u.name;
      emailInput.value = u.email;
      roleSelect.value = u.role;
      activeCheckbox.checked = u.isActive;
    }
  } else {
    titleEl.textContent = 'Register User';
    pwLabel.textContent = 'Password:';
    document.getElementById('user-id').value = '';
    roleSelect.value = 'editor';
    activeCheckbox.checked = true;
  }

  modal.classList.add('active');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const userId = document.getElementById('user-id').value;
    const password = document.getElementById('user-password').value;

    if (!userId && !password) {
      alert('Password is required for new registration.');
      return;
    }

    const userData = {
      name: document.getElementById('user-name').value,
      email: document.getElementById('user-email').value,
      role: roleSelect.value,
      isActive: activeCheckbox.checked
    };

    if (password) {
      userData.password = password;
    }

    try {
      let response;
      if (userId) {
        response = await API.updateUser(userId, userData);
      } else {
        response = await API.createUser(userData);
      }

      if (response.success) {
        // If user updated their own record and changed password, start logout countdown
        if (userId === (currentUser.id || currentUser._id) && password) {
          const modalContentEl = modal.querySelector('.modal-content');
          if (modalContentEl) {
            let secondsLeft = 10;
            const updateTimerMessage = () => {
              modalContentEl.innerHTML = `
                <div class="modal-body" style="text-align: center; padding: 40px 24px;">
                  <div style="font-size: 48px; color: var(--warning-color); margin-bottom: 20px;">
                    <i class="fas fa-key"></i>
                  </div>
                  <h3 style="margin-bottom: 12px; font-weight: 600;">Password Changed Successfully</h3>
                  <p style="color: var(--text-muted); font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                    Your password has been updated. You will be logged out automatically. <br>
                    <strong>Please login with your new password in <span id="logout-countdown" style="color: var(--danger-color); font-size: 16px; font-weight: 700;">${secondsLeft}</span> seconds.</strong>
                  </p>
                </div>
              `;
            };

            updateTimerMessage();

            const timer = setInterval(async () => {
              secondsLeft--;
              const countdownEl = document.getElementById('logout-countdown');
              if (countdownEl) {
                countdownEl.textContent = secondsLeft;
              }
              if (secondsLeft <= 0) {
                clearInterval(timer);
                await API.logout();
                window.location.href = '/admin/login';
              }
            }, 1000);
          }
          return;
        }

        modal.classList.remove('active');
        // If user updated their own record, let's sync local settings
        if (userId === (currentUser.id || currentUser._id)) {
          currentUser.name = userData.name;
          currentUser.email = userData.email;
          API.setUser(currentUser);
          document.getElementById('nav-user-name').textContent = currentUser.name;
        }
        loadUsersManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to save user.');
    }
  };
}

async function deleteUser(id) {
  if (confirm('Are you sure you want to delete this administrative user?')) {
    try {
      const response = await API.deleteUser(id);
      if (response.success) {
        loadUsersManager();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  }
}

// ==========================================
// CLIENT-SIDE PAGINATION ENGINE
// ==========================================
function renderPagination(tabName, totalCount, currentPage) {
  const container = document.getElementById(`pagination-${tabName}`);
  if (!container) return;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Calculate showing ranges
  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(currentPage * PAGE_SIZE, totalCount);

  const showingText = `Showing ${startRecord}-${endRecord} of ${totalCount} records`;

  container.innerHTML = `
    <span style="font-size: 13px; color: var(--text-muted); font-weight: 500;">${showingText}</span>
    <div class="pagination-buttons">
      <button class="btn-admin btn-admin-secondary btn-admin-sm" id="btn-prev-${tabName}" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> Previous
      </button>
      <button class="btn-admin btn-admin-secondary btn-admin-sm" id="btn-next-${tabName}" ${currentPage >= totalPages ? 'disabled' : ''}>
        Next <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;

  // Bind click handlers
  const prevBtn = document.getElementById(`btn-prev-${tabName}`);
  const nextBtn = document.getElementById(`btn-next-${tabName}`);

  if (prevBtn && currentPage > 1) {
    prevBtn.addEventListener('click', () => {
      changePage(tabName, currentPage - 1);
    });
  }

  if (nextBtn && currentPage < totalPages) {
    nextBtn.addEventListener('click', () => {
      changePage(tabName, currentPage + 1);
    });
  }
}

function changePage(tabName, newPage) {
  if (tabName === 'services') {
    pageServices = newPage;
    renderServicesTable();
  } else if (tabName === 'projects') {
    pageProjects = newPage;
    renderProjectsTable();
  } else if (tabName === 'blogs') {
    pageBlogs = newPage;
    renderBlogsTable();
  } else if (tabName === 'leads') {
    pageLeads = newPage;
    renderLeadsTable();
  } else if (tabName === 'users') {
    pageUsers = newPage;
    renderUsersTable();
  } else if (tabName === 'logs') {
    pageLogs = newPage;
    renderLogsTable();
  }
}

// ==========================================
// ROLE ACCESS PERMISSIONS MANAGER
// ==========================================
function loadPermissionsManager() {
  const userNameEl = document.getElementById('perm-user-name');
  const userRoleEl = document.getElementById('perm-user-role');
  const userAvatarEl = document.getElementById('perm-user-avatar');
  const matrixTable = document.getElementById('permissions-matrix-table');

  if (!currentUser) return;

  if (userNameEl) userNameEl.textContent = currentUser.name;
  if (userRoleEl) {
    userRoleEl.textContent = currentUser.role.replace('_', ' ');
    userRoleEl.className = `status-badge ${currentUser.role}`;
  }
  if (userAvatarEl && currentUser.name) {
    userAvatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
  }

  if (matrixTable) {
    const role = currentUser.role;

    // Matrix data structure
    const check = '<span style="color: var(--success-color); font-weight: bold; font-size: 14px;"><i class="fas fa-check-circle"></i> Yes</span>';
    const cross = '<span style="color: var(--danger-color); font-weight: bold; font-size: 14px;"><i class="fas fa-times-circle"></i> No</span>';
    const na = '<span style="color: var(--text-muted); font-style: italic; font-size: 13px;">N/A</span>';
    const selfOnly = '<span style="color: var(--warning-color); font-weight: bold; font-size: 13px;"><i class="fas fa-user-shield"></i> Self Only</span>';

    let services = [check, check, check, check];
    let projects = [check, check, check, check];
    let blogs = [check, check, check, check];
    let leads = [na, check, check, check];
    let settings = [na, check, check, na];
    let users = [check, check, check, check];

    if (role === 'admin') {
      users = [cross, check, selfOnly, cross];
    } else if (role === 'editor') {
      services = [check, check, check, cross];
      projects = [check, check, check, cross];
      blogs = [check, check, check, cross];
      leads = [na, check, check, cross];
      settings = [na, check, check, na];
      users = [cross, cross, selfOnly, cross];
    }

    matrixTable.innerHTML = `
      <tr>
        <td><strong>Services</strong></td>
        <td>${services[0]}</td>
        <td>${services[1]}</td>
        <td>${services[2]}</td>
        <td>${services[3]}</td>
      </tr>
      <tr>
        <td><strong>Portfolio Projects</strong></td>
        <td>${projects[0]}</td>
        <td>${projects[1]}</td>
        <td>${projects[2]}</td>
        <td>${projects[3]}</td>
      </tr>
      <tr>
        <td><strong>Blog Posts</strong></td>
        <td>${blogs[0]}</td>
        <td>${blogs[1]}</td>
        <td>${blogs[2]}</td>
        <td>${blogs[3]}</td>
      </tr>
      <tr>
        <td><strong>Inquiry Leads (CRM)</strong></td>
        <td>${leads[0]}</td>
        <td>${leads[1]}</td>
        <td>${leads[2]}</td>
        <td>${leads[3]}</td>
      </tr>
      <tr>
        <td><strong>Global Settings</strong></td>
        <td>${settings[0]}</td>
        <td>${settings[1]}</td>
        <td>${settings[2]}</td>
        <td>${settings[3]}</td>
      </tr>
      <tr>
        <td><strong>Administrative Accounts (Users)</strong></td>
        <td>${users[0]}</td>
        <td>${users[1]}</td>
        <td>${users[2]}</td>
        <td>${users[3]}</td>
      </tr>
    `;
  }

  const historyTable = document.getElementById('permissions-history-table');
  if (historyTable) {
    if (currentUser.roleHistory && currentUser.roleHistory.length > 0) {
      // Sort history descending by start date
      const sortedHistory = [...currentUser.roleHistory].sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
      historyTable.innerHTML = sortedHistory.map(h => {
        const toDateStr = h.toDate ? formatDateTime(h.toDate) : '<span style="color:var(--success-color);font-weight:600;"><i class="fas fa-toggle-on"></i> Present (Active)</span>';
        return `
          <tr>
            <td><span class="status-badge ${h.role}">${h.role.replace('_', ' ')}</span></td>
            <td>${formatDateTime(h.fromDate)}</td>
            <td>${toDateStr}</td>
            <td><strong>${escapeHTML(h.changedBy)}</strong></td>
          </tr>
        `;
      }).join('');
    } else {
      // Fallback for pre-existing or seeded users without history entries
      const fromDate = currentUser.roleFromDate || currentUser.createdAt || new Date();
      historyTable.innerHTML = `
        <tr>
          <td><span class="status-badge ${currentUser.role}">${currentUser.role.replace('_', ' ')}</span></td>
          <td>${formatDateTime(fromDate)}</td>
          <td><span style="color:var(--success-color);font-weight:600;"><i class="fas fa-toggle-on"></i> Present (Active)</span></td>
          <td><strong>System (Initial Setup)</strong></td>
        </tr>
      `;
    }
  }
}

// ==========================================
// DATE FORMATTING HELPERS
// ==========================================
function formatDateTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${d}/${m}/${y}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

function formatDateOnly(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  return `${d}/${m}/${y}`;
}

// ==========================================
// HTML SECURITY ESCAPE HELPER
// ==========================================
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

// ==========================================
// EXPORT LEADS DATA (EXCEL & PDF)
// ==========================================
function toggleExportDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('export-dropdown-content');
  if (dropdown) {
    const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
    dropdown.style.display = isHidden ? 'block' : 'none';
  }
}

function exportLeads(format, event) {
  if (event) event.preventDefault();

  const dropdown = document.getElementById('export-dropdown-content');
  if (dropdown) dropdown.style.display = 'none';

  if (!leadsData || leadsData.length === 0) {
    alert('No lead records available to export.');
    return;
  }

  if (format === 'excel') {
    downloadLeadsExcel();
  } else if (format === 'pdf') {
    downloadLeadsPDF();
  }
}

function downloadLeadsExcel() {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Service', 'Message', 'Status', 'Date Received', 'Closed By', 'Closed At'];
  const rows = leadsData.map(l => [
    l.name,
    l.email,
    l.phone || '',
    l.company || '',
    l.service || '',
    l.message.replace(/\r?\n|\r/g, ' '),
    l.status,
    formatDateTime(l.createdAt),
    l.closedBy || '',
    l.closedAt ? formatDateTime(l.closedAt) : ''
  ]);

  let csvContent = "\uFEFF";
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + "\r\n";

  rows.forEach(row => {
    csvContent += row.map(val => `"${val.replace(/"/g, '""')}"`).join(',') + "\r\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `SponFin_Inquiry_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadLeadsPDF() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups to download the PDF report.');
    return;
  }

  const rowsHtml = leadsData.map(l => `
    <tr>
      <td><strong>${escapeHTML(l.name)}</strong></td>
      <td>
        <div>${escapeHTML(l.email)}</div>
        <div style="color:#6b7280; font-size:10px; margin-top:2px;">${escapeHTML(l.phone || 'N/A')}</div>
      </td>
      <td>${escapeHTML(l.company || 'N/A')}</td>
      <td>${escapeHTML(l.service)}</td>
      <td style="text-transform: capitalize;">${escapeHTML(l.status)}</td>
      <td>${formatDateOnly(l.createdAt)}</td>
      <td>
        ${escapeHTML(l.closedBy || 'N/A')}
        ${l.closedAt ? `<div style="color:#6b7280; font-size:9px; margin-top:2px;">${formatDateTime(l.closedAt)}</div>` : ''}
      </td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>SponFin Inquiry Leads Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1f2937; line-height: 1.4; }
          .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .title-area h2 { margin: 0; color: #1e3a8a; font-size: 24px; font-weight: 700; }
          .title-area p { margin: 5px 0 0 0; font-size: 12px; color: #4b5563; }
          .meta-info { text-align: right; font-size: 11px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; vertical-align: middle; }
          th { background-color: #f3f4f6; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="title-area">
            <h2>SponFin Backoffice Report</h2>
            <p>Customer Relationship Management - Inquiry Leads Logs</p>
          </div>
          <div class="meta-info">
            <div><strong>Generated:</strong> ${formatDateTime(new Date())}</div>
            <div><strong>Total Records:</strong> ${leadsData.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 13%;">Name</th>
              <th style="width: 17%;">Contact Info</th>
              <th style="width: 13%;">Company</th>
              <th style="width: 14%;">Service</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 11%;">Received Date</th>
              <th style="width: 22%;">Closed By & Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Global click handler to close dropdown when clicking outside
window.addEventListener('click', (e) => {
  const dropdown = document.getElementById('export-dropdown-content');
  const btn = document.getElementById('btn-export-leads');
  if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// ==========================================
// 11. MODULE: SYSTEM ACTIVITY LOGS
// ==========================================
let logsData = [];

async function loadLogsManager(fromDate = '', toDate = '') {
  if (!currentUser || currentUser.role !== 'super_admin') {
    return; // Safety guard
  }

  const tableBody = document.getElementById('logs-table');
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; font-weight: 500; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading activity logs from database... Please wait...</td></tr>`;
  }

  // Update input fields
  const fromDateInput = document.getElementById('filter-logs-from');
  const toDateInput = document.getElementById('filter-logs-to');
  if (fromDateInput) fromDateInput.value = fromDate;
  if (toDateInput) toDateInput.value = toDate;

  // Update explanation label
  const infoMsgEl = document.getElementById('logs-info-msg');
  if (infoMsgEl) {
    if (fromDate && toDate) {
      infoMsgEl.textContent = `Showing logs from ${fromDate} to ${toDate}.`;
    } else if (fromDate) {
      infoMsgEl.textContent = `Showing logs since ${fromDate}.`;
    } else if (toDate) {
      infoMsgEl.textContent = `Showing logs until ${toDate}.`;
    } else {
      infoMsgEl.textContent = 'Showing last 100 logs by default.';
    }
  }

  try {
    const response = await API.getActivityLogs(fromDate, toDate);
    if (response.success) {
      logsData = response.data;
      pageLogs = 1; // Reset to page 1
      renderLogsTable();
    }
  } catch (e) {
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger-color);">Error: Failed to load system activity logs.</td></tr>`;
    }
  }

  // Set click handlers for Fetch and Reset
  const filterBtn = document.getElementById('btn-filter-logs');
  if (filterBtn) {
    filterBtn.onclick = () => {
      const fromVal = fromDateInput ? fromDateInput.value : '';
      const toVal = toDateInput ? toDateInput.value : '';
      loadLogsManager(fromVal, toVal);
    };
  }

  const resetBtn = document.getElementById('btn-reset-logs');
  if (resetBtn) {
    resetBtn.onclick = () => {
      loadLogsManager('', '');
    };
  }
}

function renderLogsTable() {
  const tableBody = document.getElementById('logs-table');
  if (!tableBody) return;

  const totalCount = logsData.length;
  if (totalCount === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No activity logs recorded yet.</td></tr>`;
    renderPagination('logs', 0, 1);
    return;
  }

  const start = (pageLogs - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedData = logsData.slice(start, end);

  tableBody.innerHTML = paginatedData.map(log => {
    const dateStr = formatDateTime(log.createdAt);
    return `
      <tr>
        <td>${dateStr}</td>
        <td><strong>${escapeHTML(log.module)}</strong></td>
        <td><span class="status-badge action-${escapeHTML(log.action.toLowerCase())}">${escapeHTML(log.action)}</span></td>
        <td>${escapeHTML(log.details)}</td>
        <td><strong>${escapeHTML(log.performedBy)}</strong></td>
        <td><span class="status-badge ${escapeHTML(log.performedByRole)}">${escapeHTML(log.performedByRole.replace('_', ' '))}</span></td>
      </tr>
    `;
  }).join('');

  renderPagination('logs', totalCount, pageLogs);
}

// ==========================================
// 12. MODULE: FWORK EMBEDDED PLATFORM
// ==========================================
function loadFworkManager() {
  const iframe = document.getElementById('fwork-iframe');
  if (iframe && !iframe.src) {
    iframe.src = 'https://fwork.onrender.com/login';
  }
}
