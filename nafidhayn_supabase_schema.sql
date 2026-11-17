-- ============================================================================
-- NAFIDHAYN LAW FIRM (شركة نافذين للمحاماة والاستشارات القانونية)
-- Complete Production Database Schema & Initial Data Seed
-- Execute this script once in Supabase SQL Editor -> New Query -> Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Admin Roles & Permissions
CREATE TABLE IF NOT EXISTS admin_roles (
  role_key TEXT PRIMARY KEY,
  role_name_ar TEXT NOT NULL,
  role_name_en TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb
);

-- 2. Admin Staff Profiles
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT REFERENCES admin_roles(role_key) DEFAULT 'admin',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Site Settings (Phone, License, WhatsApp, Address)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'general',
  company_name_ar TEXT NOT NULL,
  company_name_en TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_intl TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  is_email_public BOOLEAN DEFAULT true,
  license_number TEXT NOT NULL,
  license_verified BOOLEAN DEFAULT true,
  license_label_ar TEXT NOT NULL,
  license_label_en TEXT NOT NULL,
  address_ar TEXT,
  address_en TEXT,
  working_hours_ar TEXT,
  working_hours_en TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  footer_desc_ar TEXT,
  footer_desc_en TEXT,
  seo_meta JSONB DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES admin_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Public Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  privacy_accepted BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'responded', 'closed', 'archived'
  assigned_to UUID REFERENCES admin_profiles(id),
  source TEXT DEFAULT 'website_contact_form',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Consultation Requests
CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_number TEXT UNIQUE NOT NULL,
  client_type TEXT DEFAULT 'individual', -- 'individual', 'corporate', 'international'
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service_requested TEXT NOT NULL,
  summary TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT, -- 'morning', 'evening'
  preferred_channel TEXT DEFAULT 'office', -- 'office', 'virtual', 'phone'
  conflict_check_confirmed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new', -- 'new', 'under_review', 'contacted', 'scheduled', 'completed', 'cancelled'
  confirmed_appointment_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Request Internal Staff Notes
CREATE TABLE IF NOT EXISTS request_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL, -- 'inquiry' or 'consultation'
  request_id UUID NOT NULL,
  author_id UUID REFERENCES admin_profiles(id),
  author_name TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Request Staff Assignments
CREATE TABLE IF NOT EXISTS request_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  request_id UUID NOT NULL,
  assigned_by UUID REFERENCES admin_profiles(id),
  assigned_to UUID REFERENCES admin_profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CMS Site Sections (Hero, About, etc.)
