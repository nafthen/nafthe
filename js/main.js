/**
 * NAFIDHAYN LAW FIRM — Main Interactive Engine
 * شركة نافذين للمحاماة والاستشارات القانونية
 */

'use strict';

// Service Detailed Data for Modals
const SERVICE_DETAILS = {
  1: {
    ar: {
      title: "المحاماة والتقاضي وحل النزاعات",
      icon: "fa-gavel",
      scopes: [
        "إعداد وصياغة لوائح الدعاوى والمذكرات الجوابية والطعن بالاستئناف والنقض.",
        "الترافع أمام المحاكم التجارية في نزاعات الشركاء والأوراق التجارية وعقود التوريد.",
        "تمثيل الموكلين أمام اللجان الضريبية، ولجان الأوراق المالية، ولجان المنازعات التأمينية.",
        "إدارة إجراءات التحكيم المحلي والدولي وصياغة مشارطات التحكيم وتنفيذ الأحكام الأجنبية."
      ],
      methodology: "نقوم بدراسة متأنية لجميع وقائع النزاع وتحديد المراكز القانونية، ثم بناء نظرية الدعوى وحصر الأدلة والسوابق القضائية المؤيدة، بهدف تحقيق أعلى نسب الحماية والمكاسب النظامية للموكل.",
      statuteRef: "نظام المرافعات الشرعية، نظام المحاكم التجارية، نظام الإثبات، ونظام التحكيم السعودي."
    },
    en: {
      title: "Litigation & Dispute Resolution",
      icon: "fa-gavel",
      scopes: [
        "Drafting statements of claims, defensive memoranda, appellate briefs, and petitions for cassation.",
        "Litigating corporate disputes, commercial papers, and supply contract claims before Commercial Courts.",
        "Representation before tax committees, capital market tribunals, and insurance dispute panels.",
        "Administering domestic and international arbitration, drafting submission agreements, and enforcing foreign awards."
      ],
      methodology: "We conduct an exhaustive preliminary appraisal of dispute facts and legal standings, formulate a robust case theory, and marshal statutory precedents to optimize judicial outcomes.",
      statuteRef: "Saudi Law of Civil Procedure, Commercial Courts Law, Evidence Law, and Arbitration Law."
    }
  },
  2: {
    ar: {
      title: "الشركات والاستثمار الأجنبي",
      icon: "fa-building-columns",
      scopes: [
        "تأسيس الشركات بجميع أشكالها (مساهمة، مبسطة، ذات مسؤولية محدودة) وفق نظام الشركات الحديث.",
        "استخراج تراخيص الاستثمار الأجنبي من وزارة الاستثمار (MISA) وتراخيص المقار الإقليمية (RHQ).",
        "هيكلة عمليات الاندماج والاستحواذ (M&A) وإعداد اتفاقيات شراء الحصص والمساهمين.",
        "صياغة لوائح الحوكمة الداخلية وتوزيع صلاحيات مجالس الإدارة واللجان المنبثقة."
      ],
      methodology: "نرافق المستثمرين ورواد الأعمال من خطوة التخطيط وحتى استكمال التراخيص، مع ضمان الامتثال الكامل لاشتراطات البيئة التنظيمية السعودية الحديثة وتأمين مسارات التوسع.",
      statuteRef: "نظام الشركات السعودي الجديد، نظام الاستثمار المحدث، ولائحة حوكمة الشركات."
    },
    en: {
      title: "Corporate Law & Foreign Investment",
      icon: "fa-building-columns",
      scopes: [
        "Incorporation of all company types (Joint Stock, Simplified JSC, LLC) under the modern Companies Law.",
        "Issuance of MISA foreign investment licenses and Regional Headquarters (RHQ) authorizations.",
        "Structuring M&A transactions, drafting share purchase agreements, and shareholder covenants.",
        "Formulating internal corporate governance frameworks and board delegation matrixes."
      ],
      methodology: "We accompany enterprises from strategic planning through licensing, ensuring rigorous compliance with Saudi regulatory requirements and securing growth pathways.",
      statuteRef: "New Saudi Companies Law, Updated Investment Law, and Corporate Governance Regulations."
    }
  },
  3: {
    ar: {
      title: "العقود والاتفاقيات التجارية",
      icon: "fa-file-signature",
      scopes: [
        "صياغة وتدقيق عقود الامتياز التجاري (Franchise) وقيدها في السجل التجاري لدى وزارة التجارة.",
        "إعداد اتفاقيات المشاريع المشتركة (Joint Ventures) وتحالفات الشركات في المشاريع الكبرى.",
        "صياغة عقود التوريد والمقاولات (FIDIC) وسلاسل الإمداد ونقل المعرفة والسرية (NDA).",
        "إجراء المفاوضات التعاقدية لتقليل المخاطر وحماية الحقوق المالية والفكرية للمنشأة."
      ],
      methodology: "نعتمد أسلوب الصياغة الوقائية المحكمة التي تغلق ثغرات التأويل وتضع آليات واضحة لحل الخلافات وفض الشراكات بمرونة تحمي استقرار الأعمال.",
      statuteRef: "نظام الامتياز التجاري، نظام المعاملات المدنية، ونظام المنافسات والمشتريات الحكومية."
    },
    en: {
      title: "Commercial Contracts & Agreements",
      icon: "fa-file-signature",
      scopes: [
        "Drafting and registration of Franchise agreements with the Ministry of Commerce.",
        "Structuring Joint Venture agreements and corporate consortia for megaprojects.",
        "Drafting FIDIC construction contracts, procurement accords, NDAs, and knowledge transfer covenants.",
        "Leading contractual negotiations to eliminate future exposure and secure financial interests."
      ],
      methodology: "We adopt preventive drafting methodologies designed to eliminate ambiguities, establish clear dispute resolution channels, and protect long-term business continuity.",
      statuteRef: "Commercial Franchise Law, Civil Transactions Law, and Government Tenders Law."
    }
  },
  4: {
    ar: {
      title: "العقارات والإنشاءات والتمويل",
      icon: "fa-city",
      scopes: [
        "تقديم المشورة القانونية للمطورين العقاريين وصناديق الاستثمار العقاري المرخصة من هيئة السوق المالية.",
        "صياغة عقود التطوير العقاري وإجراءات البيع على الخارطة بالتوافق مع اشتراطات برنامج (وافي).",
        "الفحص النافي للجهالة القانونية للصكوك والأصول العقارية والتأكد من سلامة سلاسل الملكية.",
        "تسوية نزاعات المقاولات والمطالبات المالية والتأخيرات الهندسية وأوامر التغيير."
      ],
      methodology: "نقدم حلولاً متكاملة تجمع بين الفهم العميق للتشريعات العقارية والواقع الاستثماري، مما يوفر بيئة استثمارية آمنة للمطورين والممولين والملاك.",
      statuteRef: "نظام بيع وتأجير مشروعات عقارية على الخارطة، نظام التسجيل العيني للعقار، واللائحة التنفيذية."
    },
    en: {
      title: "Real Estate, Construction & Finance",
      icon: "fa-city",
      scopes: [
        "Providing legal advisory to property developers and CMA-licensed real estate investment funds (REITs).",
        "Drafting real estate development agreements and off-plan sales contracts complying with Wafi rules.",
        "Conducting title deed legal due diligence and verifying ownership chain integrity.",
        "Resolving construction claims, delay penalties, and engineering change orders."
      ],
      methodology: "We deliver solutions uniting regulatory precision with commercial feasibility, securing asset value for developers, financiers, and institutional property holders.",
      statuteRef: "Off-Plan Real Estate Projects Law, Real Estate In-Kind Registration Law, and related executive bylaws."
    }
  },
  5: {
    ar: {
      title: "الملكية الفكرية والعلامات التجارية",
      icon: "fa-shield-halved",
      scopes: [
        "تسجيل العلامات التجارية وحمايتها محلياً ودولياً عبر الهيئة السعودية للملكية الفكرية ونظام مدريد.",
        "إيداع وتسجيل براءات الاختراع والنماذج الصناعية وحقوق المؤلف وحمايتها من التقليد.",
        "صياغة اتفاقيات الترخيص التجاري والاستغلال ونقل حقوق الملكية الفكرية.",
        "ملاحقة حالات التعدي والمنافسة غير المشروعة أمام المحاكم واللجان المختصة والمطالبة بالتعويضات."
      ],
      methodology: "نعمل على تحويل الملكية الفكرية إلى أصل استثماري محصن نظامياً ومدر للدخل، مع حماية الهوية التجارية للمنشأة من أي تعدٍ أو انتحال.",
      statuteRef: "نظام العلامات التجارية لدول مجلس التعاون، نظام براءات الاختراع، ونظام حماية حقوق المؤلف."
    },
    en: {
      title: "Intellectual Property & Trademarks",
      icon: "fa-shield-halved",
      scopes: [
        "Registering and protecting trademarks domestically and internationally via SAIP and the Madrid System.",
        "Filing patents, industrial designs, and copyrights to safeguard technical and creative assets.",
        "Drafting commercial licensing, assignment, and technology transfer agreements.",
        "Prosecuting infringement and unfair competition before competent courts to secure injunctions and damages."
      ],
      methodology: "We turn intellectual capital into an asset-backed commercial advantage, insulating corporate brand identity from piracy and unfair market exploitation.",
      statuteRef: "GCC Trademark Law, Patents and Industrial Designs Law, and Copyright Protection Law."
    }
  },
  6: {
    ar: {
      title: "الاستشارات العمالية والتنظيمية",
      icon: "fa-users-gear",
      scopes: [
        "مواءمة اللوائح الداخلية للشركات مع نموذج لائحة تنظيم العمل الموحدة لوزارة الموارد البشرية.",
        "صياغة عقود العمل النموذجية للقيادات التنفيذية وتضمين شروط عدم المنافسة وسرية المعلومات.",
        "تقديم الاستشارات الوقائية في قضايا الفصل التعسفي وإنهاء العقود والتسويات الودية في (ودّي).",
        "الامتثال لمتطلبات التوطين، ونظام التأمينات الاجتماعية، وتدابير السلامة والصحة المهنية."
      ],
      methodology: "نحقق التوازن بين استقرار بيئة العمل وحماية حقوق المنشأة، عبر إجراءات نظامية استباقية تقلل النزاعات العمالية وتخفض كلفة التعويضات.",
      statuteRef: "نظام العمل السعودي ولوائحه التنفيذية، نظام التأمينات الاجتماعية، وقرارات التوطين الوزارية."
    },
    en: {
      title: "Labor Law & Regulatory Compliance",
      icon: "fa-users-gear",
      scopes: [
        "Harmonizing corporate bylaws with the Ministry of Human Resources' Unified Internal Work Regulation.",
        "Drafting executive employment contracts with enforceable non-compete and confidentiality clauses.",
        "Preventive counsel for terminations, amicable labor settlements (Waddi platform), and mediation.",
        "Ensuring compliance with Saudization quotas, social insurance regulations, and workplace standards."
      ],
      methodology: "We harmonize workplace stability with organizational safety, executing structured protocols that preempt employment friction and mitigate liability.",
      statuteRef: "Saudi Labor Law and its executive regulations, Social Insurance Law, and ministerial Saudization decrees."
    }
  }
};

