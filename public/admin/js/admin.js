/**
 * Nafidhayn Law Firm — Admin Dashboard Single Page Application
 * Production CMS, Inquiries, Consultations & Settings Controller
 */

// Application State
const state = {
  currentUser: null,
  token: localStorage.getItem('nafidhayn_admin_token') || null,
  activeModule: 'overview',
  notifications: []
};

// API Client Helper
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}),
    ...options.headers
  };

  // If payload is FormData, let browser set Content-Type with boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(endpoint, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/login')) {
        handleUnauthorized();
      }
      throw new Error(data.error || 'حدث خطأ في استجابة الخادم.');
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// -------------------------------------------------------------
// TOAST NOTIFICATIONS
// -------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -------------------------------------------------------------
// AUTHENTICATION CONTROLLER
// -------------------------------------------------------------
async function initAuth() {
  const loginView = document.getElementById('loginView');
  const dashboardApp = document.getElementById('dashboardApp');

  if (!state.token) {
    showLogin();
    return;
  }

  try {
    const res = await api('/api/admin/me');
    if (res.success && res.user) {
      state.currentUser = res.user;
      showDashboard();
      updateUserUI();
      navigate(window.location.hash.replace('#', '') || 'overview');
      loadNotifications();
    } else {
      showLogin();
    }
  } catch (err) {
    showLogin();
  }
}

function showLogin() {
  state.currentUser = null;
  state.token = null;
  localStorage.removeItem('nafidhayn_admin_token');
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('dashboardApp').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('dashboardApp').classList.remove('hidden');
}

function handleUnauthorized() {
  showToast('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.', 'error');
  showLogin();
}

function fillAdminCredentials() {
  document.getElementById('loginEmail').value = 'admin@nafidhayn.sa';
  document.getElementById('loginPassword').value = 'Nafidhayn@2026';
}

// Login Form Submit
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const alertEl = document.getElementById('loginAlert');
  const btn = document.getElementById('loginSubmitBtn');

  alertEl.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';

  try {
    const res = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success && res.token) {
      state.token = res.token;
      state.currentUser = res.user;
      localStorage.setItem('nafidhayn_admin_token', res.token);
      showToast('تم تسجيل الدخول بنجاح. أهلاً بك في نظام نافذين.', 'success');
      showDashboard();
      updateUserUI();
      navigate('overview');
      loadNotifications();
    }
  } catch (err) {
    alertEl.textContent = err.message;
    alertEl.className = 'admin-alert error';
    alertEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>تسجيل الدخول للنظام</span> <i class="fa-solid fa-arrow-left"></i>';
  }
});

// Logout
async function handleLogout() {
  if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) return;
  try {
    await api('/api/admin/logout', { method: 'POST' });
  } catch (e) {}
  showLogin();
  showToast('تم تسجيل الخروج بنجاح.', 'info');
}

function updateUserUI() {
  if (!state.currentUser) return;
  const user = state.currentUser;
  const initial = user.full_name ? user.full_name.charAt(0) : 'ن';
  
  const roleLabels = {
    owner: 'المالك والمشرف العام',
    admin: 'مدير النظام',
    editor: 'محرر محتوى',
    receptionist: 'موظف استقبال وتنسيق'
  };
  const roleLabel = roleLabels[user.role] || user.role;

  document.getElementById('sidebarUserName').textContent = user.full_name || user.email;
  document.getElementById('sidebarUserRole').textContent = roleLabel;
  document.getElementById('sidebarUserInitials').textContent = initial;

  document.getElementById('topbarUserName').textContent = user.full_name || user.email;
  document.getElementById('topbarUserRole').textContent = roleLabel;
  document.getElementById('topbarUserAvatar').textContent = initial;
}

// -------------------------------------------------------------
// NAVIGATION & ROUTING
// -------------------------------------------------------------
function navigate(module) {
  state.activeModule = module || 'overview';
  window.location.hash = state.activeModule;

  // Update sidebar active link
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.module === state.activeModule);
  });

  // Update Breadcrumb & Header Title
  const titles = {
    overview: 'لوحة المؤشرات العامة',
    inquiries: 'إدارة استفسارات الموقع',
    consultations: 'طلبات الاستشارات القانونية',
    content: 'إدارة محتوى الأقسام والهيرو (CMS)',
    services: 'إدارة الخدمات القانونية',
    faq: 'إدارة الأسئلة الشائعة',
    articles: 'المقالات والأخبار القانونية',
    media: 'مكتبة الوسائط والملفات',
    settings: 'إعدادات الشركة والتواصل',
    users: 'فريق العمل والصلاحيات',
    activity: 'سجل العمليات والتدقيق'
  };
  document.getElementById('currentSectionTitle').textContent = titles[state.activeModule] || 'لوحة الإدارة';

  // Render appropriate module
  const container = document.getElementById('adminContent');
  container.innerHTML = '<div style="text-align:center; padding: 60px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--color-gold);"></i><p style="margin-top:14px; font-size:13px; color:var(--color-text-muted);">جاري تحميل البيانات...</p></div>';

  switch (state.activeModule) {
    case 'overview': renderOverview(); break;
    case 'inquiries': renderInquiries(); break;
    case 'consultations': renderConsultations(); break;
    case 'content': renderContent(); break;
    case 'services': renderServices(); break;
    case 'faq': renderFaq(); break;
    case 'articles': renderArticles(); break;
    case 'media': renderMedia(); break;
    case 'settings': renderSettings(); break;
    case 'users': renderUsers(); break;
    case 'activity': renderActivity(); break;
    default: renderOverview(); break;
  }

  // Close mobile sidebar if open
  document.getElementById('adminSidebar').classList.remove('open');
}

window.addEventListener('hashchange', () => {
  const target = window.location.hash.replace('#', '');
  if (target && target !== state.activeModule) {
    navigate(target);
  }
});