CREATE TABLE IF NOT EXISTS site_sections (
  id TEXT PRIMARY KEY,
  section_key TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  subtitle_ar TEXT,
  subtitle_en TEXT,
  content_ar JSONB DEFAULT '{}'::jsonb,
  content_en JSONB DEFAULT '{}'::jsonb,
  draft_content_ar JSONB,
  draft_content_en JSONB,
  is_published BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 1,
  updated_by UUID REFERENCES admin_profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Page Revisions & History
CREATE TABLE IF NOT EXISTS page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_or_page_id TEXT NOT NULL,
  revision_type TEXT DEFAULT 'section',
  content_snapshot JSONB NOT NULL,
  created_by UUID REFERENCES admin_profiles(id),
  creator_name TEXT,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CMS Static Pages
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar JSONB DEFAULT '{}'::jsonb,
  content_en JSONB DEFAULT '{}'::jsonb,
  seo_title_ar TEXT,
  seo_title_en TEXT,
  seo_description_ar TEXT,
  seo_description_en TEXT,
  status TEXT DEFAULT 'published', -- 'draft', 'published'
  author_id UUID REFERENCES admin_profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Legal Services
CREATE TABLE IF NOT EXISTS legal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  short_desc_ar TEXT,
  short_desc_en TEXT,
  full_content_ar TEXT,
  full_content_en TEXT,
  icon_svg TEXT,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Articles & Blog
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  excerpt_ar TEXT,
  excerpt_en TEXT,
  content_ar TEXT,
  content_en TEXT,
  category TEXT DEFAULT 'قضايا ونظام',
  featured_image_url TEXT,
  status TEXT DEFAULT 'published', -- 'draft', 'published'
  author_id UUID REFERENCES admin_profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FAQ Items
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ar TEXT NOT NULL,
  question_en TEXT,
  answer_ar TEXT NOT NULL,
  answer_en TEXT,
  category TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Media Assets
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  alt_text_ar TEXT,
  alt_text_en TEXT,
  uploaded_by UUID REFERENCES admin_profiles(id),
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Admin Notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  message_ar TEXT NOT NULL,
  message_en TEXT,
  category TEXT DEFAULT 'general', -- 'inquiry', 'consultation', 'system'
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  performed_by UUID REFERENCES admin_profiles(id),
  performed_by_email TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow server full access
CREATE POLICY "server_roles" ON admin_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_profiles" ON admin_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_inquiries" ON inquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_consultations" ON consultation_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_notes" ON request_internal_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_assignments" ON request_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_sections" ON site_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_revisions" ON page_revisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_pages" ON pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_services" ON legal_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_articles" ON articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_faqs" ON faq_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_media" ON media_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_notifications" ON admin_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "server_audit" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- 1. Roles
INSERT INTO admin_roles (role_key, role_name_ar, role_name_en, permissions) VALUES
  ('owner', 'المالك والمشرف العام', 'Owner & General Supervisor', '["*"]'::jsonb),
  ('admin', 'مدير النظام', 'System Administrator', '["inquiries.*", "consultations.*", "cms.*", "users.view", "users.create", "settings.*", "audit.view"]'::jsonb),
  ('editor', 'محرر محتوى', 'Content Editor', '["cms.*", "services.*", "articles.*", "faq.*", "media.*"]'::jsonb),
  ('receptionist', 'استقبال وتنسيق', 'Intake & Coordinator', '["inquiries.view", "inquiries.update_status", "consultations.view", "consultations.update_status"]'::jsonb)
ON CONFLICT (role_key) DO NOTHING;

-- 2. Owner User (Password: Nafidhayn@2026)
INSERT INTO admin_profiles (id, full_name, email, password_hash, role, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'إدارة شركة نافذين للمحاماة', 'admin@nafidhayn.sa', '$2b$10$kmhP1hwle5F.i1ZKOfH8XOOLbtlE8ux3rBFCx1BptE/E5BxpsfPXW', 'owner', true)
ON CONFLICT (email) DO NOTHING;

-- 3. Official Company Settings
INSERT INTO site_settings (
  id, company_name_ar, company_name_en, phone, phone_intl, whatsapp, email, is_email_public,
  license_number, license_verified, license_label_ar, license_label_en, address_ar, address_en,
  working_hours_ar, working_hours_en, footer_desc_ar
) VALUES (
  'general',
  'شركة نافذين للمحاماة والاستشارات القانونية',
  'Nafidhayn Law Firm',
  '055 978 7755',
  '+966559787755',
  '055 978 7755',
  'Nafidhayn.sa@gmail.com',
  true,
  '44435',
  true,
  'رقم الترخيص: 44435',
  'License No: 44435',
  'الرياض، المملكة العربية السعودية',
  'Riyadh, Kingdom of Saudi Arabia',
  'الأحد – الخميس: 9:00 ص – 5:00 م',
  'Sunday – Thursday: 9:00 AM – 5:00 PM',
  'شركة نافذين للمحاماة والاستشارات القانونية، شركة مهنية سعودية تقدم خدمات المحاماة والتمثيل القضائي والاستشارات التجارية المتخصصة وفق أعلى معايير الحوكمة والأنظمة المرعية.'
) ON CONFLICT (id) DO NOTHING;

-- 4. Initial Legal Services (6 Services)
INSERT INTO legal_services (slug, title_ar, title_en, short_desc_ar, display_order, is_active) VALUES
  ('litigation', 'المحاماة والتقاضي وحل النزاعات', 'Litigation & Dispute Resolution', 'تمثيل قضائي متخصص وترافع رصين أمام المحاكم التجارية والإدارية ولجان الفصل شبه القضائية.', 1, true),
  ('corporate', 'الشركات والاستثمار الأجنبي', 'Corporate & Foreign Investment', 'تأسيس الكيانات، استخراج تراخيص الاستثمار، صياغة اتفاقيات الشركاء، وحوكمة مجالس الإدارة.', 2, true),
  ('contracts', 'العقود والاتفاقيات التجارية', 'Commercial Contracts', 'صياغة وقائية محكمة لعقود التوريد والمقاولات والامتياز التجاري تدرأ المخاطر.', 3, true),
  ('real-estate', 'العقارات والإنشاءات والتمويل', 'Real Estate & Construction', 'استشارات التطوير العقاري، البيع على الخارطة، وصناديق الاستثمار المرخصة.', 4, true),
  ('intellectual-property', 'الملكية الفكرية والعلامات التجارية', 'Intellectual Property', 'تسجيل وحماية براءات الاختراع والعلامات والأسرار التجارية ومكافحة التعدي.', 5, true),
  ('labor-regulatory', 'الاستشارات العمالية والتنظيمية', 'Labor & Regulatory', 'صياغة لوائح العمل الداخلية، تسوية الخلافات العمالية، وحماية بيئة الأعمال التعاقدية.', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Initial FAQs
INSERT INTO faq_items (question_ar, answer_ar, category, display_order, is_active) VALUES
  ('كيف يتم تحديد أتعاب المحاماة والاستشارات؟', 'تُحدد الأتعاب وفق طبيعة العمل والجهد المطلوب، سواء عبر أتعاب مقطوعة، أو عقود استشارات سنوية، أو نسب مرتبطة بالنتائج، وذلك بموجب عقد اتفاق مكتوب يوضح كافة الالتزامات بشفافية تامة.', 'general', 1, true),
  ('ما هي آلية التعامل مع طلبات الاستشارات؟', 'يتم استلام الطلب وفحص تعارض المصالح فوراً للتأكد من عدم وجود مانع مهني، ثم تحديد جلسة استشارية لدراسة المستندات وتقديم الرأي القانوني المكتوب أو الشفهي.', 'consultations', 2, true),
  ('هل تقدم الشركة خدمات التمثيل أمام كافة المحاكم؟', 'نعم، يتولى محامونا المرخصون التمثيل والترافع أمام المحاكم العامة، التجارية، العمالية، الإدارية (ديوان المظالم)، واللجان شبه القضائية في كافة مناطق المملكة.', 'litigation', 3, true),
  ('كيف تساعدون المستثمر الأجنبي في دخول السوق السعودي؟', 'نقدم حزمة متكاملة تبدأ من استخراج ترخيص وزارة الاستثمار (MISA)، وتأسيس الشركة، وقيد السجل التجاري، وصولاً إلى عقود العمل والامتثال للأنظمة المحلية.', 'corporate', 4, true),
  ('ما الفرق بين الاستشارة المبدئية والتوكيل القضائي؟', 'الاستشارة المبدئية تهدف إلى تقييم الموقف القانوني وتحديد مسارات العمل، بينما التوكيل القضائي يتطلب عقد خدمات نظامي ووكالة شرعية معتمدة عبر بوابة ناجز.', 'general', 5, true);

-- 6. Initial Sections (Hero & About)
INSERT INTO site_sections (id, section_key, title_ar, is_published, is_visible, display_order, content_ar) VALUES
  ('hero', 'hero', 'نافذين... حيث تبدأ الثقة', true, true, 1, '{
    "badge_text": "شركة محاماة واستشارات قانونية مرخصة بالمملكة العربية السعودية",
    "title_line1": "نافذين... حيث تبدأ الثقة",
    "title_line2": "وتُصان الحقوق",
    "poetic_statement": "العدالة تبدأ بخطوة صحيحة",
    "description": "حلول قانونية استراتيجية برؤية واضحة، والتزام مهني راسخ بحماية الحقوق والمصالح وفق أرفع المعايير المهنية والأنظمة السعودية الحديثة.",
    "cta_primary_text": "احجز استشارة",
    "cta_secondary_text": "استكشف خدماتنا"
  }'::jsonb),
  ('about', 'about', 'ريادة قانونية راسخة، تُسهم في حماية الأعمال وتمكين الحقوق', true, true, 2, '{
    "body_ar": "تأسست شركة نافذين للمحاماة والاستشارات القانونية ككيان مهني سعودي يجمع بين عمق الخبرة القضائية والحس التجاري الحديث لتوفير الحماية القانونية المتكاملة.",
    "vision": "أن نكون الصرح القانوني الرائد والأكثر موثوقية في المملكة وفق مستهدفات رؤية 2030.",
    "mission": "صون الحقوق وحماية مصالح الموكلين عبر أحدث الممارسات المهنية وأعلى معايير النزاهة والحوكمة."
  }'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 7. Initial Notification
INSERT INTO admin_notifications (title_ar, title_en, message_ar, message_en, category, is_read) VALUES
  ('تم تدشين النظام وربط قاعدة البيانات بنجاح', 'System Launched', 'تم ربط شركة نافذين للمحاماة بقاعدة بيانات Supabase بنجاح، وتهيئة جميع الجداول.', 'Database connected successfully.', 'system', false);