// Application State
let currentLang = 'ar';
let lastScrollY = window.scrollY;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initHeader();
  initMobileMenu();
  initScrollAnimations();
  initTabs();
  initFaqAccordion();
  initModals();
  initForms();
  initSmoothScroll();
  initCmsContent();
});

/* --------------------------------------------------------------------------
   01. LANGUAGE & LOCALIZATION ENGINE
   -------------------------------------------------------------------------- */
function initLanguage() {
  const saved = localStorage.getItem('nafidhayn_lang');
  if (saved && (saved === 'ar' || saved === 'en')) {
    currentLang = saved;
  } else {
    currentLang = 'ar';
  }
  applyLanguage(currentLang);

  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.addEventListener('click', toggleLanguage);
  }

  const mobileLangBtn = document.getElementById('mobileLangSwitchBtn');
  if (mobileLangBtn) {
    mobileLangBtn.addEventListener('click', toggleLanguage);
  }
}

function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('nafidhayn_lang', currentLang);
  applyLanguage(currentLang);
}

function applyLanguage(lang) {
  const dict = NAFIDHAYN_TRANSLATIONS[lang] || NAFIDHAYN_TRANSLATIONS['ar'];

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Update all [data-i18n] text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  // Update all [data-i18n-placeholder]
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) {
      el.setAttribute('placeholder', dict[key]);
    }
  });

  // Update language switch button text
  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.innerHTML = `<i class="fa-solid fa-globe"></i> <span>${dict['lang_switch_label']}</span>`;
  }
  const mobileLangBtn = document.getElementById('mobileLangSwitchBtn');
  if (mobileLangBtn) {
    mobileLangBtn.innerHTML = `<i class="fa-solid fa-globe"></i> <span>${dict['lang_switch_label']}</span>`;
  }
}

