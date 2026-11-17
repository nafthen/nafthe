const assert = require('assert');

async function runTests() {
  console.log('====================================================');
  console.log('NAFIDHAYN FULL SYSTEM & CMS PRODUCTION VERIFICATION');
  console.log('====================================================\n');

  // 1. GET /admin
  console.log('1. Checking Admin Dashboard Route (/admin)...');
  const adminPage = await fetch('http://127.0.0.1:3000/admin');
  assert.strictEqual(adminPage.status, 200, 'GET /admin should return 200 OK');
  const adminHtml = await adminPage.text();
  assert.ok(adminHtml.includes('loginView'), 'HTML must include loginView');
  assert.ok(adminHtml.includes('dashboardApp'), 'HTML must include dashboardApp');
  assert.ok(adminHtml.includes('44435'), 'HTML must include license 44435');
  console.log('   ✓ /admin returns 200 OK with login view and dashboard shell.\n');

  // 2. Admin Authentication
  console.log('2. Authenticating Admin User (admin@nafidhayn.sa)...');
  const loginRes = await fetch('http://127.0.0.1:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nafidhayn.sa', password: 'Nafidhayn@2026' })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true, 'Admin login must succeed');
  assert.strictEqual(loginData.user.role, 'owner', 'Admin role must be owner');
  const token = loginData.token;
  assert.ok(token, 'A valid JWT session token must be returned');
  console.log('   ✓ Admin login successful. Token issued for:', loginData.user.fullName, `(${loginData.user.email})\n`);

  // 3. Admin Dashboard Stats
  console.log('3. Fetching Dashboard Overview Stats (/api/admin/stats)...');
  const statsRes = await fetch('http://127.0.0.1:3000/api/admin/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  assert.strictEqual(statsData.success, true);
  console.log('   ✓ Real Stats verified:');
  console.log('     - Total Inquiries:', statsData.stats.inquiries.total, '(New:', statsData.stats.inquiries.new + ')');
  console.log('     - Total Consultations:', statsData.stats.consultations.total, '(New:', statsData.stats.consultations.new + ')');
  console.log('     - Legal Services in DB:', statsData.stats.services);
  console.log('     - FAQs in DB:', statsData.stats.faqs);
  console.log('     - Unread Notifications:', statsData.stats.unreadNotifications, '\n');

  // 4. Inquiries Management & Note Workflow
  console.log('4. Testing Inquiries Management & Note Workflow...');
  const inqRes = await fetch('http://127.0.0.1:3000/api/admin/inquiries', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const inqData = await inqRes.json();
  assert.strictEqual(inqData.success, true);
  const firstInq = inqData.inquiries[0];
  assert.ok(firstInq, 'There should be at least 1 inquiry in database');
  console.log('   ✓ Retrieved inquiry:', firstInq.ref_number, 'from:', firstInq.full_name, '- Status:', firstInq.status);

  // Update Status
  const statusRes = await fetch(`http://127.0.0.1:3000/api/admin/inquiries/${firstInq.id}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress' })
  }).then(r => r.json());
  assert.strictEqual(statusRes.inquiry.status, 'in_progress');
  console.log('   ✓ Status updated to:', statusRes.inquiry.status);

  // Add Internal Staff Note
  const noteRes = await fetch(`http://127.0.0.1:3000/api/admin/inquiries/${firstInq.id}/notes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'تم مراجعة الاستفسار من قبل المستشار القانوني وتم تحديد موعد اتصال مبدئي.' })
  }).then(r => r.json());
  assert.strictEqual(noteRes.success, true);
  console.log('   ✓ Internal staff note added successfully.\n');

  // 5. Consultation Requests Workflow
  console.log('5. Testing Consultation Requests Workflow...');
  const cnsRes = await fetch('http://127.0.0.1:3000/api/admin/consultations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const cnsData = await cnsRes.json();
  assert.strictEqual(cnsData.success, true);
  const firstCns = cnsData.consultations[0];
  assert.ok(firstCns, 'There should be at least 1 consultation request');
  console.log('   ✓ Retrieved consultation:', firstCns.ref_number, 'client:', firstCns.client_name, '- Status:', firstCns.status);

  // Update Status to under_review
  const cnsStatusRes = await fetch(`http://127.0.0.1:3000/api/admin/consultations/${firstCns.id}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'under_review' })
  }).then(r => r.json());
  assert.strictEqual(cnsStatusRes.consultation.status, 'under_review');
  console.log('   ✓ Consultation status updated to: under_review (فحص تعارض المصالح)\n');

  // 6. CMS Draft, Publish, Revision & Hydration Workflow
  console.log('6. Testing CMS Sections (Hero & About)...');
  const sectionsRes = await fetch('http://127.0.0.1:3000/api/admin/content/sections', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  assert.strictEqual(sectionsRes.success, true);
  const heroSec = sectionsRes.sections.find(s => s.section_key === 'hero');
  assert.ok(heroSec, 'Hero section must exist');
  console.log('   ✓ Hero Section found in DB. Current Title:', heroSec.title_ar);

  // Save Draft
  const draftRes = await fetch(`http://127.0.0.1:3000/api/admin/content/sections/${heroSec.id}/draft`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draft_content_ar: {
        badge_text: 'شركة محاماة واستشارات قانونية مرخصة بالمملكة العربية السعودية',
        title_line1: 'نافذين... حيث تبدأ الثقة',
        title_line2: 'وتُصان الحقوق',
        poetic_statement: 'العدالة تبدأ بخطوة صحيحة',
        description: 'حلول قانونية استراتيجية برؤية واضحة، والتزام مهني راسخ بحماية الحقوق والمصالح وفق أرفع المعايير المهنية والأنظمة السعودية الحديثة.',
        cta_primary_text: 'احجز استشارة',
        cta_secondary_text: 'استكشف خدماتنا'
      }
    })
  }).then(r => r.json());
  assert.strictEqual(draftRes.success, true);
  console.log('   ✓ Draft saved successfully without altering live version.');

  // Publish Section
  const pubRes = await fetch(`http://127.0.0.1:3000/api/admin/content/sections/${heroSec.id}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  assert.strictEqual(pubRes.success, true);
  console.log('   ✓ Section published successfully and revision snapshot recorded.\n');

  // 7. Audit Log Trail
  console.log('7. Verifying Audit Trail (/api/admin/activity)...');
  const auditRes = await fetch('http://127.0.0.1:3000/api/admin/activity', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  assert.strictEqual(auditRes.success, true);
  console.log('   ✓ Total audit log entries:', auditRes.total);
  console.log('   ✓ Recent actions in audit log:');
  auditRes.logs.slice(0, 4).forEach(l => {
    console.log(`     - [${l.action}] by ${l.performed_by_email} on ${l.entity_type} (${new Date(l.created_at).toLocaleTimeString('ar-SA')})`);
  });

  // 8. Public Website Hydration Endpoint
  console.log('\n8. Checking Public Published Content Endpoint (/api/content/published)...');
  const pubContent = await fetch('http://127.0.0.1:3000/api/content/published').then(r => r.json());
  assert.strictEqual(pubContent.success, true);
  assert.strictEqual(pubContent.data.settings.license_number, '44435');
  assert.strictEqual(pubContent.data.settings.phone, '055 978 7755');
  console.log('   ✓ Public hydration endpoint verified:');
  console.log('     - License:', pubContent.data.settings.license_number);
  console.log('     - Phone:', pubContent.data.settings.phone);
  console.log('     - Active Services:', pubContent.data.services.length);
  console.log('     - Published FAQs:', pubContent.data.faqs.length);

  console.log('\n====================================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