// Mobile Sidebar Toggle
document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.add('open');
});
document.getElementById('sidebarCloseBtn')?.addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.remove('open');
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
async function loadNotifications() {
  try {
    const res = await api('/api/admin/notifications');
    if (res.success && res.notifications) {
      state.notifications = res.notifications;
      const unread = res.notifications.filter(n => !n.is_read);
      const badge = document.getElementById('notifCount');
      if (unread.length > 0) {
        badge.textContent = unread.length;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
      renderNotificationsList();
    }
  } catch (err) {}
}

function renderNotificationsList() {
  const listEl = document.getElementById('notificationsList');
  if (!listEl) return;

  if (state.notifications.length === 0) {
    listEl.innerHTML = '<div class="notif-empty">لا توجد إشعارات حالياً</div>';
    return;
  }

  listEl.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="markNotificationRead('${n.id}', '${n.category}')">
      <div class="notif-title">${n.title_ar}</div>
      <div class="notif-desc">${n.message_ar}</div>
      <div class="notif-time">${new Date(n.created_at).toLocaleString('ar-SA')}</div>
    </div>
  `).join('');
}

async function markNotificationRead(id, category) {
  try {
    await api(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
    loadNotifications();
    if (category === 'inquiry') navigate('inquiries');
    if (category === 'consultation') navigate('consultations');
  } catch (err) {}
}

async function markAllNotificationsRead() {
  try {
    await api('/api/admin/notifications/mark-all-read', { method: 'POST' });
    loadNotifications();
    showToast('تم تحديد جميع الإشعارات كمقروءة.', 'success');
  } catch (err) {}
}

document.getElementById('notificationsBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('notificationsPanel').classList.toggle('show');
});

document.addEventListener('click', () => {
  document.getElementById('notificationsPanel')?.classList.remove('show');
});

// -------------------------------------------------------------
// MODAL CONTROLLER
// -------------------------------------------------------------
function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('adminModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('adminModal').classList.add('hidden');
}

// -------------------------------------------------------------
// MODULE 1: OVERVIEW & STATS
// -------------------------------------------------------------
async function renderOverview() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/stats');
    const { stats, recentInquiries, recentConsultations } = res;

    // Update sidebar badges
    if (stats.inquiries.new > 0) {
      const b = document.getElementById('inquiriesBadge');
      b.textContent = stats.inquiries.new;
      b.style.display = 'inline-block';
    }
    if (stats.consultations.new > 0) {
      const b = document.getElementById('consultationsBadge');
      b.textContent = stats.consultations.new;
      b.style.display = 'inline-block';
    }

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>مرحباً بك في لوحة الإدارة</h2>
          <p>إدارة طلبات الموكلين، تحرير محتوى الموقع، ومتابعة الأداء اللحظي</p>
        </div>
        <div class="module-header-actions">
          <button onclick="navigate('consultations')" class="btn btn-gold btn-sm">
            <i class="fa-solid fa-calendar-check"></i>
            <span>مراجعة الاستشارات (${stats.consultations.new} جديدة)</span>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" onclick="navigate('consultations')" style="cursor:pointer;">
          <div class="stat-icon gold"><i class="fa-solid fa-calendar-day"></i></div>
          <div class="stat-info">
            <span class="stat-value">${stats.consultations.total}</span>
            <span class="stat-label">طلبات الاستشارة (${stats.consultations.new} بانتظار الفحص)</span>
          </div>
        </div>

        <div class="stat-card" onclick="navigate('inquiries')" style="cursor:pointer;">
          <div class="stat-icon green"><i class="fa-solid fa-envelope-open-text"></i></div>
          <div class="stat-info">
            <span class="stat-value">${stats.inquiries.total}</span>
            <span class="stat-label">استفسارات التواصل (${stats.inquiries.new} جديدة)</span>
          </div>
        </div>

        <div class="stat-card" onclick="navigate('services')" style="cursor:pointer;">
          <div class="stat-icon blue"><i class="fa-solid fa-scale-balanced"></i></div>
          <div class="stat-info">
            <span class="stat-value">${stats.services}</span>
            <span class="stat-label">خدمات قانونية نشطة</span>
          </div>
        </div>

        <div class="stat-card" onclick="navigate('faq')" style="cursor:pointer;">
          <div class="stat-icon purple"><i class="fa-solid fa-circle-question"></i></div>
          <div class="stat-info">
            <span class="stat-value">${stats.faqs}</span>
            <span class="stat-label">أسئلة شائعة منشورة</span>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap:24px;">
        <!-- Recent Consultations -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>أحدث طلبات الاستشارة القانونية</h3>
            <button onclick="navigate('consultations')" class="btn-text">عرض الكل</button>
          </div>
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>العميل</th>
                  <th>الخدمة</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                ${recentConsultations.length === 0 ? '<tr><td colspan="5" class="table-empty">لا توجد طلبات استشارة بعد</td></tr>' : 
                  recentConsultations.map(c => `
                    <tr>
                      <td><strong>${c.ref_number}</strong></td>
                      <td>${c.client_name}</td>
                      <td>${c.service_requested || 'عامة'}</td>
                      <td><span class="status-pill status-${c.status}">${getStatusLabel(c.status)}</span></td>
                      <td>
                        <button onclick="viewConsultation('${c.id}')" class="btn-icon" title="عرض التفاصيل"><i class="fa-solid fa-eye"></i></button>
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Inquiries -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>أحدث استفسارات الموقع</h3>
            <button onclick="navigate('inquiries')" class="btn-text">عرض الكل</button>
          </div>
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>الاسم</th>
                  <th>الموضوع</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                ${recentInquiries.length === 0 ? '<tr><td colspan="5" class="table-empty">لا توجد استفسارات بعد</td></tr>' : 
                  recentInquiries.map(i => `
                    <tr>
                      <td><strong>${i.ref_number}</strong></td>
                      <td>${i.full_name}</td>
                      <td>${truncate(i.subject, 24)}</td>
                      <td><span class="status-pill status-${i.status}">${getStatusLabel(i.status)}</span></td>
                      <td>
                        <button onclick="viewInquiry('${i.id}')" class="btn-icon" title="عرض التفاصيل"><i class="fa-solid fa-eye"></i></button>
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل بيانات لوحة المؤشرات: ${err.message}</div>`;
  }
}

// -------------------------------------------------------------
// MODULE 2: INQUIRIES MANAGEMENT
// -------------------------------------------------------------
async function renderInquiries(status = 'all', search = '') {
  const container = document.getElementById('adminContent');
  try {
    const res = await api(`/api/admin/inquiries?status=${status}&search=${encodeURIComponent(search)}`);
    const inquiries = res.inquiries || [];

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>استفسارات الموكلين والزوار</h2>
          <p>متابعة وتوثيق الاستفسارات الواردة عبر نموذج الاتصال المباشر</p>
        </div>
        <div class="module-header-actions">
          <a href="/api/admin/inquiries/export/csv" target="_blank" class="btn btn-outline-gold btn-sm">
            <i class="fa-solid fa-file-excel"></i>
            <span>تصدير إلى Excel (CSV)</span>
          </a>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-body">
          <div class="filters-bar">
            <div class="search-input-wrap">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" id="inquirySearch" class="form-control" placeholder="البحث بالاسم، الجوال، الموضوع، أو رقم المرجع..." value="${search}">
            </div>
            <select id="inquiryStatusFilter" class="filter-select">
              <option value="all" ${status === 'all' ? 'selected' : ''}>جميع الحالات</option>
              <option value="new" ${status === 'new' ? 'selected' : ''}>جديد</option>
              <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>قيد المعالجة</option>
              <option value="responded" ${status === 'responded' ? 'selected' : ''}>تم الرد</option>
              <option value="closed" ${status === 'closed' ? 'selected' : ''}>مغلق</option>
              <option value="archived" ${status === 'archived' ? 'selected' : ''}>مؤرشف</option>
            </select>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>الاسم الكامل</th>
                  <th>رقم الجوال</th>
                  <th>الموضوع</th>
                  <th>الحالة</th>
                  <th>تاريخ الاستلام</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${inquiries.length === 0 ? '<tr><td colspan="7" class="table-empty">لا توجد استفسارات مطابقة لخيارات البحث</td></tr>' : 
                  inquiries.map(item => `
                    <tr>
                      <td><strong>${item.ref_number}</strong></td>
                      <td>${item.full_name}</td>
                      <td><a href="tel:${item.phone}" dir="ltr" style="color:var(--color-forest);">${item.phone}</a></td>
                      <td>${truncate(item.subject, 30)}</td>
                      <td><span class="status-pill status-${item.status}">${getStatusLabel(item.status)}</span></td>
                      <td>${new Date(item.created_at).toLocaleDateString('ar-SA')}</td>
                      <td>
                        <div class="table-actions">
                          <button onclick="viewInquiry('${item.id}')" class="btn-icon" title="عرض التفاصيل"><i class="fa-solid fa-eye"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('inquirySearch')?.addEventListener('keyup', debounce((e) => {
      renderInquiries(document.getElementById('inquiryStatusFilter').value, e.target.value);
    }, 400));

    document.getElementById('inquiryStatusFilter')?.addEventListener('change', (e) => {
      renderInquiries(e.target.value, document.getElementById('inquirySearch').value);
    });

  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل الاستفسارات: ${err.message}</div>`;
  }
}

async function viewInquiry(id) {
  try {
    const res = await api(`/api/admin/inquiries/${id}`);
    const { inquiry, notes } = res;

    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="background:#F8F6F0; padding:16px; border-radius:8px; border:1px solid #E5E0D5;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <span style="font-size:12px; color:var(--color-text-muted);">رقم المرجع:</span>
              <strong style="color:var(--color-primary); font-size:16px; margin-right:6px;">${inquiry.ref_number}</strong>
            </div>
            <div>
              <select id="modalInquiryStatus" class="filter-select" onchange="updateInquiryStatus('${inquiry.id}', this.value)">
                <option value="new" ${inquiry.status === 'new' ? 'selected' : ''}>جديد</option>
                <option value="in_progress" ${inquiry.status === 'in_progress' ? 'selected' : ''}>قيد المعالجة</option>
                <option value="responded" ${inquiry.status === 'responded' ? 'selected' : ''}>تم الرد</option>
                <option value="closed" ${inquiry.status === 'closed' ? 'selected' : ''}>مغلق</option>
                <option value="archived" ${inquiry.status === 'archived' ? 'selected' : ''}>مؤرشف</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
            <div><strong>الاسم:</strong> ${inquiry.full_name}</div>
            <div><strong>الجوال:</strong> <a href="tel:${inquiry.phone}" dir="ltr">${inquiry.phone}</a></div>
            <div><strong>البريد:</strong> ${inquiry.email || 'غير محدد'}</div>
            <div><strong>التاريخ:</strong> ${new Date(inquiry.created_at).toLocaleString('ar-SA')}</div>
          </div>
        </div>

        <div>
          <h4 style="margin-bottom:8px; font-size:15px;">الموضوع: ${inquiry.subject}</h4>
          <div style="background:#FFFFFF; border:1px solid #DCD8CD; padding:14px; border-radius:8px; font-size:14px; line-height:1.6; white-space:pre-wrap;">${inquiry.message}</div>
        </div>

        <div style="display:flex; gap:10px;">
          <a href="https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم، بخصوص استفساركم الوارد برقم ' + inquiry.ref_number + ' إلى شركة نافذين للمحاماة...')}" target="_blank" class="btn btn-outline-gold btn-sm">
            <i class="fa-brands fa-whatsapp"></i> مراسلة عبر واتساب
          </a>
          <a href="tel:${inquiry.phone}" class="btn btn-outline-gold btn-sm">
            <i class="fa-solid fa-phone"></i> اتصال مباشر
          </a>
        </div>

        <!-- Internal Notes -->
        <div style="border-top:1px solid #E5E0D5; padding-top:16px;">
          <h4 style="margin-bottom:10px; font-size:15px;"><i class="fa-solid fa-notes-medical"></i> الملاحظات الداخلية للموظفين</h4>
          
          <div style="display:flex; gap:10px; margin-bottom:14px;">
            <input type="text" id="newInquiryNoteText" class="form-control" placeholder="أضف ملاحظة داخلية (سرية لفريق العمل)...">
            <button onclick="addInquiryNote('${inquiry.id}')" class="btn btn-gold btn-sm" style="white-space:nowrap;">إضافة</button>
          </div>

          <div style="max-height:180px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
            ${notes.length === 0 ? '<div style="font-size:12px; color:var(--color-text-muted);">لا توجد ملاحظات داخلية بعد.</div>' : 
              notes.map(n => `
                <div style="background:#F4F2EB; padding:8px 12px; border-radius:6px; font-size:12px;">
                  <div style="display:flex; justify-content:space-between; color:var(--color-text-muted); margin-bottom:4px;">
                    <strong>${n.author_name || 'موظف الإدارة'}</strong>
                    <span>${new Date(n.created_at).toLocaleString('ar-SA')}</span>
                  </div>
                  <div>${n.note || ''}</div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;

    openModal(`تفاصيل الاستفسار [${inquiry.ref_number}]`, bodyHtml);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateInquiryStatus(id, newStatus) {
  try {
    await api(`/api/admin/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    showToast('تم تحديث حالة الاستفسار بنجاح.', 'success');
    if (state.activeModule === 'inquiries') renderInquiries();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function addInquiryNote(id) {
  const input = document.getElementById('newInquiryNoteText');
  const note = input?.value.trim();
  if (!note) return;

  try {
    await api(`/api/admin/inquiries/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    showToast('تمت إضافة الملاحظة الداخلية.', 'success');
    viewInquiry(id); // Reload modal
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 3: CONSULTATIONS MANAGEMENT
// -------------------------------------------------------------
async function renderConsultations(status = 'all', search = '') {
  const container = document.getElementById('adminContent');
  try {
    const res = await api(`/api/admin/consultations?status=${status}&search=${encodeURIComponent(search)}`);
    const consultations = res.consultations || [];

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>طلبات الاستشارات القانونية</h2>
          <p>إدارة طلبات المواعيد، التحقق من عدم تعارض المصالح، وتأكيد المواعيد النهائية</p>
        </div>
        <div class="module-header-actions">
          <a href="/api/admin/consultations/export/csv" target="_blank" class="btn btn-outline-gold btn-sm">
            <i class="fa-solid fa-file-excel"></i>
            <span>تصدير إلى Excel (CSV)</span>
          </a>
        </div>
      </div>

      <div class="admin-alert" style="background:#EBF3FC; border:1px solid #BEE5EB; color:#0C5460; margin-bottom:20px;">
        <i class="fa-solid fa-circle-info"></i>
        <span><strong>تنويه مهني:</strong> المواعيد المسجلة من الموكلين تعتبر رغبات مبدئية ولا تصبح ملزمة إلا بعد إتمام دراسة تعارض المصالح وتأكيد الموعد النهائي عبر النظام.</span>
      </div>

      <div class="admin-card">
        <div class="admin-card-body">
          <div class="filters-bar">
            <div class="search-input-wrap">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" id="consultationSearch" class="form-control" placeholder="البحث باسم العميل، الجوال، التخصص، أو رقم المرجع..." value="${search}">
            </div>
            <select id="consultationStatusFilter" class="filter-select">
              <option value="all" ${status === 'all' ? 'selected' : ''}>جميع الحالات</option>
              <option value="new" ${status === 'new' ? 'selected' : ''}>جديد (بانتظار الفحص)</option>
              <option value="under_review" ${status === 'under_review' ? 'selected' : ''}>قيد دراسة التعارض</option>
              <option value="contacted" ${status === 'contacted' ? 'selected' : ''}>تم التواصل</option>
              <option value="scheduled" ${status === 'scheduled' ? 'selected' : ''}>موعد معتمد</option>
              <option value="completed" ${status === 'completed' ? 'selected' : ''}>مكتملة</option>
              <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>ملغاة / اعتذار</option>
            </select>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>العميل</th>
                  <th>النوع</th>
                  <th>الجوال</th>
                  <th>المجال القانوني</th>
                  <th>الموعد المبدئي</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${consultations.length === 0 ? '<tr><td colspan="8" class="table-empty">لا توجد طلبات استشارة مطابقة للبحث</td></tr>' : 
                  consultations.map(c => `
                    <tr>
                      <td><strong>${c.ref_number}</strong></td>
                      <td>${c.client_name}</td>
                      <td>${c.client_type === 'corporate' ? '<span class="status-pill status-in_progress">شركة</span>' : '<span class="status-pill status-draft">فرد</span>'}</td>
                      <td><a href="tel:${c.phone}" dir="ltr" style="color:var(--color-forest);">${c.phone}</a></td>
                      <td>${c.service_requested || 'عامة'}</td>
                      <td>${c.preferred_date ? new Date(c.preferred_date).toLocaleDateString('ar-SA') : 'غير محدد'}</td>
                      <td><span class="status-pill status-${c.status}">${getStatusLabel(c.status)}</span></td>
                      <td>
                        <div class="table-actions">
                          <button onclick="viewConsultation('${c.id}')" class="btn-icon" title="عرض التفاصيل"><i class="fa-solid fa-eye"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('consultationSearch')?.addEventListener('keyup', debounce((e) => {
      renderConsultations(document.getElementById('consultationStatusFilter').value, e.target.value);
    }, 400));

    document.getElementById('consultationStatusFilter')?.addEventListener('change', (e) => {
      renderConsultations(e.target.value, document.getElementById('consultationSearch').value);
    });

  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل طلبات الاستشارة: ${err.message}</div>`;
  }
}

async function viewConsultation(id) {
  try {
    const res = await api(`/api/admin/consultations/${id}`);
    const { consultation: c, notes } = res;

    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="background:#F8F6F0; padding:16px; border-radius:8px; border:1px solid #E5E0D5;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <span style="font-size:12px; color:var(--color-text-muted);">رقم الاستشارة:</span>
              <strong style="color:var(--color-primary); font-size:16px; margin-right:6px;">${c.ref_number}</strong>
            </div>
            <div>
              <select id="modalConsultationStatus" class="filter-select" onchange="updateConsultationStatus('${c.id}', this.value)">
                <option value="new" ${c.status === 'new' ? 'selected' : ''}>جديد (بانتظار الفحص)</option>
                <option value="under_review" ${c.status === 'under_review' ? 'selected' : ''}>قيد دراسة التعارض</option>
                <option value="contacted" ${c.status === 'contacted' ? 'selected' : ''}>تم التواصل</option>
                <option value="scheduled" ${c.status === 'scheduled' ? 'selected' : ''}>موعد معتمد</option>
                <option value="completed" ${c.status === 'completed' ? 'selected' : ''}>مكتملة</option>
                <option value="cancelled" ${c.status === 'cancelled' ? 'selected' : ''}>ملغاة / اعتذار</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
            <div><strong>اسم العميل:</strong> ${c.client_name}</div>
            <div><strong>نوع العميل:</strong> ${c.client_type === 'corporate' ? 'شركة / كيان تجاري' : 'فرد'}</div>
            <div><strong>رقم الجوال:</strong> <a href="tel:${c.phone}" dir="ltr">${c.phone}</a></div>
            <div><strong>البريد الإلكتروني:</strong> ${c.email || 'غير محدد'}</div>
            <div><strong>المجال القانوني:</strong> ${c.service_requested || 'عامة'}</div>
            <div><strong>قناة الاستشارة المفضلة:</strong> ${c.preferred_channel === 'virtual' ? 'اجتماع مرئي عن بعد' : c.preferred_channel === 'phone' ? 'هاتفياً' : 'حضور بمقر الشركة'}</div>
            <div><strong>الموعد المقترح من العميل:</strong> ${c.preferred_date ? new Date(c.preferred_date).toLocaleDateString('ar-SA') : 'مفتوح'}</div>
            <div><strong>فترة التفضيل:</strong> ${c.preferred_time === 'evening' ? 'مسائية' : 'صباحية'}</div>
          </div>
        </div>

        <div>
          <h4 style="margin-bottom:8px; font-size:15px;">موجز الموضوع القانوني:</h4>
          <div style="background:#FFFFFF; border:1px solid #DCD8CD; padding:14px; border-radius:8px; font-size:14px; line-height:1.6; white-space:pre-wrap;">${c.summary}</div>
        </div>

        <div style="display:flex; gap:10px;">
          <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم، بخصوص طلب الاستشارة القانونية برقم ' + c.ref_number + ' لدى شركة نافذين للمحاماة...')}" target="_blank" class="btn btn-outline-gold btn-sm">
            <i class="fa-brands fa-whatsapp"></i> تواصل عبر واتساب
          </a>
          <a href="tel:${c.phone}" class="btn btn-outline-gold btn-sm">
            <i class="fa-solid fa-phone"></i> اتصال بالمراجع
          </a>
        </div>

        <!-- Internal Notes -->
        <div style="border-top:1px solid #E5E0D5; padding-top:16px;">
          <h4 style="margin-bottom:10px; font-size:15px;"><i class="fa-solid fa-notes-medical"></i> الملاحظات وسجل فحص تعارض المصالح</h4>
          
          <div style="display:flex; gap:10px; margin-bottom:14px;">
            <input type="text" id="newConsultationNoteText" class="form-control" placeholder="أضف ملاحظة أو نتيجة فحص التعارض...">
            <button onclick="addConsultationNote('${c.id}')" class="btn btn-gold btn-sm" style="white-space:nowrap;">إضافة</button>
          </div>

          <div style="max-height:180px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
            ${notes.length === 0 ? '<div style="font-size:12px; color:var(--color-text-muted);">لا توجد ملاحظات داخلية بعد.</div>' : 
              notes.map(n => `
                <div style="background:#F4F2EB; padding:8px 12px; border-radius:6px; font-size:12px;">
                  <div style="display:flex; justify-content:space-between; color:var(--color-text-muted); margin-bottom:4px;">
                    <strong>${n.author_name || 'موظف الإدارة'}</strong>
                    <span>${new Date(n.created_at).toLocaleString('ar-SA')}</span>
                  </div>
                  <div>${n.note || ''}</div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;

    openModal(`طلب استشارة قانونية [${c.ref_number}]`, bodyHtml);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateConsultationStatus(id, newStatus) {
  try {
    await api(`/api/admin/consultations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    showToast('تم تحديث حالة طلب الاستشارة بنجاح.', 'success');
    if (state.activeModule === 'consultations') renderConsultations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function addConsultationNote(id) {
  const input = document.getElementById('newConsultationNoteText');
  const note = input?.value.trim();
  if (!note) return;

  try {
    await api(`/api/admin/consultations/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    showToast('تمت إضافة الملاحظة.', 'success');
    viewConsultation(id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 4: CMS & SITE SECTIONS (HERO, ABOUT)
// -------------------------------------------------------------
async function renderContent() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/content/sections');
    const sections = res.sections || [];

    const hero = sections.find(s => s.section_key === 'hero') || {};
    const about = sections.find(s => s.section_key === 'about') || {};

    const heroContent = hero.draft_content_ar || hero.content_ar || {};
    const aboutContent = about.draft_content_ar || about.content_ar || {};

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>محرر محتوى الموقع والصفحة الرئيسية (CMS)</h2>
          <p>تحرير نصوص وصور الواجهة، دعم نظام المسودة، وسجل النسخ السابقة</p>
        </div>
        <div class="module-header-actions">
          <a href="/" target="_blank" class="btn btn-outline-gold btn-sm">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            <span>معاينة الموقع العام</span>
          </a>
        </div>
      </div>

      <!-- HERO SECTION EDITOR -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h3>واجهة الموقع الرئيسية (Hero Section)</h3>
            <span style="font-size:12px; color:var(--color-text-muted);">
              آخر نشر: ${hero.published_at ? new Date(hero.published_at).toLocaleString('ar-SA') : 'لم يتم النشر بعد'}
            </span>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="viewRevisions('${hero.id}', 'Hero')" class="btn btn-outline-gold btn-sm">
              <i class="fa-solid fa-history"></i> النسخ السابقة
            </button>
            <button onclick="saveHeroDraft('${hero.id}')" class="btn btn-outline-gold btn-sm">
              <i class="fa-solid fa-floppy-disk"></i> حفظ مسودة
            </button>
            <button onclick="publishHeroSection('${hero.id}')" class="btn btn-gold btn-sm">
              <i class="fa-solid fa-upload"></i> نشر التعديلات للموقع
            </button>
          </div>
        </div>
        <div class="admin-card-body">
          <form id="heroForm" onsubmit="event.preventDefault(); saveHeroDraft('${hero.id}');">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px;">
              <div class="form-group">
                <label class="form-label">الشعار الترحيبي (Badge Text)</label>
                <input type="text" id="heroBadge" class="form-control" value="${heroContent.badge_text || 'شركة محاماة واستشارات قانونية مرخصة بالمملكة العربية السعودية'}">
              </div>
              <div class="form-group">
                <label class="form-label">العنوان الرئيسي الأول (Main Title Line 1)</label>
                <input type="text" id="heroTitle1" class="form-control" value="${heroContent.title_line1 || 'نافذين... حيث تبدأ الثقة'}">
              </div>
              <div class="form-group">
                <label class="form-label">العنوان الرئيسي الثاني (Main Title Line 2)</label>
                <input type="text" id="heroTitle2" class="form-control" value="${heroContent.title_line2 || 'وتُصان الحقوق'}">
              </div>
              <div class="form-group">
                <label class="form-label">العبارة الشعرية / الفلسفية المكملة</label>
                <input type="text" id="heroPoetic" class="form-control" value="${heroContent.poetic_statement || 'العدالة تبدأ بخطوة صحيحة'}">
              </div>
            </div>

            <div class="form-group" style="margin-bottom:18px;">
              <label class="form-label">الوصف التفصيلي (Hero Paragraph)</label>
              <textarea id="heroDesc" class="form-control" rows="3">${heroContent.description || 'حلول قانونية برؤية واضحة، والتزام مهني بحماية الحقوق والمصالح وفق أرفع المعايير المهنية والأنظمة السعودية الحديثة.'}</textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
              <div class="form-group">
                <label class="form-label">زر الحجز الرئيسي (Primary CTA Text)</label>
                <input type="text" id="heroCta1" class="form-control" value="${heroContent.cta_primary_text || 'احجز استشارة قانونية'}">
              </div>
              <div class="form-group">
                <label class="form-label">زر الخدمات الثانوي (Secondary CTA Text)</label>
                <input type="text" id="heroCta2" class="form-control" value="${heroContent.cta_secondary_text || 'استكشف خدماتنا'}">
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- ABOUT SECTION EDITOR -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <h3>قسم من نحن والتعريف بالشركة (About Section)</h3>
            <span style="font-size:12px; color:var(--color-text-muted);">
              آخر نشر: ${about.published_at ? new Date(about.published_at).toLocaleString('ar-SA') : 'لم يتم النشر بعد'}
            </span>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="saveAboutDraft('${about.id}')" class="btn btn-outline-gold btn-sm">
              <i class="fa-solid fa-floppy-disk"></i> حفظ مسودة
            </button>
            <button onclick="publishAboutSection('${about.id}')" class="btn btn-gold btn-sm">
              <i class="fa-solid fa-upload"></i> نشر التعديلات للموقع
            </button>
          </div>
        </div>
        <div class="admin-card-body">
          <form id="aboutForm" onsubmit="event.preventDefault(); saveAboutDraft('${about.id}');">
            <div class="form-group" style="margin-bottom:18px;">
              <label class="form-label">عنوان القسم الرئيسي</label>
              <input type="text" id="aboutTitle" class="form-control" value="${about.title_ar || 'ريادة قانونية راسخة، تُسهم في حماية الأعمال وتمكين الحقوق'}">
            </div>

            <div class="form-group" style="margin-bottom:18px;">
              <label class="form-label">نص النبذة التعريفية (About Content)</label>
              <textarea id="aboutBody" class="form-control" rows="4">${aboutContent.body_ar || 'تأسست شركة نافذين للمحاماة والاستشارات القانونية لتكون شريكاً استراتيجياً موثوقاً لقطاع الأعمال والأفراد في المملكة العربية السعودية...'}</textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
              <div class="form-group">
                <label class="form-label">الرؤية (Our Vision)</label>
                <textarea id="aboutVision" class="form-control" rows="2">${aboutContent.vision || 'أن نكون الصرح القانوني الرائد في تقديم الاستشارات والحلول القضائية المبتكرة وفق رؤية المملكة 2030.'}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">الرسالة (Our Mission)</label>
                <textarea id="aboutMission" class="form-control" rows="2">${aboutContent.mission || 'تقديم خدمات قانونية مؤسسية قائمة على النزاهة والاحترافية والسرية التامة، لصون الحقوق ودعم بيئة الاستثمار.'}</textarea>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل محتوى الأقسام: ${err.message}</div>`;
  }
}

async function saveHeroDraft(sectionId) {
  try {
    const draftContent = {
      badge_text: document.getElementById('heroBadge').value,
      title_line1: document.getElementById('heroTitle1').value,
      title_line2: document.getElementById('heroTitle2').value,
      poetic_statement: document.getElementById('heroPoetic').value,
      description: document.getElementById('heroDesc').value,
      cta_primary_text: document.getElementById('heroCta1').value,
      cta_secondary_text: document.getElementById('heroCta2').value
    };

    await api(`/api/admin/content/sections/${sectionId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({
        title_ar: draftContent.title_line1,
        subtitle_ar: draftContent.title_line2,
        draft_content_ar: draftContent
      })
    });
    showToast('تم حفظ مسودة الهيرو بنجاح (الموقع العام لم يتغير حتى تضغط نشر).', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function publishHeroSection(sectionId) {
  if (!confirm('هل أنت متأكد من رغبتك في نشر تعديلات الهيرو مباشرة على الموقع العام؟')) return;
  try {
    await saveHeroDraft(sectionId);
    await api(`/api/admin/content/sections/${sectionId}/publish`, { method: 'POST' });
    showToast('تم نشر تعديلات الهيرو بنجاح وهي الآن معروضة لجميع زوار الموقع!', 'success');
    renderContent();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveAboutDraft(sectionId) {
  try {
    const draftContent = {
      body_ar: document.getElementById('aboutBody').value,
      vision: document.getElementById('aboutVision').value,
      mission: document.getElementById('aboutMission').value
    };

    await api(`/api/admin/content/sections/${sectionId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({
        title_ar: document.getElementById('aboutTitle').value,
        draft_content_ar: draftContent
      })
    });
    showToast('تم حفظ مسودة قسم من نحن بنجاح.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function publishAboutSection(sectionId) {
  if (!confirm('هل أنت متأكد من رغبتك في نشر تعديلات قسم من نحن للموقع العام؟')) return;
  try {
    await saveAboutDraft(sectionId);
    await api(`/api/admin/content/sections/${sectionId}/publish`, { method: 'POST' });
    showToast('تم نشر تعديلات قسم من نحن بنجاح!', 'success');
    renderContent();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewRevisions(sectionId, title) {
  try {
    const res = await api(`/api/admin/content/sections/${sectionId}/revisions`);
    const revisions = res.revisions || [];

    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <p style="font-size:13px; color:var(--color-text-muted);">
          سجل التعديلات السابقة المنشورة مع إمكانية استرجاع أي نسخة بنقرة واحدة:
        </p>

        ${revisions.length === 0 ? '<div class="table-empty">لا توجد نسخ سابقة محفوظة بعد</div>' : 
          revisions.map(rev => `
            <div style="background:#F8F6F0; border:1px solid #E5E0D5; border-radius:8px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:var(--color-primary);">${rev.content_snapshot?.title_ar || 'نسخة بدون عنوان'}</strong>
                <div style="font-size:11px; color:var(--color-text-muted); margin-top:4px;">
                  بواسطة: ${rev.creator_name || 'موظف الإدارة'} • ${new Date(rev.created_at).toLocaleString('ar-SA')}
                </div>
              </div>
              <button onclick="restoreRevision('${sectionId}', '${rev.id}')" class="btn btn-outline-gold btn-sm">
                <i class="fa-solid fa-rotate-left"></i> استرجاع هذه النسخة
              </button>
            </div>
          `).join('')}
      </div>
    `;

    openModal(`سجل النسخ السابقة لـ ${title}`, bodyHtml);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function restoreRevision(sectionId, revId) {
  if (!confirm('هل أنت متأكد من رغبتك في استرجاع هذه النسخة السابقة ونشرها للموقع العام؟')) return;
  try {
    await api(`/api/admin/content/sections/${sectionId}/restore/${revId}`, { method: 'POST' });
    showToast('تم استرجاع النسخة بنجاح وتحديث الموقع العام.', 'success');
    closeModal();
    renderContent();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 5: LEGAL SERVICES MANAGEMENT
// -------------------------------------------------------------
async function renderServices() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/services');
    const services = res.services || [];

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>الخدمات القانونية والممارسات المهنية</h2>
          <p>إدارة وتحديث مجالات الاختصاص والتمثيل القضائي المعروضة على الموقع</p>
        </div>
        <div class="module-header-actions">
          <button onclick="openAddServiceModal()" class="btn btn-gold btn-sm">
            <i class="fa-solid fa-plus"></i>
            <span>إضافة خدمة قانونية جديدة</span>
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>الترتيب</th>
                <th>اسم الخدمة (عربي)</th>
                <th>الاسم بالإنجليزي</th>
                <th>نبذة مختصرة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${services.length === 0 ? '<tr><td colspan="6" class="table-empty">لا توجد خدمات مضافة بعد</td></tr>' : 
                services.map(s => `
                  <tr>
                    <td><strong>${s.display_order}</strong></td>
                    <td><strong style="color:var(--color-primary);">${s.title_ar}</strong></td>
                    <td>${s.title_en || '-'}</td>
                    <td>${truncate(s.short_desc_ar, 40)}</td>
                    <td>${s.is_active ? '<span class="status-pill status-completed">نشطة ومفعلة</span>' : '<span class="status-pill status-draft">معطلة</span>'}</td>
                    <td>
                      <div class="table-actions">
                        <button onclick="openEditServiceModal('${s.id}')" class="btn-icon" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteService('${s.id}', '${s.title_ar}')" class="btn-icon delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل الخدمات: ${err.message}</div>`;
  }
}

function openAddServiceModal() {
  const bodyHtml = `
    <form id="addServiceForm" onsubmit="event.preventDefault(); submitAddService();">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">اسم الخدمة بالعربية *</label>
          <input type="text" id="srvTitleAr" class="form-control" required placeholder="مثال: التقاضي وفض المنازعات">
        </div>
        <div class="form-group">
          <label class="form-label">اسم الخدمة بالإنجليزية</label>
          <input type="text" id="srvTitleEn" class="form-control" placeholder="e.g. Commercial Litigation">
        </div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">نبذة موجزة بالعربية *</label>
        <textarea id="srvShortAr" class="form-control" rows="2" required placeholder="شرح مبسط يظهر في بطاقة الخدمة بالصفحة الرئيسية..."></textarea>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">الشرح التفصيلي لصفحة الخدمة</label>
        <textarea id="srvFullAr" class="form-control" rows="4" placeholder="تفاصيل المحاور، الإجراءات، وآلية العمل..."></textarea>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
        <div class="form-group">
          <label class="form-label">ترتيب العرض الرقمي</label>
          <input type="number" id="srvOrder" class="form-control" value="1">
        </div>
        <div class="form-group">
          <label class="form-label">حالة التفعيل</label>
          <select id="srvActive" class="filter-select" style="width:100%;">
            <option value="true">مفعلة وتظهر للزوار</option>
            <option value="false">معطلة ومخفية</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
        <button type="submit" class="btn btn-gold btn-sm">حفظ الخدمة</button>
      </div>
    </form>
  `;
  openModal('إضافة خدمة قانونية جديدة', bodyHtml);
}

async function submitAddService() {
  const payload = {
    title_ar: document.getElementById('srvTitleAr').value.trim(),
    title_en: document.getElementById('srvTitleEn').value.trim(),
    short_desc_ar: document.getElementById('srvShortAr').value.trim(),
    full_content_ar: document.getElementById('srvFullAr').value.trim(),
    display_order: parseInt(document.getElementById('srvOrder').value) || 1,
    is_active: document.getElementById('srvActive').value === 'true'
  };

  try {
    await api('/api/admin/services', { method: 'POST', body: JSON.stringify(payload) });
    showToast('تمت إضافة الخدمة القانونية بنجاح.', 'success');
    closeModal();
    renderServices();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openEditServiceModal(id) {
  try {
    const res = await api('/api/admin/services');
    const s = res.services.find(item => item.id === id);
    if (!s) return;

    const bodyHtml = `
      <form id="editServiceForm" onsubmit="event.preventDefault(); submitEditService('${s.id}');">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label">اسم الخدمة بالعربية *</label>
            <input type="text" id="srvEditTitleAr" class="form-control" required value="${s.title_ar}">
          </div>
          <div class="form-group">
            <label class="form-label">اسم الخدمة بالإنجليزية</label>
            <input type="text" id="srvEditTitleEn" class="form-control" value="${s.title_en || ''}">
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">نبذة موجزة بالعربية *</label>
          <textarea id="srvEditShortAr" class="form-control" rows="2" required>${s.short_desc_ar || ''}</textarea>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">الشرح التفصيلي</label>
          <textarea id="srvEditFullAr" class="form-control" rows="4">${s.full_content_ar || ''}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
          <div class="form-group">
            <label class="form-label">ترتيب العرض</label>
            <input type="number" id="srvEditOrder" class="form-control" value="${s.display_order}">
          </div>
          <div class="form-group">
            <label class="form-label">حالة التفعيل</label>
            <select id="srvEditActive" class="filter-select" style="width:100%;">
              <option value="true" ${s.is_active ? 'selected' : ''}>مفعلة وتظهر للزوار</option>
              <option value="false" ${!s.is_active ? 'selected' : ''}>معطلة ومخفية</option>
            </select>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
          <button type="submit" class="btn btn-gold btn-sm">حفظ التعديلات</button>
        </div>
      </form>
    `;
    openModal(`تعديل الخدمة: ${s.title_ar}`, bodyHtml);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitEditService(id) {
  const payload = {
    title_ar: document.getElementById('srvEditTitleAr').value.trim(),
    title_en: document.getElementById('srvEditTitleEn').value.trim(),
    short_desc_ar: document.getElementById('srvEditShortAr').value.trim(),
    full_content_ar: document.getElementById('srvEditFullAr').value.trim(),
    display_order: parseInt(document.getElementById('srvEditOrder').value) || 1,
    is_active: document.getElementById('srvEditActive').value === 'true'
  };

  try {
    await api(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('تم تحديث الخدمة بنجاح.', 'success');
    closeModal();
    renderServices();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteService(id, name) {
  if (!confirm(`هل أنت متأكد من رغبتك في حذف خدمة "${name}"؟`)) return;
  try {
    await api(`/api/admin/services/${id}`, { method: 'DELETE' });
    showToast('تم حذف الخدمة بنجاح.', 'success');
    renderServices();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 6: FAQ MANAGEMENT
// -------------------------------------------------------------
async function renderFaq() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/faq');
    const faqs = res.faqs || [];

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>إدارة الأسئلة الشائعة</h2>
          <p>إجابات واضحة وموثوقة على أكثر الاستفسارات القانونية تكراراً</p>
        </div>
        <div class="module-header-actions">
          <button onclick="openAddFaqModal()" class="btn btn-gold btn-sm">
            <i class="fa-solid fa-plus"></i>
            <span>إضافة سؤال جديد</span>
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>الترتيب</th>
                <th>السؤال (عربي)</th>
                <th>التصنيف</th>
                <th>مقتطف الجواب</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${faqs.length === 0 ? '<tr><td colspan="6" class="table-empty">لا توجد أسئلة شائعة مضافة بعد</td></tr>' : 
                faqs.map(f => `
                  <tr>
                    <td><strong>${f.display_order}</strong></td>
                    <td><strong style="color:var(--color-primary);">${f.question_ar}</strong></td>
                    <td>${f.category || 'عام'}</td>
                    <td>${truncate(f.answer_ar, 45)}</td>
                    <td>${f.is_active ? '<span class="status-pill status-completed">نشط</span>' : '<span class="status-pill status-draft">معطل</span>'}</td>
                    <td>
                      <div class="table-actions">
                        <button onclick="openEditFaqModal('${f.id}')" class="btn-icon" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteFaq('${f.id}', '${f.question_ar}')" class="btn-icon delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل الأسئلة الشائعة: ${err.message}</div>`;
  }
}

function openAddFaqModal() {
  const bodyHtml = `
    <form id="addFaqForm" onsubmit="event.preventDefault(); submitAddFaq();">
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">نص السؤال بالعربية *</label>
        <input type="text" id="faqQAr" class="form-control" required placeholder="مثال: كيف يتم تحديد أتعاب المحاماة والاستشارات؟">
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">نص الجواب الشافي بالعربية *</label>
        <textarea id="faqAAr" class="form-control" rows="4" required placeholder="كتابة الجواب بأسلوب قانوني رصين وميسر..."></textarea>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:18px;">
        <div class="form-group">
          <label class="form-label">التصنيف</label>
          <input type="text" id="faqCategory" class="form-control" value="عام" placeholder="شركات / عقود / تقاضي">
        </div>
        <div class="form-group">
          <label class="form-label">الترتيب</label>
          <input type="number" id="faqOrder" class="form-control" value="1">
        </div>
        <div class="form-group">
          <label class="form-label">حالة التفعيل</label>
          <select id="faqActive" class="filter-select" style="width:100%;">
            <option value="true">مفعل</option>
            <option value="false">معطل</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
        <button type="submit" class="btn btn-gold btn-sm">حفظ السؤال</button>
      </div>
    </form>
  `;
  openModal('إضافة سؤال شائع جديد', bodyHtml);
}

async function submitAddFaq() {
  const payload = {
    question_ar: document.getElementById('faqQAr').value.trim(),
    answer_ar: document.getElementById('faqAAr').value.trim(),
    category: document.getElementById('faqCategory').value.trim() || 'عام',
    display_order: parseInt(document.getElementById('faqOrder').value) || 1,
    is_active: document.getElementById('faqActive').value === 'true'
  };

  try {
    await api('/api/admin/faq', { method: 'POST', body: JSON.stringify(payload) });
    showToast('تمت إضافة السؤال بنجاح.', 'success');
    closeModal();
    renderFaq();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openEditFaqModal(id) {
  try {
    const res = await api('/api/admin/faq');
    const f = res.faqs.find(item => item.id === id);
    if (!f) return;

    const bodyHtml = `
      <form id="editFaqForm" onsubmit="event.preventDefault(); submitEditFaq('${f.id}');">
        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">نص السؤال بالعربية *</label>
          <input type="text" id="faqEditQAr" class="form-control" required value="${f.question_ar}">
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">نص الجواب *</label>
          <textarea id="faqEditAAr" class="form-control" rows="4" required>${f.answer_ar}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:18px;">
          <div class="form-group">
            <label class="form-label">التصنيف</label>
            <input type="text" id="faqEditCategory" class="form-control" value="${f.category || 'عام'}">
          </div>
          <div class="form-group">
            <label class="form-label">الترتيب</label>
            <input type="number" id="faqEditOrder" class="form-control" value="${f.display_order}">
          </div>
          <div class="form-group">
            <label class="form-label">حالة التفعيل</label>
            <select id="faqEditActive" class="filter-select" style="width:100%;">
              <option value="true" ${f.is_active ? 'selected' : ''}>مفعل</option>
              <option value="false" ${!f.is_active ? 'selected' : ''}>معطل</option>
            </select>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
          <button type="submit" class="btn btn-gold btn-sm">حفظ التعديلات</button>
        </div>
      </form>
    `;
    openModal('تعديل السؤال الشائع', bodyHtml);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitEditFaq(id) {
  const payload = {
    question_ar: document.getElementById('faqEditQAr').value.trim(),
    answer_ar: document.getElementById('faqEditAAr').value.trim(),
    category: document.getElementById('faqEditCategory').value.trim(),
    display_order: parseInt(document.getElementById('faqEditOrder').value) || 1,
    is_active: document.getElementById('faqEditActive').value === 'true'
  };

  try {
    await api(`/api/admin/faq/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('تم تحديث السؤال بنجاح.', 'success');
    closeModal();
    renderFaq();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteFaq(id, q) {
  if (!confirm(`هل أنت متأكد من حذف السؤال "${truncate(q, 30)}"?`)) return;
  try {
    await api(`/api/admin/faq/${id}`, { method: 'DELETE' });
    showToast('تم حذف السؤال بنجاح.', 'success');
    renderFaq();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 7: ARTICLES & BLOG MANAGEMENT
// -------------------------------------------------------------
async function renderArticles() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/articles');
    const articles = res.articles || [];

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>المقالات والأنظمة القانونية</h2>
          <p>إثراء المحتوى القانوني ونشر الدراسات والتحليلات المتخصصة</p>
        </div>
        <div class="module-header-actions">
          <button onclick="openAddArticleModal()" class="btn btn-gold btn-sm">
            <i class="fa-solid fa-plus"></i>
            <span>إضافة مقال جديد</span>
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>العنوان (عربي)</th>
                <th>التصنيف</th>
                <th>الحالة</th>
                <th>تاريخ النشر</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${articles.length === 0 ? '<tr><td colspan="5" class="table-empty">لا توجد مقالات مضافة بعد</td></tr>' : 
                articles.map(a => `
                  <tr>
                    <td><strong style="color:var(--color-primary);">${a.title_ar}</strong></td>
                    <td>${a.category}</td>
                    <td>${a.status === 'published' ? '<span class="status-pill status-published">منشور</span>' : '<span class="status-pill status-draft">مسودة</span>'}</td>
                    <td>${a.published_at ? new Date(a.published_at).toLocaleDateString('ar-SA') : '-'}</td>
                    <td>
                      <div class="table-actions">
                        <button onclick="openEditArticleModal('${a.id}')" class="btn-icon" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteArticle('${a.id}', '${a.title_ar}')" class="btn-icon delete" title="حذف"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل المقالات: ${err.message}</div>`;
  }
}

function openAddArticleModal() {
  const bodyHtml = `
    <form id="addArticleForm" onsubmit="event.preventDefault(); submitAddArticle();">
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">عنوان المقال بالعربية *</label>
        <input type="text" id="artTitleAr" class="form-control" required placeholder="مثال: المستجدات النظامية في نظام الشركات السعودي الحديث">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">التصنيف</label>
          <input type="text" id="artCategory" class="form-control" value="أنظمة وشركات">
        </div>
        <div class="form-group">
          <label class="form-label">حالة النشر</label>
          <select id="artStatus" class="filter-select" style="width:100%;">
            <option value="draft">حفظ كمسودة (مخفي)</option>
            <option value="published">نشر فوري على الموقع</option>
          </select>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">موجز المقال (Excerpt)</label>
        <textarea id="artExcerptAr" class="form-control" rows="2" placeholder="مقدمة قصيرة تظهر في معاينة البطاقات..."></textarea>
      </div>

      <div class="form-group" style="margin-bottom:18px;">
        <label class="form-label">المحتوى الكامل للمقال</label>
        <textarea id="artContentAr" class="form-control" rows="6" placeholder="اكتب نص المقال التحليلي هنا..."></textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
        <button type="submit" class="btn btn-gold btn-sm">حفظ المقال</button>
      </div>
    </form>
  `;
  openModal('إضافة مقال جديد', bodyHtml);
}

async function submitAddArticle() {
  const payload = {
    title_ar: document.getElementById('artTitleAr').value.trim(),
    category: document.getElementById('artCategory').value.trim(),
    status: document.getElementById('artStatus').value,
    excerpt_ar: document.getElementById('artExcerptAr').value.trim(),
    content_ar: document.getElementById('artContentAr').value.trim()
  };

  try {
    await api('/api/admin/articles', { method: 'POST', body: JSON.stringify(payload) });
    showToast('تم حفظ المقال بنجاح.', 'success');
    closeModal();
    renderArticles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openEditArticleModal(id) {
  try {
    const res = await api('/api/admin/articles');
    const a = res.articles.find(item => item.id === id);
    if (!a) return;

    const bodyHtml = `
      <form id="editArticleForm" onsubmit="event.preventDefault(); submitEditArticle('${a.id}');">
        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">عنوان المقال بالعربية *</label>
          <input type="text" id="artEditTitleAr" class="form-control" required value="${a.title_ar}">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label">التصنيف</label>
            <input type="text" id="artEditCategory" class="form-control" value="${a.category || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">حالة النشر</label>
            <select id="artEditStatus" class="filter-select" style="width:100%;">
              <option value="draft" ${a.status === 'draft' ? 'selected' : ''}>مسودة (مخفي)</option>
              <option value="published" ${a.status === 'published' ? 'selected' : ''}>منشور للجمهور</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">موجز المقال</label>
          <textarea id="artEditExcerptAr" class="form-control" rows="2">${a.excerpt_ar || ''}</textarea>
        </div>

        <div class="form-group" style="margin-bottom:18px;">
          <label class="form-label">المحتوى الكامل</label>
          <textarea id="artEditContentAr" class="form-control" rows="6">${a.content_ar || ''}</textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
          <button type="submit" class="btn btn-gold btn-sm">حفظ التعديلات</button>
        </div>
      </form>
    `;
    openModal('تعديل المقال', bodyHtml);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitEditArticle(id) {
  const payload = {
    title_ar: document.getElementById('artEditTitleAr').value.trim(),
    category: document.getElementById('artEditCategory').value.trim(),
    status: document.getElementById('artEditStatus').value,
    excerpt_ar: document.getElementById('artEditExcerptAr').value.trim(),
    content_ar: document.getElementById('artEditContentAr').value.trim()
  };

  try {
    await api(`/api/admin/articles/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('تم تحديث المقال بنجاح.', 'success');
    closeModal();
    renderArticles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteArticle(id, title) {
  if (!confirm(`هل أنت متأكد من حذف مقال "${truncate(title, 30)}"?`)) return;
  try {
    await api(`/api/admin/articles/${id}`, { method: 'DELETE' });
    showToast('تم حذف المقال بنجاح.', 'success');
    renderArticles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 8: MEDIA ASSETS & UPLOAD
// -------------------------------------------------------------
async function renderMedia() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/media');
    const media = res.media || [];

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>مكتبة الوسائط والملفات</h2>
          <p>رفع وإدارة صور وهوية الموقع، المستندات، والملفات القانونية</p>
        </div>
      </div>

      <!-- Upload Zone Card -->
      <div class="admin-card" style="margin-bottom:24px;">
        <div class="admin-card-body" style="text-align:center; padding:36px; border:2px dashed var(--color-gold-border); border-radius:8px; background:#FAF9F5;">
          <i class="fa-solid fa-cloud-arrow-up fa-3x" style="color:var(--color-gold); margin-bottom:12px;"></i>
          <h3 style="font-size:16px; margin-bottom:6px;">رفع ملفات أو صور جديدة</h3>
          <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:18px;">يدعم ملفات الصور (PNG, JPG, SVG, WebP) وملفات PDF بحد أقصى 15 ميجابايت</p>
          
          <input type="file" id="mediaFileInput" style="display:none;" onchange="handleFileUpload(this.files[0])">
          <button onclick="document.getElementById('mediaFileInput').click()" class="btn btn-gold btn-sm">
            <i class="fa-solid fa-file-circle-plus"></i> اختيار ملف من الجهاز
          </button>
        </div>
      </div>

      <!-- Media Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:16px;">
        ${media.length === 0 ? '<div class="table-empty" style="grid-column:1/-1;">لا توجد وسائط مرفوعة بعد. استخدم الزر أعلاه للرفع.</div>' : 
          media.map(m => `
            <div style="background:#FFFFFF; border:1px solid #E5E0D5; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; box-shadow:var(--shadow-sm);">
              <div style="height:120px; background:#F1EFEA; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                ${m.mime_type && m.mime_type.startsWith('image/') ? 
                  `<img src="${m.public_url}" alt="${m.alt_text_ar || ''}" style="width:100%; height:100%; object-fit:cover;">` : 
                  '<i class="fa-solid fa-file-pdf fa-2x" style="color:var(--color-danger);"></i>'}
              </div>
              <div style="padding:10px; font-size:12px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;" title="${m.file_name}">${m.file_name}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                  <button onclick="copyToClipboard('${m.public_url}')" class="btn-text" title="نسخ الرابط"><i class="fa-regular fa-copy"></i> نسخ الرابط</button>
                  <button onclick="deleteMedia('${m.id}', '${m.file_name}')" class="btn-icon delete" style="width:26px; height:26px;" title="حذف"><i class="fa-solid fa-trash" style="font-size:11px;"></i></button>
                </div>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل الوسائط: ${err.message}</div>`;
  }
}

async function handleFileUpload(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('alt_text_ar', file.name);

  showToast('جاري رفع الملف...', 'info');

  try {
    const res = await api('/api/admin/media/upload', {
      method: 'POST',
      body: formData
    });
    if (res.success) {
      showToast('تم رفع الملف بنجاح!', 'success');
      renderMedia();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteMedia(id, name) {
  if (!confirm(`هل أنت متأكد من حذف الملف "${name}"؟`)) return;
  try {
    await api(`/api/admin/media/${id}`, { method: 'DELETE' });
    showToast('تم حذف الملف بنجاح.', 'success');
    renderMedia();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 9: COMPANY SETTINGS & OFFICIAL DATA
// -------------------------------------------------------------
async function renderSettings() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/settings');
    const s = res.settings || {};

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>معلومات الشركة وإعدادات الموقع الرسمية</h2>
          <p>تحديث أرقام التواصل الموحدة، رقم الترخيص المعتمد، وبيانات الترويسة والتذييل</p>
        </div>
        <div class="module-header-actions">
          <button onclick="saveSettings()" class="btn btn-gold btn-sm">
            <i class="fa-solid fa-floppy-disk"></i>
            <span>حفظ الإعدادات والتحديثات</span>
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-body">
          <form id="settingsForm" onsubmit="event.preventDefault(); saveSettings();">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px;">
              <div class="form-group">
                <label class="form-label">الاسم الرسمي للشركة (عربي) *</label>
                <input type="text" id="setCompanyNameAr" class="form-control" value="${s.company_name_ar || 'شركة نافذين للمحاماة والاستشارات القانونية'}">
              </div>
              <div class="form-group">
                <label class="form-label">الاسم بالإنجليزية (English Name)</label>
                <input type="text" id="setCompanyNameEn" class="form-control" value="${s.company_name_en || 'Nafidhayn Law Firm'}">
              </div>

              <div class="form-group">
                <label class="form-label">رقم الجوال المباشر (المحلي) *</label>
                <input type="text" id="setPhone" class="form-control" value="${s.phone || '055 978 7755'}">
              </div>
              <div class="form-group">
                <label class="form-label">رقم التواصل بالصيغة الدولية *</label>
                <input type="text" id="setPhoneIntl" class="form-control" value="${s.phone_intl || '+966559787755'}">
              </div>

              <div class="form-group">
                <label class="form-label">رقم الواتساب الرسمي *</label>
                <input type="text" id="setWhatsapp" class="form-control" value="${s.whatsapp || '055 978 7755'}">
              </div>
              <div class="form-group">
                <label class="form-label">البريد الإلكتروني المهني *</label>
                <input type="email" id="setEmail" class="form-control" value="${s.email || 'Nafidhayn.sa@gmail.com'}">
              </div>

              <div class="form-group">
                <label class="form-label">رقم الترخيص المهني المعتمد *</label>
                <input type="text" id="setLicenseNum" class="form-control" value="${s.license_number || '44435'}">
              </div>
              <div class="form-group">
                <label class="form-label">صيغة عرض الترخيص *</label>
                <input type="text" id="setLicenseLabel" class="form-control" value="${s.license_label_ar || 'رقم الترخيص: 44435'}">
              </div>

              <div class="form-group">
                <label class="form-label">العنوان والمقر الرئيسي</label>
                <input type="text" id="setAddressAr" class="form-control" value="${s.address_ar || 'الرياض، المملكة العربية السعودية'}">
              </div>
              <div class="form-group">
                <label class="form-label">ساعات العمل الرسمية</label>
                <input type="text" id="setHoursAr" class="form-control" value="${s.working_hours_ar || 'الأحد – الخميس: 9:00 ص – 5:00 م'}">
              </div>
            </div>

            <div class="form-group" style="margin-bottom:18px;">
              <label class="form-label">نبذة التذييل (Footer Text) بالعربية</label>
              <textarea id="setFooterDescAr" class="form-control" rows="3">${s.footer_desc_ar || ''}</textarea>
            </div>
          </form>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل الإعدادات: ${err.message}</div>`;
  }
}

async function saveSettings() {
  const payload = {
    company_name_ar: document.getElementById('setCompanyNameAr').value.trim(),
    company_name_en: document.getElementById('setCompanyNameEn').value.trim(),
    phone: document.getElementById('setPhone').value.trim(),
    phone_intl: document.getElementById('setPhoneIntl').value.trim(),
    whatsapp: document.getElementById('setWhatsapp').value.trim(),
    email: document.getElementById('setEmail').value.trim(),
    license_number: document.getElementById('setLicenseNum').value.trim(),
    license_label_ar: document.getElementById('setLicenseLabel').value.trim(),
    address_ar: document.getElementById('setAddressAr').value.trim(),
    working_hours_ar: document.getElementById('setHoursAr').value.trim(),
    footer_desc_ar: document.getElementById('setFooterDescAr').value.trim()
  };

  try {
    await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) });
    showToast('تم حفظ إعدادات الشركة بنجاح وتحديث الموقع العام!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 10: USERS & RBAC MANAGEMENT
// -------------------------------------------------------------
async function renderUsers() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/users');
    const users = res.users || [];

    const roleNames = {
      owner: 'المالك والمشرف العام',
      admin: 'مدير النظام',
      editor: 'محرر محتوى',
      receptionist: 'استقبال وتنسيق'
    };

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>فريق العمل وصلاحيات النظام (RBAC)</h2>
          <p>إدارة حسابات منسوبي الشركة وتحديد أدوار الدخول والتحكم</p>
        </div>
        <div class="module-header-actions">
          <button onclick="openAddUserModal()" class="btn btn-gold btn-sm">
            <i class="fa-solid fa-user-plus"></i>
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>الاسم الكامل</th>
                <th>البريد الإلكتروني</th>
                <th>الصلاحية / الدور</th>
                <th>الجوال</th>
                <th>الحالة</th>
                <th>آخر تسجيل دخول</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong style="color:var(--color-primary);">${u.full_name}</strong></td>
                  <td>${u.email}</td>
                  <td><span class="status-pill status-in_progress">${roleNames[u.role] || u.role}</span></td>
                  <td>${u.phone || '-'}</td>
                  <td>${u.is_active ? '<span class="status-pill status-completed">نشط</span>' : '<span class="status-pill status-draft">معطل</span>'}</td>
                  <td>${u.last_login_at ? new Date(u.last_login_at).toLocaleString('ar-SA') : 'لم يدخل بعد'}</td>
                  <td>
                    <div class="table-actions">
                      <button onclick="openEditUserModal('${u.id}')" class="btn-icon" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                      ${u.role !== 'owner' ? `<button onclick="deleteUser('${u.id}', '${u.full_name}')" class="btn-icon delete" title="حذف"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل المستخدمين: ${err.message}</div>`;
  }
}

function openAddUserModal() {
  const bodyHtml = `
    <form id="addUserForm" onsubmit="event.preventDefault(); submitAddUser();">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">الاسم الكامل *</label>
          <input type="text" id="usrFullName" class="form-control" required placeholder="مثال: تركي السعد">
        </div>
        <div class="form-group">
          <label class="form-label">البريد الإلكتروني المهني *</label>
          <input type="email" id="usrEmail" class="form-control" required placeholder="user@nafidhayn.sa">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">كلمة المرور الأولية *</label>
          <input type="password" id="usrPassword" class="form-control" required placeholder="••••••••••••">
        </div>
        <div class="form-group">
          <label class="form-label">الدور والصلاحية *</label>
          <select id="usrRole" class="filter-select" style="width:100%;">
            <option value="receptionist">استقبال وتنسيق (إدارة الطلبات والاستفسارات)</option>
            <option value="editor">محرر محتوى (تعديل المقالات والأقسام والخدمات)</option>
            <option value="admin">مدير نظام (كامل الصلاحيات عدا حذف المالك)</option>
          </select>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:18px;">
        <label class="form-label">رقم الجوال للتواصل الداخلي</label>
        <input type="text" id="usrPhone" class="form-control" placeholder="05xxxxxxxx">
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
        <button type="submit" class="btn btn-gold btn-sm">إضافة المستخدم</button>
      </div>
    </form>
  `;
  openModal('إضافة مستخدم جديد للنظام', bodyHtml);
}

async function submitAddUser() {
  const payload = {
    full_name: document.getElementById('usrFullName').value.trim(),
    email: document.getElementById('usrEmail').value.trim(),
    password: document.getElementById('usrPassword').value,
    role: document.getElementById('usrRole').value,
    phone: document.getElementById('usrPhone').value.trim()
  };

  try {
    await api('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });
    showToast('تمت إضافة المستخدم بنجاح.', 'success');
    closeModal();
    renderUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openEditUserModal(id) {
  try {
    const res = await api('/api/admin/users');
    const u = res.users.find(item => item.id === id);
    if (!u) return;

    const bodyHtml = `
      <form id="editUserForm" onsubmit="event.preventDefault(); submitEditUser('${u.id}');">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label">الاسم الكامل *</label>
            <input type="text" id="usrEditFullName" class="form-control" required value="${u.full_name}">
          </div>
          <div class="form-group">
            <label class="form-label">البريد الإلكتروني (غير قابل للتعديل)</label>
            <input type="email" class="form-control" value="${u.email}" disabled>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label">الدور / الصلاحية</label>
            <select id="usrEditRole" class="filter-select" style="width:100%;" ${u.role === 'owner' ? 'disabled' : ''}>
              <option value="owner" ${u.role === 'owner' ? 'selected' : ''}>المالك والمشرف العام</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>مدير نظام</option>
              <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>محرر محتوى</option>
              <option value="receptionist" ${u.role === 'receptionist' ? 'selected' : ''}>استقبال وتنسيق</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">حالة الحساب</label>
            <select id="usrEditActive" class="filter-select" style="width:100%;" ${u.role === 'owner' ? 'disabled' : ''}>
              <option value="true" ${u.is_active ? 'selected' : ''}>نشط</option>
              <option value="false" ${!u.is_active ? 'selected' : ''}>معطل</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية)</label>
          <input type="password" id="usrEditPassword" class="form-control" placeholder="••••••••••••">
        </div>

        <div class="form-group" style="margin-bottom:18px;">
          <label class="form-label">رقم الجوال</label>
          <input type="text" id="usrEditPhone" class="form-control" value="${u.phone || ''}">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" onclick="closeModal()" class="btn btn-outline-gold btn-sm">إلغاء</button>
          <button type="submit" class="btn btn-gold btn-sm">حفظ التعديلات</button>
        </div>
      </form>
    `;
    openModal(`تعديل بيانات المستخدم: ${u.full_name}`, bodyHtml);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitEditUser(id) {
  const payload = {
    full_name: document.getElementById('usrEditFullName').value.trim(),
    role: document.getElementById('usrEditRole').value,
    is_active: document.getElementById('usrEditActive').value === 'true',
    phone: document.getElementById('usrEditPhone').value.trim()
  };

  const newPass = document.getElementById('usrEditPassword').value;
  if (newPass) payload.password = newPass;

  try {
    await api(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('تم تحديث المستخدم بنجاح.', 'success');
    closeModal();
    renderUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(id, name) {
  if (!confirm(`هل أنت متأكد من رغبتك في حذف حساب المستخدم "${name}" نهائياً؟`)) return;
  try {
    await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    showToast('تم حذف المستخدم بنجاح.', 'success');
    renderUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MODULE 11: AUDIT LOGS & ACTIVITY
// -------------------------------------------------------------
async function renderActivity() {
  const container = document.getElementById('adminContent');
  try {
    const res = await api('/api/admin/activity');
    const logs = res.logs || [];

    const actionLabels = {
      admin_login_success: 'تسجيل دخول ناجح',
      admin_logout: 'تسجيل خروج',
      public_inquiry_created: 'استلام استفسار عبر الموقع',
      public_consultation_created: 'استلام طلب استشارة جديد',
      inquiry_status_updated: 'تحديث حالة استفسار',
      consultation_status_updated: 'تحديث حالة استشارة',
      section_draft_saved: 'حفظ مسودة قسم',
      section_published: 'نشر تعديلات قسم للموقع',
      section_revision_restored: 'استرجاع نسخة سابقة',
      service_created: 'إضافة خدمة قانونية',
      service_updated: 'تحديث خدمة قانونية',
      service_deleted: 'حذف خدمة قانونية',
      settings_updated: 'تحديث إعدادات الشركة',
      user_created: 'إنشاء مستخدم جديد',
      user_updated: 'تحديث بيانات مستخدم',
      media_uploaded: 'رفع ملف وسائط'
    };

    container.innerHTML = `
      <div class="module-header">
        <div class="module-header-info">
          <h2>سجل العمليات والتدقيق الإداري (Audit Trail)</h2>
          <p>توثيق زمني غير قابل للتعديل لجميع العمليات الإدارية لضمان الحوكمة والامتثال</p>
        </div>
      </div>

      <div class="admin-card">
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>التاريخ والوقت</th>
                <th>نوع الإجراء</th>
                <th>المستخدم المسؤول</th>
                <th>الكيان المرتبط</th>
                <th>عنوان IP</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? '<tr><td colspan="5" class="table-empty">لا توجد عمليات مسجلة بعد</td></tr>' : 
                logs.map(l => `
                  <tr>
                    <td><strong style="color:var(--color-primary);">${new Date(l.created_at).toLocaleString('ar-SA')}</strong></td>
                    <td><span class="status-pill status-in_progress">${actionLabels[l.action] || l.action}</span></td>
                    <td>${l.performed_by_email || 'نظام الموقع'}</td>
                    <td>${l.entity_type || '-'} (${truncate(l.entity_id || '', 12)})</td>
                    <td dir="ltr" style="font-family:monospace; font-size:12px;">${l.ip_address || '-'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="admin-alert error">فشل تحميل سجل التدقيق: ${err.message}</div>`;
  }
}

// -------------------------------------------------------------
// HELPER UTILITIES
// -------------------------------------------------------------
function getStatusLabel(status) {
  const map = {
    new: 'جديد',
    in_progress: 'قيد المعالجة',
    under_review: 'قيد الفحص',
    responded: 'تم الرد',
    contacted: 'تم التواصل',
    scheduled: 'موعد معتمد',
    completed: 'مكتمل',
    closed: 'مغلق',
    cancelled: 'ملغي / اعتذار',
    archived: 'مؤرشف',
    draft: 'مسودة',
    published: 'منشور'
  };
  return map[status] || status;
}

function truncate(str, max = 30) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('تم نسخ الرابط إلى الحافظة!', 'success');
  }).catch(() => {
    prompt('انسخ الرابط يدوياً:', text);
  });
}

// Global initialization
window.addEventListener('DOMContentLoaded', initAuth);