/* --------------------------------------------------------------------------
   02. SMART HEADER & SCROLL BEHAVIOR
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const isHeroPage = document.querySelector('.hero-section') !== null;

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;

    // Background style switch
    if (isHeroPage) {
      if (currentY > 80) {
        header.classList.add('scrolled');
        header.classList.remove('nav-hero');
      } else {
        header.classList.remove('scrolled');
        header.classList.add('nav-hero');
      }
    } else {
      header.classList.add('scrolled');
      header.classList.remove('nav-hero');
    }

    // Hide on scroll down, show on scroll up
    if (currentY > 200) {
      if (currentY > lastScrollY && currentY - lastScrollY > 6) {
        // Scrolling down
        header.classList.add('nav-hidden');
      } else if (lastScrollY - currentY > 6) {
        // Scrolling up
        header.classList.remove('nav-hidden');
      }
    } else {
      header.classList.remove('nav-hidden');
    }

    lastScrollY = currentY;
    highlightActiveNav();
  }, { passive: true });
}

function highlightActiveNav() {
  const sections = ['hero', 'about', 'services', 'why', 'process', 'team', 'faq', 'contact'];
  const scrollPos = window.scrollY + 120;

  sections.forEach(id => {
    const el = document.getElementById(id);
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (el && link) {
      const top = el.offsetTop;
      const height = el.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}

/* --------------------------------------------------------------------------
   03. MOBILE DRAWER & NAVIGATION
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (!toggleBtn || !drawer || !overlay) return;

  function openDrawer() {
    toggleBtn.classList.add('active');
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeDrawer() {
    toggleBtn.classList.remove('active');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  toggleBtn.addEventListener('click', () => {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  overlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* --------------------------------------------------------------------------
   04. SCROLL REVEALS & INTERSECTION OBSERVER
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal, .reveal-fade').forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-fade').forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   05. VISION / MISSION / APPROACH TABS
   -------------------------------------------------------------------------- */
