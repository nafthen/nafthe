/**
 * Nafidhayn Law Firm (شركة نافذين للمحاماة والاستشارات القانونية)
 * Full-Stack Production Server & REST API
 * Integrated with Supabase PostgreSQL, Authentication, CMS & Client Requests
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bqgqtirfyquxwfbbtwbi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Cd-b1wYzCNIEfoZvwmMUHw_Rrke6lBK';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'nafidhayn_luxury_legal_jwt_secret_2026_super_secure_key';

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  });
} catch (e) {
  console.error('Supabase init error:', e.message);
}

// Multer storage for media uploads (safe for Vercel read-only serverless environment)
const isServerless = Boolean(process.env.VERCEL);
const uploadDir = isServerless ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem warning handled gracefully
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// -------------------------------------------------------------
// JWT Token Helper (HMAC SHA-256 Stateless Tokens)
// -------------------------------------------------------------
function signToken(payload, expiresInSeconds = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data = { ...payload, exp };
  
  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Data = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${b64Header}.${b64Data}`).digest('base64url');
  return `${b64Header}.${b64Data}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [b64Header, b64Data, signature] = parts;
  
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${b64Header}.${b64Data}`).digest('base64url');
  if (signature !== expectedSig) return null;
  
  try {
    const payload = JSON.parse(Buffer.from(b64Data, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// Authentication & RBAC Middleware
// -------------------------------------------------------------
function requireAdmin(allowedRoles = []) {
  return async (req, res, next) => {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.nafidhayn_admin_token) {
      token = req.cookies.nafidhayn_admin_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'غير مصرح بالدخول، يرجى تسجيل الدخول أولاً.' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.' });
    }

    // Role verification
    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role) && payload.role !== 'owner') {
      return res.status(403).json({ success: false, error: 'ليس لديك الصلاحية الكافية للقيام بهذا الإجراء.' });
    }

    req.admin = payload;
    next();
  };
}

// Helper: Log Admin Audit Action
async function logAudit(action, entityType, entityId, performedBy, details = {}, ip = '') {
  try {
    await supabase.from('audit_logs').insert([{
      action,
      entity_type: entityType,
      entity_id: String(entityId || ''),
      performed_by: performedBy?.id || null,
      performed_by_email: performedBy?.email || 'system',
      details,
      ip_address: ip
    }]);
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
}

// -------------------------------------------------------------
// PUBLIC API ENDPOINTS
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    project: 'Nafidhayn Law Firm CMS',
    timestamp: new Date().toISOString()
  });
});

// 2. Public Settings
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'general').single();
    if (error) throw error;
    res.json({ success: true, settings: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Public Legal Services
app.get('/api/services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('legal_services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, services: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Public FAQ
app.get('/api/faq', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, faqs: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Consolidated Published Content (Hydrates entire public website in 1 call)
app.get('/api/content/published', async (req, res) => {
  try {
    const [settingsRes, sectionsRes, servicesRes, faqRes, articlesRes] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 'general').single(),
      supabase.from('site_sections').select('*').eq('is_published', true).eq('is_visible', true).order('display_order', { ascending: true }),
      supabase.from('legal_services').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      supabase.from('faq_items').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      supabase.from('articles').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(6)
    ]);

    res.json({
      success: true,
      data: {
        settings: settingsRes.data || {},
        sections: sectionsRes.data || [],
        services: servicesRes.data || [],
        faqs: faqRes.data || [],
        articles: articlesRes.data || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Public Contact Inquiry Submission
app.post('/api/inquiries', async (req, res) => {
  try {
    const { full_name, phone, email, subject, message, honeypot } = req.body;
    
    // Anti-spam honeypot
    if (honeypot) {
      return res.status(400).json({ success: false, error: 'تم اكتشاف نشاط غير مصرح به.' });
    }

    if (!full_name || !phone || !message) {
      return res.status(400).json({ success: false, error: 'يرجى تعبئة جميع الحقول الإلزامية (الاسم، رقم الجوال، الرسالة).' });
    }

    // Reference number generator (e.g. INQ-26-8492)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ref_number = `INQ-26-${randomSuffix}`;

    const newInquiry = {
      ref_number,
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      subject: subject ? subject.trim() : 'استفسار عام عبر الموقع',
      message: message.trim(),
      privacy_accepted: true,
      status: 'new',
      source: 'website_contact_form',
      ip_address: req.ip || req.headers['x-forwarded-for'] || '',
      user_agent: req.headers['user-agent'] || ''
    };

    const { data, error } = await supabase.from('inquiries').insert([newInquiry]).select().single();
    if (error) throw error;

    // Create staff notification
    await supabase.from('admin_notifications').insert([{
      title_ar: 'استفسار جديد عبر الموقع',
      title_en: 'New Website Inquiry',
      message_ar: `ورد استفسار جديد برقم ${ref_number} من ${full_name}`,
      message_en: `New inquiry ${ref_number} from ${full_name}`,
      category: 'inquiry',
      reference_id: data.id,
      is_read: false
    }]);

    await logAudit('public_inquiry_created', 'inquiry', data.id, null, { ref_number, full_name }, req.ip);

    res.json({
      success: true,
      ref_number,
      message: 'تم استلام استفساركم بنجاح وسيتواصل معكم فريق العمل في أقرب وقت.'
    });
  } catch (err) {
    console.error('Inquiry Submission Error:', err);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء إرسال الاستفسار، يرجى المحاولة لاحقاً.' });
  }
});

// 7. Public Consultation Request Submission
app.post('/api/consultations', async (req, res) => {
  try {
    const {
      client_type,
      client_name,
      phone,
      email,
      service_requested,
      summary,
      preferred_date,
      preferred_time,
      preferred_channel,
      conflict_check_confirmed,
      honeypot
    } = req.body;

    // Anti-spam honeypot
    if (honeypot) {
      return res.status(400).json({ success: false, error: 'تم اكتشاف نشاط غير مصرح به.' });
    }

    if (!client_name || !phone || !summary) {
      return res.status(400).json({ success: false, error: 'يرجى تعبئة الحقول الأساسية (الاسم، رقم التواصل، موجز الموضوع القانوني).' });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ref_number = `CNS-26-${randomSuffix}`;

    const newRequest = {
      ref_number,
      client_type: client_type || 'individual',
      client_name: client_name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      service_requested: service_requested || 'استشارة عامة',
      summary: summary.trim(),
      preferred_date: preferred_date || null,
      preferred_time: preferred_time || 'morning',
      preferred_channel: preferred_channel || 'office',
      conflict_check_confirmed: Boolean(conflict_check_confirmed),
      status: 'new'
    };

    const { data, error } = await supabase.from('consultation_requests').insert([newRequest]).select().single();
    if (error) throw error;

    // Create staff notification
    await supabase.from('admin_notifications').insert([{
      title_ar: 'طلب استشارة قانونية جديد',
      title_en: 'New Consultation Request',
      message_ar: `ورد طلب استشارة جديد برقم ${ref_number} من ${client_name} (${service_requested || 'عامة'})`,
      message_en: `New consultation request ${ref_number} from ${client_name}`,
      category: 'consultation',
      reference_id: data.id,
      is_read: false
    }]);

    await logAudit('public_consultation_created', 'consultation', data.id, null, { ref_number, client_name, service_requested }, req.ip);

    res.json({
      success: true,
      ref_number,
      message: 'تم استلام طلب الاستشارة القانونية بنجاح. سيتم فحص الطلب والتحقق من عدم تعارض المصالح ثم التواصل معكم لتأكيد الموعد النهائي.'
    });
  } catch (err) {
    console.error('Consultation Submission Error:', err);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء إرسال طلب الاستشارة، يرجى المحاولة لاحقاً.' });
  }
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
    }

    const { data: user, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'هذا الحساب معطل حالياً. يرجى مراجعة إدارة النظام.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    };
    const token = signToken(tokenPayload, 86400 * 7); // 7 days

    // Update last login
    await supabase.from('admin_profiles').update({
      last_login_at: new Date().toISOString()
    }).eq('id', user.id);

    // Audit log
    await logAudit('admin_login_success', 'admin_profile', user.id, tokenPayload, {}, req.ip);

    // Set cookie
    res.cookie('nafidhayn_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ success: false, error: 'حدث خطأ في الخادم أثناء تسجيل الدخول.' });
  }
});

// Admin Logout
app.post('/api/admin/logout', requireAdmin(), async (req, res) => {
  await logAudit('admin_logout', 'admin_profile', req.admin.id, req.admin, {}, req.ip);
  res.clearCookie('nafidhayn_admin_token');
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
});

// Admin Current User
app.get('/api/admin/me', requireAdmin(), async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('admin_profiles')
      .select('id, full_name, email, role, phone, is_active, last_login_at')
      .eq('id', req.admin.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN DASHBOARD MODULES ENDPOINTS
// -------------------------------------------------------------

// 1. Dashboard Overview Stats
app.get('/api/admin/stats', requireAdmin(), async (req, res) => {
  try {
    const [
      inquiriesTotal,
      inquiriesNew,
      consultationsTotal,
      consultationsNew,
      servicesCount,
      articlesCount,
      faqCount,
      recentInquiries,
      recentConsultations,
      notifications
    ] = await Promise.all([
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('consultation_requests').select('*', { count: 'exact', head: true }),
      supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('legal_services').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('faq_items').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('inquiries').select('id, ref_number, full_name, phone, subject, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('consultation_requests').select('id, ref_number, client_name, phone, service_requested, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('admin_notifications').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(10)
    ]);

    res.json({
      success: true,
      stats: {
        inquiries: {
          total: inquiriesTotal.count || 0,
          new: inquiriesNew.count || 0
        },
        consultations: {
          total: consultationsTotal.count || 0,
          new: consultationsNew.count || 0
        },
        services: servicesCount.count || 0,
        articles: articlesCount.count || 0,
        faqs: faqCount.count || 0,
        unreadNotifications: notifications.data ? notifications.data.length : 0
      },
      recentInquiries: recentInquiries.data || [],
      recentConsultations: recentConsultations.data || [],
      notifications: notifications.data || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Inquiries Management
app.get('/api/admin/inquiries', requireAdmin(), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let query = supabase.from('inquiries').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,ref_number.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    res.json({ success: true, inquiries: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/inquiries/:id', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: inquiry, error } = await supabase.from('inquiries').select('*').eq('id', id).single();
    if (error) throw error;

    const { data: notes } = await supabase
      .from('request_internal_notes')
      .select('*')
      .eq('request_type', 'inquiry')
      .eq('request_id', id)
      .order('created_at', { ascending: false });

    res.json({ success: true, inquiry, notes: notes || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/inquiries/:id/status', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'in_progress', 'responded', 'closed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'حالة غير صالحة.' });
    }

    const { data, error } = await supabase
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logAudit('inquiry_status_updated', 'inquiry', id, req.admin, { new_status: status }, req.ip);

    res.json({ success: true, inquiry: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/inquiries/:id/notes', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, error: 'يرجى كتابة نص الملاحظة.' });
    }

    const { data, error } = await supabase.from('request_internal_notes').insert([{
      request_type: 'inquiry',
      request_id: id,
      author_id: req.admin.id,
      author_name: req.admin.fullName || req.admin.email,
      note: note.trim()
    }]).select().single();

    if (error) throw error;
    await logAudit('inquiry_note_added', 'inquiry', id, req.admin, { note_id: data.id }, req.ip);

    res.json({ success: true, note: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/inquiries/export/csv', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    let csv = '\uFEFF'; // UTF-8 BOM for Arabic Excel support
    csv += 'رقم المرجع,الاسم الكامل,رقم الجوال,البريد الإلكتروني,الموضوع,الحالة,تاريخ الاستلام\n';
    data.forEach(item => {
      const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
      csv += [
        escape(item.ref_number),
        escape(item.full_name),
        escape(item.phone),
        escape(item.email),
        escape(item.subject),
        escape(item.status),
        escape(new Date(item.created_at).toLocaleString('ar-SA'))
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=nafidhayn_inquiries.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Consultations Management
app.get('/api/admin/consultations', requireAdmin(), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let query = supabase.from('consultation_requests').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`client_name.ilike.%${search}%,phone.ilike.%${search}%,ref_number.ilike.%${search}%,service_requested.ilike.%${search}%`);
    }

    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    res.json({ success: true, consultations: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/consultations/:id', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: consultation, error } = await supabase.from('consultation_requests').select('*').eq('id', id).single();
    if (error) throw error;

    const { data: notes } = await supabase
      .from('request_internal_notes')
      .select('*')
      .eq('request_type', 'consultation')
      .eq('request_id', id)
      .order('created_at', { ascending: false });

    res.json({ success: true, consultation, notes: notes || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/consultations/:id/status', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, confirmed_appointment_at } = req.body;
    const validStatuses = ['new', 'under_review', 'contacted', 'scheduled', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'حالة غير صالحة.' });
    }

    const updateData = { status, updated_at: new Date().toISOString() };
    if (confirmed_appointment_at) {
      updateData.confirmed_appointment_at = confirmed_appointment_at;
    }

    const { data, error } = await supabase
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logAudit('consultation_status_updated', 'consultation', id, req.admin, { new_status: status }, req.ip);

    res.json({ success: true, consultation: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/consultations/:id/notes', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, error: 'يرجى كتابة نص الملاحظة.' });
    }

    const { data, error } = await supabase.from('request_internal_notes').insert([{
      request_type: 'consultation',
      request_id: id,
      author_id: req.admin.id,
      author_name: req.admin.fullName || req.admin.email,
      note: note.trim()
    }]).select().single();

    if (error) throw error;
    await logAudit('consultation_note_added', 'consultation', id, req.admin, { note_id: data.id }, req.ip);

    res.json({ success: true, note: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/consultations/export/csv', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('consultation_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    let csv = '\uFEFF';
    csv += 'رقم المرجع,اسم العميل,نوع العميل,الجوال,البريد,الخدمة المطلوبة,تاريخ مفضل,الحالة,تاريخ الطلب\n';
    data.forEach(item => {
      const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
      csv += [
        escape(item.ref_number),
        escape(item.client_name),
        escape(item.client_type === 'corporate' ? 'شركة / كيان' : 'فرد'),
        escape(item.phone),
        escape(item.email),
        escape(item.service_requested),
        escape(item.preferred_date || '-'),
        escape(item.status),
        escape(new Date(item.created_at).toLocaleString('ar-SA'))
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=nafidhayn_consultations.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. CMS / Site Sections Management
app.get('/api/admin/content/sections', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_sections').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, sections: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/content/sections/:id', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('site_sections').select('*').eq('id', id).single();
    if (error) throw error;
    res.json({ success: true, section: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Section Draft (Does NOT alter public live content)
app.put('/api/admin/content/sections/:id/draft', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title_ar, title_en, subtitle_ar, subtitle_en, draft_content_ar, draft_content_en, is_visible } = req.body;

    const updateFields = {
      updated_at: new Date().toISOString()
    };
    if (title_ar !== undefined) updateFields.title_ar = title_ar;
    if (title_en !== undefined) updateFields.title_en = title_en;
    if (subtitle_ar !== undefined) updateFields.subtitle_ar = subtitle_ar;
    if (subtitle_en !== undefined) updateFields.subtitle_en = subtitle_en;
    if (draft_content_ar !== undefined) updateFields.draft_content_ar = draft_content_ar;
    if (draft_content_en !== undefined) updateFields.draft_content_en = draft_content_en;
    if (is_visible !== undefined) updateFields.is_visible = is_visible;

    const { data, error } = await supabase
      .from('site_sections')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logAudit('section_draft_saved', 'site_section', id, req.admin, { section_id: id }, req.ip);

    res.json({ success: true, section: data, message: 'تم حفظ المسودة بنجاح (الموقع العام لم يتأثر بعد).' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Publish Section (Promotes draft to live content and records revision)
app.post('/api/admin/content/sections/:id/publish', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: section, error: fetchErr } = await supabase.from('site_sections').select('*').eq('id', id).single();
    if (fetchErr || !section) throw fetchErr || new Error('القسم غير موجود');

    const published_at = new Date().toISOString();
    const liveContentAr = section.draft_content_ar || section.content_ar;
    const liveContentEn = section.draft_content_en || section.content_en;

    // Record revision before publishing
    await supabase.from('page_revisions').insert([{
      section_or_page_id: section.id,
      revision_type: 'section',
      content_snapshot: {
        title_ar: section.title_ar,
        title_en: section.title_en,
        subtitle_ar: section.subtitle_ar,
        subtitle_en: section.subtitle_en,
        content_ar: liveContentAr,
        content_en: liveContentEn
      },
      created_by: req.admin.id,
      creator_name: req.admin.fullName || req.admin.email,
      change_summary: 'نشر تحديثات القسم من لوحة التحكم'
    }]);

    const { data, error } = await supabase
      .from('site_sections')
      .update({
        content_ar: liveContentAr,
        content_en: liveContentEn,
        is_published: true,
        published_at,
        updated_at: published_at
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logAudit('section_published', 'site_section', id, req.admin, { section_key: section.section_key }, req.ip);

    res.json({ success: true, section: data, message: 'تم نشر التعديلات بنجاح وأصبحت مباشرة على الموقع العام!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Section Revisions
app.get('/api/admin/content/sections/:id/revisions', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: section } = await supabase.from('site_sections').select('section_key').eq('id', id).single();
    if (!section) return res.status(404).json({ success: false, error: 'القسم غير موجود' });

    const { data, error } = await supabase
      .from('page_revisions')
      .select('*')
      .eq('section_or_page_id', section.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, revisions: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore Section Revision
app.post('/api/admin/content/sections/:id/restore/:revId', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { id, revId } = req.params;
    const { data: rev, error: revErr } = await supabase.from('page_revisions').select('*').eq('id', revId).single();
    if (revErr || !rev) throw revErr || new Error('النسخة غير موجودة');

    const snap = rev.content_snapshot || {};
    const { data, error } = await supabase
      .from('site_sections')
      .update({
        title_ar: snap.title_ar,
        title_en: snap.title_en,
        subtitle_ar: snap.subtitle_ar,
        subtitle_en: snap.subtitle_en,
        content_ar: snap.content_ar,
        content_en: snap.content_en,
        draft_content_ar: snap.content_ar,
        draft_content_en: snap.content_en,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logAudit('section_revision_restored', 'site_section', id, req.admin, { revision_id: revId }, req.ip);

    res.json({ success: true, section: data, message: 'تم استرجاع النسخة السابقة ونشرها بنجاح.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Legal Services CRUD
app.get('/api/admin/services', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('legal_services').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, services: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/services', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { title_ar, title_en, slug, short_desc_ar, short_desc_en, full_content_ar, full_content_en, icon_svg, display_order, is_active } = req.body;
    if (!title_ar) return res.status(400).json({ success: false, error: 'اسم الخدمة بالعربية مطلوب.' });

    const newSlug = slug || title_ar.trim().toLowerCase().replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '-');
    const { data, error } = await supabase.from('legal_services').insert([{
      slug: newSlug,
      title_ar,
      title_en: title_en || '',
      short_desc_ar: short_desc_ar || '',
      short_desc_en: short_desc_en || '',
      full_content_ar: full_content_ar || '',
      full_content_en: full_content_en || '',
      icon_svg: icon_svg || 'briefcase',
      display_order: display_order || 99,
      is_active: is_active !== undefined ? is_active : true
    }]).select().single();

    if (error) throw error;
    await logAudit('service_created', 'legal_service', data.id, req.admin, { title_ar }, req.ip);

    res.json({ success: true, service: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/services/:id', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title_ar, title_en, slug, short_desc_ar, short_desc_en, full_content_ar, full_content_en, icon_svg, display_order, is_active } = req.body;

    const updateFields = { updated_at: new Date().toISOString() };
    if (title_ar !== undefined) updateFields.title_ar = title_ar;
    if (title_en !== undefined) updateFields.title_en = title_en;
    if (slug !== undefined) updateFields.slug = slug;
    if (short_desc_ar !== undefined) updateFields.short_desc_ar = short_desc_ar;
    if (short_desc_en !== undefined) updateFields.short_desc_en = short_desc_en;
    if (full_content_ar !== undefined) updateFields.full_content_ar = full_content_ar;
    if (full_content_en !== undefined) updateFields.full_content_en = full_content_en;
    if (icon_svg !== undefined) updateFields.icon_svg = icon_svg;
    if (display_order !== undefined) updateFields.display_order = display_order;
    if (is_active !== undefined) updateFields.is_active = is_active;

    const { data, error } = await supabase.from('legal_services').update(updateFields).eq('id', id).select().single();
    if (error) throw error;
    await logAudit('service_updated', 'legal_service', id, req.admin, { title_ar }, req.ip);

    res.json({ success: true, service: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/services/:id', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('legal_services').delete().eq('id', id);
    if (error) throw error;
    await logAudit('service_deleted', 'legal_service', id, req.admin, {}, req.ip);

    res.json({ success: true, message: 'تم حذف الخدمة بنجاح.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. FAQ CRUD
app.get('/api/admin/faq', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('faq_items').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, faqs: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/faq', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { question_ar, question_en, answer_ar, answer_en, category, display_order, is_active } = req.body;
    if (!question_ar || !answer_ar) return res.status(400).json({ success: false, error: 'السؤال والجواب بالعربية مطلوبان.' });

    const { data, error } = await supabase.from('faq_items').insert([{
      question_ar,
      question_en: question_en || '',
      answer_ar,
      answer_en: answer_en || '',
      category: category || 'general',
      display_order: display_order || 99,
      is_active: is_active !== undefined ? is_active : true
    }]).select().single();

    if (error) throw error;
    await logAudit('faq_created', 'faq_item', data.id, req.admin, { question_ar }, req.ip);

    res.json({ success: true, faq: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/faq/:id', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { question_ar, question_en, answer_ar, answer_en, category, display_order, is_active } = req.body;

    const updateFields = { updated_at: new Date().toISOString() };
    if (question_ar !== undefined) updateFields.question_ar = question_ar;
    if (question_en !== undefined) updateFields.question_en = question_en;
    if (answer_ar !== undefined) updateFields.answer_ar = answer_ar;
    if (answer_en !== undefined) updateFields.answer_en = answer_en;
    if (category !== undefined) updateFields.category = category;
    if (display_order !== undefined) updateFields.display_order = display_order;
    if (is_active !== undefined) updateFields.is_active = is_active;

    const { data, error } = await supabase.from('faq_items').update(updateFields).eq('id', id).select().single();
    if (error) throw error;
    await logAudit('faq_updated', 'faq_item', id, req.admin, { question_ar }, req.ip);

    res.json({ success: true, faq: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/faq/:id', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('faq_items').delete().eq('id', id);
    if (error) throw error;
    await logAudit('faq_deleted', 'faq_item', id, req.admin, {}, req.ip);

    res.json({ success: true, message: 'تم حذف السؤال بنجاح.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Articles CRUD
app.get('/api/admin/articles', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, articles: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/articles', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { title_ar, title_en, slug, excerpt_ar, excerpt_en, content_ar, content_en, status, category, featured_image_url } = req.body;
    if (!title_ar) return res.status(400).json({ success: false, error: 'عنوان المقال بالعربية مطلوب.' });

    const newSlug = slug || title_ar.trim().toLowerCase().replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '-');
    const { data, error } = await supabase.from('articles').insert([{
      slug: newSlug,
      title_ar,
      title_en: title_en || '',
      excerpt_ar: excerpt_ar || '',
      excerpt_en: excerpt_en || '',
      content_ar: content_ar || '',
      content_en: content_en || '',
      category: category || 'قضايا ونظام',
      featured_image_url: featured_image_url || null,
      status: status || 'draft',
      author_id: req.admin.id,
      published_at: status === 'published' ? new Date().toISOString() : null
    }]).select().single();

    if (error) throw error;
    await logAudit('article_created', 'article', data.id, req.admin, { title_ar, status }, req.ip);

    res.json({ success: true, article: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/articles/:id', requireAdmin(['owner', 'admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title_ar, title_en, slug, excerpt_ar, excerpt_en, content_ar, content_en, status, category, featured_image_url } = req.body;

    const updateFields = { updated_at: new Date().toISOString() };
    if (title_ar !== undefined) updateFields.title_ar = title_ar;
    if (title_en !== undefined) updateFields.title_en = title_en;
    if (slug !== undefined) updateFields.slug = slug;
    if (excerpt_ar !== undefined) updateFields.excerpt_ar = excerpt_ar;
    if (excerpt_en !== undefined) updateFields.excerpt_en = excerpt_en;
    if (content_ar !== undefined) updateFields.content_ar = content_ar;
    if (content_en !== undefined) updateFields.content_en = content_en;
    if (category !== undefined) updateFields.category = category;
    if (featured_image_url !== undefined) updateFields.featured_image_url = featured_image_url;
    if (status !== undefined) {
      updateFields.status = status;
      if (status === 'published') {
        updateFields.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase.from('articles').update(updateFields).eq('id', id).select().single();
    if (error) throw error;
    await logAudit('article_updated', 'article', id, req.admin, { title_ar, status }, req.ip);

    res.json({ success: true, article: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/articles/:id', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
    await logAudit('article_deleted', 'article', id, req.admin, {}, req.ip);

    res.json({ success: true, message: 'تم حذف المقال بنجاح.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Media Assets Management & Upload
app.get('/api/admin/media', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, media: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/media/upload', requireAdmin(['owner', 'admin', 'editor']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'لم يتم اختيار أي ملف للرفع.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const { originalname, size, mimetype } = req.file;
    const { alt_text_ar, alt_text_en, is_confidential } = req.body;

    const { data, error } = await supabase.from('media_assets').insert([{
      file_name: originalname,
      file_path: fileUrl,
      public_url: fileUrl,
      file_size_bytes: size,
      mime_type: mimetype,
      alt_text_ar: alt_text_ar || originalname,
      alt_text_en: alt_text_en || originalname,
      uploaded_by: req.admin.id,
      is_confidential: Boolean(is_confidential)
    }]).select().single();

    if (error) throw error;
    await logAudit('media_uploaded', 'media_asset', data.id, req.admin, { file_name: originalname }, req.ip);

    res.json({ success: true, media: data, url: fileUrl });
  } catch (err) {
    console.error('Media Upload Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/media/:id', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: media, error: fetchErr } = await supabase.from('media_assets').select('*').eq('id', id).single();
    if (fetchErr || !media) throw fetchErr || new Error('الملف غير موجود');

    // Remove local file if exists
    if (media.file_path && media.file_path.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, media.file_path);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    const { error } = await supabase.from('media_assets').delete().eq('id', id);
    if (error) throw error;
    await logAudit('media_deleted', 'media_asset', id, req.admin, { file_name: media.file_name }, req.ip);

    res.json({ success: true, message: 'تم حذف الملف بنجاح.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Company Settings Management
app.get('/api/admin/settings', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'general').single();
    if (error) throw error;
    res.json({ success: true, settings: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/settings', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const {
      company_name_ar,
      company_name_en,
      phone,
      phone_intl,
      whatsapp,
      email,
      license_number,
      license_label_ar,
      address_ar,
      address_en,
      working_hours_ar,
      working_hours_en,
      footer_desc_ar,
      footer_desc_en
    } = req.body;

    const updateFields = {
      updated_at: new Date().toISOString()
    };
    if (company_name_ar !== undefined) updateFields.company_name_ar = company_name_ar;
    if (company_name_en !== undefined) updateFields.company_name_en = company_name_en;
    if (phone !== undefined) updateFields.phone = phone;
    if (phone_intl !== undefined) updateFields.phone_intl = phone_intl;
    if (whatsapp !== undefined) updateFields.whatsapp = whatsapp;
    if (email !== undefined) updateFields.email = email;
    if (license_number !== undefined) updateFields.license_number = license_number;
    if (license_label_ar !== undefined) updateFields.license_label_ar = license_label_ar;
    if (address_ar !== undefined) updateFields.address_ar = address_ar;
    if (address_en !== undefined) updateFields.address_en = address_en;
    if (working_hours_ar !== undefined) updateFields.working_hours_ar = working_hours_ar;
    if (working_hours_en !== undefined) updateFields.working_hours_en = working_hours_en;
    if (footer_desc_ar !== undefined) updateFields.footer_desc_ar = footer_desc_ar;
    if (footer_desc_en !== undefined) updateFields.footer_desc_en = footer_desc_en;

    const { data, error } = await supabase
      .from('site_settings')
      .update(updateFields)
      .eq('id', 'general')
      .select()
      .single();

    if (error) throw error;
    await logAudit('settings_updated', 'site_settings', 'general', req.admin, updateFields, req.ip);

    res.json({ success: true, settings: data, message: 'تم حفظ إعدادات الشركة والموقع بنجاح!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Staff Users & RBAC
app.get('/api/admin/users', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, full_name, email, role, phone, is_active, last_login_at, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ success: true, users: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { full_name, email, password, role, phone } = req.body;
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة (الاسم، البريد، كلمة المرور، الصلاحية).' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase.from('admin_profiles').insert([{
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role,
      phone: phone ? phone.trim() : null,
      is_active: true
    }]).select('id, full_name, email, role, phone, is_active, created_at').single();

    if (error) throw error;
    await logAudit('user_created', 'admin_profile', data.id, req.admin, { email, role }, req.ip);

    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/users/:id', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, phone, is_active, password } = req.body;

    const updateFields = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updateFields.full_name = full_name;
    if (role !== undefined) updateFields.role = role;
    if (phone !== undefined) updateFields.phone = phone;
    if (is_active !== undefined) updateFields.is_active = is_active;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password_hash = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
      .from('admin_profiles')
      .update(updateFields)
      .eq('id', id)
      .select('id, full_name, email, role, phone, is_active, updated_at')
      .single();

    if (error) throw error;
    await logAudit('user_updated', 'admin_profile', id, req.admin, { role, is_active }, req.ip);

    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin(['owner']), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.admin.id) {
      return res.status(400).json({ success: false, error: 'لا يمكنك حذف حسابك الخاص.' });
    }

    const { error } = await supabase.from('admin_profiles').delete().eq('id', id);
    if (error) throw error;
    await logAudit('user_deleted', 'admin_profile', id, req.admin, {}, req.ip);

    res.json({ success: true, message: 'تم حذف المستخدم بنجاح.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Notifications
app.get('/api/admin/notifications', requireAdmin(), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    res.json({ success: true, notifications: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/notifications/:id/read', requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/notifications/mark-all-read', requireAdmin(), async (req, res) => {
  try {
    const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Audit Logs
app.get('/api/admin/activity', requireAdmin(['owner', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data, count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ success: true, logs: data, total: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route /admin to /admin/index.html
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Catch-all for HTML pages or fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const directFile = path.join(__dirname, req.path + '.html');
    if (fs.existsSync(directFile)) {
      return res.sendFile(directFile);
    }
  }
  next();
});

module.exports = app;

// Start Express Server locally when run directly
if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[NAFIDHAYN LAW FIRM SERVER] Running at http://127.0.0.1:${PORT}/`);
    console.log(`[CMS & ADMIN DASHBOARD] Ready at http://127.0.0.1:${PORT}/admin`);
    console.log(`[SUPABASE CONNECTION] Connected to ${SUPABASE_URL}`);
  });
}