function initTabs() {
  document.querySelectorAll('.vm-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      document.querySelectorAll('.vm-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.vm-tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(`tab-panel-${targetId}`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* --------------------------------------------------------------------------
   06. FAQ ACCORDION
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  document.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const panel = item.querySelector('.faq-answer-panel');
      const isOpen = item.classList.contains('active');

      // Close all other items
      document.querySelectorAll('.faq-item.active').forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.faq-answer-panel').style.maxHeight = null;
        }
      });

      // Toggle current
      if (isOpen) {
        item.classList.remove('active');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('active');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* --------------------------------------------------------------------------
   07. MODAL DIALOGS (SERVICE DETAILS & CONSULTATION)
   -------------------------------------------------------------------------- */
function initModals() {
  const serviceModal = document.getElementById('serviceDetailModal');
  const serviceModalClose = document.getElementById('closeServiceModal');

  if (serviceModal && serviceModalClose) {
    serviceModalClose.addEventListener('click', () => closeServiceModal());
    serviceModal.addEventListener('click', (e) => {
      if (e.target === serviceModal) closeServiceModal();
    });
  }

  // Bind service card "تفاصيل الخدمة" buttons
  document.querySelectorAll('[data-service-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-service-id');
      openServiceModal(id);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeServiceModal();
    }
  });
}

function openServiceModal(serviceId) {
  const modal = document.getElementById('serviceDetailModal');
  if (!modal) return;

  const data = SERVICE_DETAILS[serviceId];
  if (!data) return;

  const content = data[currentLang] || data['ar'];

  document.getElementById('modalServiceTitle').textContent = content.title;
  
  let scopesHtml = '<ul style="margin: 16px 0; display:flex; flex-direction:column; gap:8px;">';
  content.scopes.forEach(s => {
    scopesHtml += `<li style="display:flex; align-items:flex-start; gap:10px;"><i class="fa-solid fa-circle-check text-gold" style="margin-top:5px;"></i> <span>${s}</span></li>`;
  });
  scopesHtml += '</ul>';

  const bodyHtml = `
    <div style="margin-bottom: 20px;">
      <h4 style="font-size:1.1rem; color:var(--c-forest); margin-bottom:8px;">${currentLang === 'ar' ? 'نطاق العمل والتكليف' : 'Scope of Legal Engagement'}</h4>
      ${scopesHtml}
    </div>
    <div style="margin-bottom: 20px;">
      <h4 style="font-size:1.1rem; color:var(--c-forest); margin-bottom:8px;">${currentLang === 'ar' ? 'المنهجية المتبعة' : 'Our Methodology'}</h4>
      <p style="font-size:0.95rem; line-height:1.75;">${content.methodology}</p>
    </div>
    <div style="background:var(--c-ivory); border:1px solid var(--b-gold); border-radius:var(--r-xs); padding:14px 18px;">
      <h5 style="font-size:0.9rem; color:var(--c-forest); margin-bottom:4px;">${currentLang === 'ar' ? 'المرجعية النظامية في المملكة:' : 'Key Saudi Statutory Framework:'}</h5>
      <p style="font-size:0.86rem; color:var(--c-ink-muted); margin:0;">${content.statuteRef}</p>
    </div>
  `;

  document.getElementById('modalServiceBody').innerHTML = bodyHtml;

  // Set consultation pre-selection
  const modalCta = document.getElementById('modalBookServiceBtn');
  if (modalCta) {
    modalCta.onclick = () => {
      closeServiceModal();
      const serviceSelect = document.getElementById('consultationService');
      if (serviceSelect) {
        serviceSelect.value = serviceId;
      }
      const contactSec = document.getElementById('contact');
      if (contactSec) {
        window.scrollTo({
          top: contactSec.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    };
  }

  modal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeServiceModal() {
  const modal = document.getElementById('serviceDetailModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }
}

/* --------------------------------------------------------------------------
   08. REAL PRODUCTION FORMS & LIVE BACKEND INTEGRATION
   -------------------------------------------------------------------------- */
function initForms() {
  // 1. Consultation Form (Modal on Homepage & Index)
  const form = document.getElementById('consultationForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('consultationName')?.value?.trim();
      const phone = document.getElementById('consultationPhone')?.value?.trim();
      const email = document.getElementById('consultationEmail')?.value?.trim();
      const serviceSelect = document.getElementById('consultationService');
      const service = serviceSelect?.options[serviceSelect.selectedIndex]?.text || '';
      const desc = document.getElementById('consultationDesc')?.value?.trim();
      const chk = document.getElementById('consultationConflictChk')?.checked;
      const alertBox = document.getElementById('consultationStatusAlert');

      if (!name || !phone || !email || !desc || !chk) {
        if (alertBox) {
          alertBox.className = 'form-status-alert error';
          alertBox.textContent = currentLang === 'ar' 
            ? 'يرجى استكمال جميع الحقول الإلزامية وتأكيد إقرار فحص تعارض المصالح.'
            : 'Please complete all required fields and certify the conflict of interest statement.';
        }
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = currentLang === 'ar'
        ? '<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ الطلب في النظام...'
        : '<i class="fa-solid fa-spinner fa-spin"></i> Processing Request...';

      try {
        const res = await fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_type: 'individual',
            client_name: name,
            phone: phone,
            email: email,
            service_requested: service,
            summary: desc,
            conflict_check_confirmed: chk
          })
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'فشل إرسال الطلب، يرجى المحاولة لاحقاً.');
        }

        const refCode = result.ref_number;
        form.reset();

        if (alertBox) {
          alertBox.className = 'form-status-alert success';
          const waMsg = currentLang === 'ar'
            ? encodeURIComponent(`السلام عليكم، قمت بتقديم طلب استشارة عبر الموقع برقم مرجع: ${refCode} - الاسم: ${name}`)
            : encodeURIComponent(`Hello, I have submitted a consultation request via the website with Reference: ${refCode} - Name: ${name}`);
          
          alertBox.innerHTML = currentLang === 'ar'
            ? `<strong>تم استلام وتسجيل طلبكم بنجاح برقم مرجع: <span style="color:var(--c-gold); font-family:monospace;">${refCode}</span></strong><br>
               تم إيداع الطلب لدى الفريق القانوني لفحص تعارض المصالح المهني وتأكيد الموعد النهائي رسمياً.<br>
               <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
                 <a href="https://wa.me/966559787755?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">
                   <i class="fa-brands fa-whatsapp"></i>
                   <span>متابعة فورية عبر واتساب <bdi dir="ltr" class="phone-val">(055 978 7755)</bdi></span>
                 </a>
                 <a href="tel:+966559787755" class="btn btn-outline-forest btn-sm">
                   <i class="fa-solid fa-phone"></i>
                   <span>اتصال مباشر: <bdi dir="ltr" class="phone-val">055 978 7755</bdi></span>
                 </a>
               </div>`
            : `<strong>Your consultation request has been registered under Ref: <span style="color:var(--c-gold); font-family:monospace;">${refCode}</span></strong><br>
               Our legal team has logged your file for conflict check verification before final scheduling.<br>
               <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
                 <a href="https://wa.me/966559787755?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">
                   <i class="fa-brands fa-whatsapp"></i>
                   <span>Direct WhatsApp Follow-up <bdi dir="ltr" class="phone-val">(055 978 7755)</bdi></span>
                 </a>
                 <a href="tel:+966559787755" class="btn btn-outline-forest btn-sm">
                   <i class="fa-solid fa-phone"></i>
                   <span>Direct Call: <bdi dir="ltr" class="phone-val">055 978 7755</bdi></span>
                 </a>
               </div>`;
        }
      } catch (err) {
        if (alertBox) {
          alertBox.className = 'form-status-alert error';
          alertBox.textContent = err.message;
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // 2. Direct Contact Form (contact.html)
  const contactForm = document.getElementById('directContactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('cName')?.value?.trim();
      const phone = document.getElementById('cPhone')?.value?.trim();
      const email = document.getElementById('cEmail')?.value?.trim();
      const subject = document.getElementById('cSubject')?.value?.trim();
      const message = document.getElementById('cMsg')?.value?.trim();
      const alertBox = document.getElementById('contactStatusAlert');

      if (!name || !phone || !message) {
        if (alertBox) {
          alertBox.className = 'form-status-alert error';
          alertBox.textContent = 'يرجى تعبئة الحقول الإلزامية (الاسم، الجوال، والرسالة).';
        }
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الرسالة...';

      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name,
            phone: phone,
            email: email,
            subject: subject || 'استفسار عبر نموذج التواصل',
            message: message
          })
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'فشل إرسال الاستفسار، يرجى المحاولة ثانية.');
        }

        contactForm.reset();
        if (alertBox) {
          alertBox.className = 'form-status-alert success';
          alertBox.innerHTML = `
            <strong>تم استلام استفساركم بنجاح برقم مرجع: <span style="color:var(--c-gold); font-family:monospace;">${result.ref_number}</span></strong><br>
            سيتواصل معكم فريق العمل في أقرب وقت عبر رقم الجوال المسجل.
          `;
        }
      } catch (err) {
        if (alertBox) {
          alertBox.className = 'form-status-alert error';
          alertBox.textContent = err.message;
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // 3. Consultation Portal Form (consultation.html)
  const portalForm = document.getElementById('portalConsultationForm');
  if (portalForm) {
    portalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const clientType = portalForm.querySelector('input[name="clientType"]:checked')?.value || 'individual';
      const name = document.getElementById('pName')?.value?.trim();
      const entity = document.getElementById('pEntity')?.value?.trim();
      const phone = document.getElementById('pPhone')?.value?.trim();
      const email = document.getElementById('pEmail')?.value?.trim();
      const serviceSelect = document.getElementById('pService');
      const service = serviceSelect?.options[serviceSelect.selectedIndex]?.text || '';
      const format = document.getElementById('pFormat')?.value || 'office';
      const desc = document.getElementById('pDesc')?.value?.trim();
      const chk = document.getElementById('pConflictChk')?.checked;
      const alertBox = document.getElementById('portalStatusAlert');

      if (!name || !phone || !desc || !chk) {
        if (alertBox) {
          alertBox.className = 'form-status-alert error';
          alertBox.textContent = 'يرجى تعبئة الحقول الإلزامية والموافقة على فحص تعارض المصالح.';
        }
        return;
      }

      const submitBtn = portalForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تسجيل طلب الاستشارة...';

      try {
        const res = await fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_type: clientType,
            client_name: entity ? `${name} (${entity})` : name,
            phone: phone,
            email: email,
            service_requested: service,
            preferred_channel: format,
            summary: desc,
            conflict_check_confirmed: chk
          })
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'تعذر تسجيل الطلب.');
        }

        portalForm.reset();
        if (alertBox) {
          alertBox.className = 'form-status-alert success';
          const waMsg = encodeURIComponent(`السلام عليكم، قمت بتقديم طلب استشارة عبر بوابة نافذين برقم مرجع: ${result.ref_number} - الاسم: ${name}`);
          alertBox.innerHTML = `
            <strong>تم استلام طلبكم بنجاح برقم مرجع: <span style="color:var(--c-gold); font-family:monospace;">${result.ref_number}</span></strong><br>
            سيتم تدقيق الطلب وفحص تعارض المصالح والتواصل معكم لتحديد الموعد النهائي المؤكد.<br>
            <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
              <a href="https://wa.me/966559787755?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">
                <i class="fa-brands fa-whatsapp"></i> متابعة فورية عبر واتساب
              </a>
            </div>
          `;
        }
      } catch (err) {
        if (alertBox) {
          alertBox.className = 'form-status-alert error';
          alertBox.textContent = err.message;
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
}

/* --------------------------------------------------------------------------
   09. DYNAMIC CMS CONTENT HYDRATION (FETCHES PUBLISHED CMS DATA)
   -------------------------------------------------------------------------- */
async function initCmsContent() {
  try {
    const res = await fetch('/api/content/published');
    if (!res.ok) return;
    const { data } = await res.json();
    if (!data) return;

    // 1. Hydrate Site Sections (Hero, About)
    if (Array.isArray(data.sections)) {
      const heroSec = data.sections.find(s => s.section_key === 'hero');
      if (heroSec) {
        const hc = heroSec.content_ar || {};
        if (hc.title_line1) {
          const t1 = document.querySelector('.hero-title-line1');
          if (t1) t1.textContent = hc.title_line1;
        }
        if (hc.title_line2) {
          const t2 = document.querySelector('.hero-title-line2');
          if (t2) t2.textContent = hc.title_line2;
        }
        if (hc.poetic_statement) {
          const ps = document.querySelector('.hero-poetic-statement');
          if (ps) ps.textContent = hc.poetic_statement;
        }
        if (hc.description) {
          const desc = document.querySelector('.hero-desc');
          if (desc) desc.textContent = hc.description;
        }
        if (hc.cta_primary_text) {
          const cta1 = document.querySelector('.btn-hero-primary span');
          if (cta1) cta1.textContent = hc.cta_primary_text;
        }
        if (hc.cta_secondary_text) {
          const cta2 = document.querySelector('.btn-hero-secondary span');
          if (cta2) cta2.textContent = hc.cta_secondary_text;
        }
      }

      const aboutSec = data.sections.find(s => s.section_key === 'about');
      if (aboutSec) {
        const ac = aboutSec.content_ar || {};
        const aboutTitle = document.querySelector('.about-content-col .section-title');
        if (aboutTitle && aboutSec.title_ar) aboutTitle.textContent = aboutSec.title_ar;
        const aboutLead = document.querySelector('.about-content-col .lead-text');
        if (aboutLead && ac.body_ar) aboutLead.textContent = ac.body_ar;
      }
    }

    // 2. Hydrate Company Settings
    if (data.settings) {
      const s = data.settings;
      if (s.phone) {
        document.querySelectorAll('.phone-val').forEach(el => {
          el.textContent = s.phone;
        });
      }
      if (s.phone_intl) {
        document.querySelectorAll('a[href^="tel:"]').forEach(el => {
          el.href = `tel:${s.phone_intl}`;
        });
      }
      if (s.whatsapp) {
        const cleanWa = s.whatsapp.replace(/[^0-9]/g, '');
        document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
          const url = new URL(el.href);
          const textParam = url.searchParams.get('text');
          el.href = `https://wa.me/${cleanWa}${textParam ? '?text=' + encodeURIComponent(textParam) : ''}`;
        });
      }
    }
  } catch (err) {
    // Graceful fallback to pre-rendered HTML on connection issues
    console.debug('CMS dynamic hydration notice:', err.message);
  }
}

/* --------------------------------------------------------------------------
   09. SMOOTH SCROLLING FOR IN-PAGE ANCHORS
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      if (!targetId) return;

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = document.getElementById('siteHeader')?.offsetHeight || 72;
        const targetPos = targetEl.offsetTop - navHeight;

        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });
}
