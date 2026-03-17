(function () {
  var page = document.body.dataset.page;
  var state = {
    userDashboard: null,
    companyDashboard: null,
    adminDashboard: null,
    jobsPage: null,
    jobDetails: null,
    applicationStatusPage: null,
    currentUser: null,
    menuContext: null,
    theme: "light"
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    applyTheme(loadTheme());
    setHeaderMenu(defaultMenuContext());
    bindHeaderMenu();
    bindThemeControls();
    bindLogoutButtons();
    applyDefaultSeo();

    if (page === "landing") {
      initLanding();
      return;
    }

    if (page === "login") {
      initLogin();
      return;
    }

    if (page === "register") {
      initRegister();
      return;
    }

    if (page === "user") {
      initUserPage();
      return;
    }

    if (page === "company") {
      initCompanyPage();
      return;
    }

    if (page === "admin") {
      initAdminPage();
      return;
    }

    if (page === "jobs") {
      initJobsPage();
      return;
    }

    if (page === "job-details") {
      initJobDetailsPage();
      return;
    }

    if (page === "application-status") {
      initApplicationStatusPage();
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function jobDetailsHref(jobId) {
    return "job-details.html?job=" + encodeURIComponent(String(jobId));
  }

  function applicationStatusHref(applicationId) {
    return "application-status.html?application=" + encodeURIComponent(String(applicationId));
  }

  function dashboardHref(user) {
    if (!user) {
      return "login.html";
    }
    if (user.role === "admin") {
      return "admin.html";
    }
    return user.role === "company" ? "company.html" : "user.html";
  }

  function normalizeAuthRole(role) {
    return role === "company" ? "company" : "fresher";
  }

  function replaceQueryParam(name, value) {
    var url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  function pageSeoDefaults(pageName) {
    if (pageName === "landing") {
      return {
        title: "Fresher Connect | Entry-Level Jobs and Hiring Platform for Freshers",
        description: "Discover fresher-friendly jobs, review detailed hiring workflows, and help companies manage structured entry-level hiring from one platform.",
        robots: "index,follow,max-image-preview:large"
      };
    }

    if (pageName === "jobs") {
      return {
        title: "Fresher Jobs | Fresher Connect",
        description: "Browse entry-level jobs, internships, and fresher-friendly roles with searchable filters, detailed requirements, compensation, and hiring stages.",
        robots: "index,follow,max-image-preview:large"
      };
    }

    if (pageName === "job-details") {
      return {
        title: "Job Details | Fresher Connect",
        description: "Open a fresher-friendly job, review role requirements, compensation, company information, and hiring stages before applying.",
        robots: "index,follow,max-image-preview:large"
      };
    }

    if (pageName === "login") {
      return {
        title: "Login | Fresher Connect",
        description: "Access your Fresher Connect account to continue job search or company hiring workflows.",
        robots: "noindex,nofollow"
      };
    }

    if (pageName === "register") {
      return {
        title: "Register | Fresher Connect",
        description: "Create a fresher or company account on Fresher Connect.",
        robots: "noindex,nofollow"
      };
    }

    if (pageName === "company-login") {
      return {
        title: "Company Login | Fresher Connect",
        description: "Sign in to the Fresher Connect company dashboard.",
        robots: "noindex,nofollow"
      };
    }

    if (pageName === "company") {
      return {
        title: "Company Dashboard | Fresher Connect",
        description: "Manage jobs, candidates, and hiring workflows in the company dashboard.",
        robots: "noindex,nofollow"
      };
    }

    if (pageName === "user") {
      return {
        title: "Candidate Dashboard | Fresher Connect",
        description: "Track applications, saved jobs, and candidate profile details.",
        robots: "noindex,nofollow"
      };
    }

    if (pageName === "admin") {
      return {
        title: "Admin Dashboard | Fresher Connect",
        description: "Manage users, jobs, and moderation controls in the admin dashboard.",
        robots: "noindex,nofollow"
      };
    }

    if (pageName === "application-status") {
      return {
        title: "Application Status | Fresher Connect",
        description: "Track current hiring stage and application progress.",
        robots: "noindex,nofollow"
      };
    }

    return {
      title: document.title,
      description: "Fresher Connect helps freshers discover jobs and gives companies a cleaner hiring workspace.",
      robots: "index,follow,max-image-preview:large"
    };
  }

  function buildCanonicalUrl(keepParams) {
    var current = new URL(window.location.href);
    var canonical = new URL(current.pathname, current.origin);
    (keepParams || []).forEach(function (key) {
      var value = current.searchParams.get(key);
      if (value) {
        canonical.searchParams.set(key, value);
      }
    });
    return canonical.toString();
  }

  function upsertMetaTag(attributeName, attributeValue, content) {
    var selector = 'meta[' + attributeName + '="' + attributeValue + '"]';
    var tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attributeName, attributeValue);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  }

  function upsertLinkTag(rel, href) {
    var selector = 'link[rel="' + rel + '"]';
    var tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement("link");
      tag.setAttribute("rel", rel);
      document.head.appendChild(tag);
    }
    tag.setAttribute("href", href);
  }

  function setSeoStructuredData(data) {
    var id = "seo-structured-data";
    var script = document.getElementById(id);
    if (!data) {
      if (script) {
        script.remove();
      }
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);
  }

  function applySeo(config) {
    var effectiveConfig = config || {};
    var title = effectiveConfig.title || document.title;
    var description = effectiveConfig.description || "";
    var canonicalUrl = effectiveConfig.canonicalUrl || buildCanonicalUrl(effectiveConfig.keepParams || []);

    document.title = title;

    upsertMetaTag("name", "description", description);
    upsertMetaTag("name", "robots", effectiveConfig.robots || "index,follow,max-image-preview:large");
    upsertMetaTag("name", "theme-color", "#123a72");
    upsertMetaTag("property", "og:site_name", "Fresher Connect");
    upsertMetaTag("property", "og:type", effectiveConfig.ogType || "website");
    upsertMetaTag("property", "og:title", effectiveConfig.ogTitle || title);
    upsertMetaTag("property", "og:description", effectiveConfig.ogDescription || description);
    upsertMetaTag("property", "og:url", canonicalUrl);
    upsertMetaTag("name", "twitter:card", effectiveConfig.twitterCard || "summary");
    upsertMetaTag("name", "twitter:title", effectiveConfig.twitterTitle || title);
    upsertMetaTag("name", "twitter:description", effectiveConfig.twitterDescription || description);
    upsertLinkTag("canonical", canonicalUrl);
    setSeoStructuredData(effectiveConfig.jsonLd || null);
  }

  function buildLandingStructuredData() {
    var homeUrl = buildCanonicalUrl([]);
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Fresher Connect",
        url: homeUrl,
        description: "Entry-level hiring platform for freshers and companies."
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Fresher Connect",
        url: homeUrl,
        logo: window.location.origin + "/components/fc-logo.svg",
        sameAs: [
          "https://www.linkedin.com",
          "https://www.instagram.com",
          "https://x.com",
          "https://www.youtube.com"
        ]
      }
    ];
  }

  function buildJobsStructuredData() {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Fresher Jobs | Fresher Connect",
      url: buildCanonicalUrl([]),
      description: "Browse entry-level jobs, internships, and fresher-friendly roles with searchable filters and detailed hiring workflows."
    };
  }

  function applyDefaultSeo() {
    var defaults = pageSeoDefaults(page);
    if (page === "landing") {
      defaults.jsonLd = buildLandingStructuredData();
    } else if (page === "jobs") {
      defaults.jsonLd = buildJobsStructuredData();
    }
    applySeo(defaults);
  }

  var LOGIN_ROLE_CONTENT = {
    fresher: {
      documentTitle: "Fresher Login | Fresher Connect",
      pageLabel: "Fresher Login",
      pageTitle: "Pick up your job search without losing track.",
      pageDescription: "Candidate accounts open job discovery, saved applications, and clear status tracking in one place.",
      roleSummary: "Use your fresher account to continue browsing roles, reviewing details, and tracking application progress.",
      featureA: {
        kicker: "Candidate Dashboard",
        title: "Search, apply, track",
        body: "Open jobs, save time with filters, and keep every application status in one place."
      },
      featureB: {
        kicker: "Application Status",
        title: "Stay clear on next steps",
        body: "Check your current stage, revisit past applications, and continue from the right page faster."
      },
      flowLabel: "Fresher Flow",
      flowPoints: [
        "Job listing and job details stay available before login.",
        "Application status is unlocked after fresher sign-in.",
        "Session and CSRF protection continue through the backend API."
      ],
      cardLabel: "Candidate Access",
      cardTitle: "Welcome back",
      cardDescription: "Use the email and password already registered on the platform.",
      noteTitle: "Fresher workspace",
      noteBody: "Open jobs, revisit applications, and keep your next hiring step visible after sign in.",
      submitText: "Login as fresher",
      registerPrompt: "New here?",
      registerText: "Create a fresher account",
      registerHref: "register.html"
    },
    company: {
      documentTitle: "Company Login | Fresher Connect",
      pageLabel: "Company Login",
      pageTitle: "Return to your hiring workspace and move candidates forward.",
      pageDescription: "Company accounts open job posting, applicant review, and hiring pipeline management in one dashboard.",
      roleSummary: "Use your company account to publish openings, review fresher profiles, and update every hiring stage.",
      featureA: {
        kicker: "Hiring Workspace",
        title: "Post and manage openings",
        body: "Create fresher roles with structured fields, keep details consistent, and stay ready for new applicants."
      },
      featureB: {
        kicker: "Applicant Pipeline",
        title: "Review and update candidates",
        body: "Shortlist faster, move applicants between stages, and keep the hiring team aligned from one workspace."
      },
      flowLabel: "Company Flow",
      flowPoints: [
        "Company sign-in opens job posting, applicant review, and status updates.",
        "Unauthenticated dashboard access returns to the recruiter login entry point.",
        "Session and CSRF protection continue through the backend API."
      ],
      cardLabel: "Company Access",
      cardTitle: "Recruiter sign in",
      cardDescription: "Use the company email and password already registered on the platform.",
      noteTitle: "Hiring workspace",
      noteBody: "Create roles, review applicants, and keep every pipeline update inside the company dashboard.",
      submitText: "Login to company dashboard",
      registerPrompt: "Hiring for the first time?",
      registerText: "Create a company account",
      registerHref: "register.html?role=company"
    }
  };

  function loadTheme() {
    var savedTheme = "";
    try {
      savedTheme = window.sessionStorage.getItem("fc_theme") || "";
    } catch (_error) {
      savedTheme = "";
    }
    return savedTheme === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.theme);
  }

  function defaultMenuContext() {
    return {
      user: null,
      menuLabel: "Quick access",
      pageLabel: "Landing page",
      summary: "Profile, settings, logout, and more",
      title: "Open menu",
      subtitle: "Profile, settings, and more",
      badgeText: "FC",
      profileTarget: null,
      profileHref: "login.html",
      settingsTitle: "Settings",
      settingsDescription: "See account details, connection info, and useful shortcuts.",
      moreTitle: "More",
      moreDescription: "Quick links to move through Fresher Connect.",
      moreLinks: [
        { href: "index.html", label: "Home", description: "Back to the landing page." },
        { href: "jobs.html", label: "Jobs", description: "Browse the live job listing." },
        { href: "login.html", label: "Login", description: "Sign in to your account." },
        { href: "register.html", label: "Create account", description: "Register as fresher or company." }
      ]
    };
  }

  function initialsFrom(value) {
    var text = String(value || "").trim();
    if (!text) {
      return "FC";
    }
    return text
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function setHeaderMenu(context) {
    state.menuContext = Object.assign(defaultMenuContext(), context || {});
    var menuToggle = document.querySelector("[data-menu-toggle]");

    if (byId("headerSummaryText")) {
      byId("headerSummaryText").textContent = state.menuContext.summary;
    }
    if (byId("menuPanelLabel")) {
      byId("menuPanelLabel").textContent = state.menuContext.menuLabel;
    }
    if (byId("menuPanelTitle")) {
      byId("menuPanelTitle").textContent = state.menuContext.summary;
    }
    if (byId("menuButtonTitle")) {
      byId("menuButtonTitle").textContent = state.menuContext.title;
    }
    if (menuToggle) {
      menuToggle.setAttribute("aria-label", state.menuContext.title);
      menuToggle.setAttribute("title", state.menuContext.title);
    }
  }

  function openMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-menu-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.setAttribute("aria-expanded", "true");
    panel.classList.remove("hidden");
  }

  function closeMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-menu-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.setAttribute("aria-expanded", "false");
    panel.classList.add("hidden");
  }

  function openSheet(label, title, description, bodyHtml) {
    var sheet = byId("menuSheet");
    var overlay = document.querySelector("[data-menu-overlay]");
    if (!sheet || !overlay) {
      return;
    }

    byId("menuSheetLabel").textContent = label;
    byId("menuSheetTitle").textContent = title;
    byId("menuSheetDescription").textContent = description;
    byId("menuSheetBody").innerHTML = bodyHtml;

    sheet.classList.remove("hidden");
    overlay.classList.remove("hidden");
    sheet.setAttribute("aria-hidden", "false");
  }

  function closeSheet() {
    var sheet = byId("menuSheet");
    var overlay = document.querySelector("[data-menu-overlay]");
    if (!sheet || !overlay) {
      return;
    }
    sheet.classList.add("hidden");
    overlay.classList.add("hidden");
    sheet.setAttribute("aria-hidden", "true");
  }

  function bindHeaderMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-menu-panel]");
    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      if (panel.classList.contains("hidden")) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    panel.addEventListener("click", function (event) {
      var actionButton = event.target.closest("[data-menu-action]");
      if (!actionButton) {
        return;
      }
      handleMenuAction(actionButton.dataset.menuAction);
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-menu-close], [data-menu-overlay]")) {
        closeSheet();
        return;
      }

      if (!event.target.closest(".menu-shell")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
        closeSheet();
      }
    });

    document.addEventListener("click", function (event) {
      var actionLink = event.target.closest("[data-sheet-target]");
      if (!actionLink) {
        return;
      }

      event.preventDefault();
      closeSheet();
      focusTarget(actionLink.dataset.sheetTarget);
    });
  }

  function bindThemeControls() {
    document.addEventListener("click", function (event) {
      var themeButton = event.target.closest("[data-theme-option]");
      if (!themeButton) {
        return;
      }

      event.preventDefault();
      applyTheme(themeButton.dataset.themeOption);
      try {
        window.sessionStorage.setItem("fc_theme", state.theme);
      } catch (_error) {
        // Ignore storage failures and keep the current theme in memory.
      }
      openSettingsSheet();
    });
  }

  function focusTarget(targetId) {
    var target = byId(targetId);
    if (!target) {
      return false;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("target-highlight");
    window.setTimeout(function () {
      target.classList.remove("target-highlight");
    }, 1800);
    return true;
  }

  function settingsMarkup() {
    var context = state.menuContext || defaultMenuContext();
    var user = context.user;
    var details;

    if (user) {
      details = [
        { label: "Account", value: context.badgeText || user.name || user.email },
        { label: "Email", value: user.email || "-" },
        { label: "Role", value: toTitleCase(user.role || "user") },
        { label: "Current page", value: context.pageLabel || "-" },
        { label: "API endpoint", value: window.FC_API.getApiBase() }
      ];
    } else {
      details = [
        { label: "Status", value: "You are not signed in right now." },
        { label: "Profile", value: "Login first to open profile and account controls." },
        { label: "API endpoint", value: window.FC_API.getApiBase() }
      ];
    }

    return (
      renderDetailItems(details) +
      themeSwitcherMarkup() +
      renderSheetLinks(
        user
          ? [
              {
                href: context.profileHref || "#",
                label: "Open dashboard",
                description: "Go to your main workspace."
              }
            ]
          : [
              { href: "login.html", label: "Login", description: "Access your existing account." },
              { href: "register.html", label: "Create account", description: "Register and start using the platform." }
            ]
      )
    );
  }

  function themeSwitcherMarkup() {
    return (
      '<div class="theme-card">' +
      '<div class="page-intro">' +
      '<span class="section-label">Theme</span>' +
      '<h3>Choose your display mode</h3>' +
      '<p class="muted">Switch between light theme and dark theme from settings.</p>' +
      "</div>" +
      '<div class="theme-switcher">' +
      '<button class="theme-option' +
      (state.theme === "light" ? " active" : "") +
      '" type="button" data-theme-option="light">Light theme</button>' +
      '<button class="theme-option' +
      (state.theme === "dark" ? " active" : "") +
      '" type="button" data-theme-option="dark">Dark theme</button>' +
      "</div>" +
      "</div>"
    );
  }

  function renderDetailItems(items) {
    return (
      '<div class="detail-list">' +
      items
        .map(function (item) {
          return (
            '<div class="detail-item"><strong>' +
            window.FC_API.escapeHtml(item.label) +
            "</strong><span>" +
            window.FC_API.escapeHtml(item.value) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function editProfileFormMarkup(user) {
    return (
      '<form id="editProfileForm" class="form-grid">' +
      '<div class="field">' +
      '<label for="editName">Full name</label>' +
      '<input id="editName" name="name" type="text" value="' + window.FC_API.escapeHtml(user.name || "") + '" required>' +
      "</div>" +
      '<div class="field">' +
      '<label for="editPhone">Phone</label>' +
      '<input id="editPhone" name="phone" type="text" value="' + window.FC_API.escapeHtml(user.phone || "") + '">' +
      "</div>" +
      '<div class="field">' +
      '<label for="editLocation">Location</label>' +
      '<input id="editLocation" name="location" type="text" value="' + window.FC_API.escapeHtml(user.location || "") + '">' +
      "</div>" +
      '<div class="field">' +
      '<label for="editEducation">Education</label>' +
      '<input id="editEducation" name="education" type="text" value="' + window.FC_API.escapeHtml(user.education || "") + '" required>' +
      "</div>" +
      '<div class="field">' +
      '<label for="editGradYear">Graduation year</label>' +
      '<input id="editGradYear" name="grad_year" type="number" value="' + window.FC_API.escapeHtml(String(user.grad_year || "")) + '" required>' +
      "</div>" +
      '<div class="field">' +
      '<label for="editSkills">Skills</label>' +
      '<input id="editSkills" name="skills" type="text" value="' + window.FC_API.escapeHtml(safeJoin(user.skills).replace(/^-$/, "")) + '" placeholder="Python, SQL, Git">' +
      "</div>" +
      '<div class="field">' +
      '<label for="editExperience">Experience</label>' +
      '<input id="editExperience" name="experience" type="text" value="' + window.FC_API.escapeHtml(user.experience || "") + '" placeholder="Fresher, 0-1 year, internship">' +
      "</div>" +
      '<div class="field">' +
      '<label for="editLinkedin">LinkedIn</label>' +
      '<input id="editLinkedin" name="linkedin" type="url" value="' + window.FC_API.escapeHtml(user.linkedin || "") + '" placeholder="https://linkedin.com/in/your-profile">' +
      "</div>" +
      '<div class="field">' +
      '<label for="editPortfolio">Portfolio</label>' +
      '<input id="editPortfolio" name="portfolio" type="url" value="' + window.FC_API.escapeHtml(user.portfolio || "") + '" placeholder="https://portfolio.example.com">' +
      "</div>" +
      '<div class="field">' +
      '<label for="editSummary">Summary</label>' +
      '<textarea id="editSummary" name="summary" rows="4" placeholder="Write a short profile summary">' + window.FC_API.escapeHtml(user.summary || "") + "</textarea>" +
      "</div>" +
      '<div class="field">' +
      '<label for="editResume">Resume link</label>' +
      '<input id="editResume" name="resume_path" type="text" value="' + window.FC_API.escapeHtml(user.resume_path || "") + '" placeholder="Existing resume link">' +
      "</div>" +
      '<div class="field">' +
      '<label for="editResumeFile">Resume file</label>' +
      '<input id="editResumeFile" name="resume_file" type="file" accept=".pdf,.doc,.docx">' +
      '<p class="helper-text field-note">Upload PDF, DOC, or DOCX up to 2 MB.</p>' +
      "</div>" +
      '<div id="editProfileMessage" class="form-message"></div>' +
      '<div class="button-row">' +
      '<button class="btn primary" type="submit">Save profile</button>' +
      '<button class="btn ghost" type="button" data-menu-close>Cancel</button>' +
      "</div>" +
      "</form>"
    );
  }

  function renderSheetLinks(links) {
    return (
      '<div class="sheet-links">' +
      links
        .map(function (link) {
          var href = link.href || "#";
          var target = link.target ? ' data-sheet-target="' + link.target + '"' : "";
          return (
            '<a class="sheet-link" href="' +
            href +
            '"' +
            target +
            ">" +
            '<strong>' + window.FC_API.escapeHtml(link.label) + "</strong>" +
            '<span>' + window.FC_API.escapeHtml(link.description || "") + "</span>" +
            "</a>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function openSettingsSheet() {
    var context = state.menuContext || defaultMenuContext();
    openSheet(
      "Settings",
      context.settingsTitle,
      context.settingsDescription,
      settingsMarkup()
    );
  }

  function openMoreSheet() {
    var context = state.menuContext || defaultMenuContext();
    openSheet(
      "More",
      context.moreTitle,
      context.moreDescription,
      renderSheetLinks(context.moreLinks || [])
    );
  }

  function openUserProfileEditor() {
    if (!state.userDashboard || !state.userDashboard.user) {
      return;
    }

    openSheet(
      "Edit Profile",
      "Update your profile",
      "Save fresher details, skills, summary, and resume information.",
      editProfileFormMarkup(state.userDashboard.user)
    );
  }

  function handleMenuAction(action) {
    closeMenu();

    if (action === "profile") {
      if (state.menuContext && state.menuContext.profileTarget && focusTarget(state.menuContext.profileTarget)) {
        return;
      }

      if (state.menuContext && state.menuContext.profileHref) {
        window.location.href = state.menuContext.profileHref;
        return;
      }

      window.location.href = "login.html";
      return;
    }

    if (action === "settings") {
      openSettingsSheet();
      return;
    }

    if (action === "more") {
      openMoreSheet();
    }
  }

  function setMessage(node, text, type) {
    if (!node) {
      return;
    }
    node.textContent = text || "";
    node.className = "form-message" + (type ? " " + type : "");
  }

  function setText(id, value) {
    var node = byId(id);
    if (!node) {
      return;
    }
    node.textContent = value || "";
  }

  function bindLogoutButtons() {
    document.querySelectorAll("[data-action='logout']").forEach(function (button) {
      button.addEventListener("click", async function () {
        try {
          await window.FC_API.request("/api/auth/logout", { method: "POST" });
        } catch (_error) {
          // Session may already be cleared; redirect anyway.
        }
        if (page === "landing") {
          window.location.href = "index.html";
          return;
        }
        if (page === "company") {
          window.location.href = "company-login.html";
          return;
        }
        window.location.href = "login.html";
      });
    });
  }

  function readForm(form) {
    var formData = new FormData(form);
    var payload = {};
    formData.forEach(function (value, key) {
      payload[key] = typeof value === "string" ? value.trim() : value;
    });
    return payload;
  }

  function normalizeLandingReviewRole(role) {
    if (role === "company") {
      return "company";
    }
    if (role === "guest") {
      return "guest";
    }
    return "fresher";
  }

  function landingReviewRoleLabel(role) {
    if (role === "company") {
      return "Company";
    }
    if (role === "guest") {
      return "Guest";
    }
    return "Fresher";
  }

  function normalizeLandingReview(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    var rating = Math.max(1, Math.min(5, Math.round(toNumber(raw.rating) || 5)));
    var reviewText = String(raw.review || "").trim();
    if (!reviewText) {
      return null;
    }

    return {
      id: raw.id,
      name: String(raw.name || "Fresher Connect user").trim() || "Fresher Connect user",
      role: normalizeLandingReviewRole(raw.role),
      rating: rating,
      review: reviewText,
      submitted_at: raw.created_at || raw.submitted_at || new Date().toISOString()
    };
  }

  async function loadLandingReviews() {
    var response = await window.FC_API.request("/api/reviews?limit=8");
    return (response.reviews || [])
      .map(normalizeLandingReview)
      .filter(Boolean)
      .slice(0, 8);
  }

  function landingReviewStarsMarkup(rating) {
    return "&#9733;".repeat(rating) + "&#9734;".repeat(Math.max(0, 5 - rating));
  }

  function renderLandingReviews(reviews) {
    var list = byId("reviewList");
    if (!list) {
      return;
    }

    if (!reviews.length) {
      list.innerHTML = '<div class="review-empty">No reviews yet. Be the first to share your feedback.</div>';
      return;
    }

    list.innerHTML = reviews
      .map(function (review) {
        return (
          '<article class="review-card">' +
          '<div class="review-card-top">' +
          '<div class="review-author">' +
          "<strong>" + window.FC_API.escapeHtml(review.name) + "</strong>" +
          '<span class="review-meta">' +
          window.FC_API.escapeHtml(landingReviewRoleLabel(review.role) + " | " + window.FC_API.formatDate(review.submitted_at)) +
          "</span>" +
          "</div>" +
          '<span class="review-stars" aria-label="' + review.rating + ' out of 5 stars">' +
          landingReviewStarsMarkup(review.rating) +
          "</span>" +
          "</div>" +
          '<p class="review-body">' + window.FC_API.escapeHtml(review.review) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  async function initLandingReviews() {
    var form = byId("reviewForm");
    var message = byId("reviewMessage");
    if (!form) {
      return;
    }

    var reviews = [];
    try {
      reviews = await loadLandingReviews();
      renderLandingReviews(reviews);
    } catch (error) {
      renderLandingReviews([]);
      setMessage(message, window.FC_API.getErrorMessage(error, "Unable to load reviews right now."), "error");
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var payload = readForm(form);
      setMessage(message, "Submitting review...");
      var review = normalizeLandingReview({
        name: payload.name,
        role: payload.role,
        rating: payload.rating,
        review: payload.review,
        submitted_at: new Date().toISOString()
      });

      if (!review) {
        setMessage(message, "Please enter a valid review before submitting.", "error");
        return;
      }

      try {
        var response = await window.FC_API.request("/api/reviews", {
          method: "POST",
          body: {
            name: payload.name,
            role: payload.role,
            rating: payload.rating,
            review: payload.review
          }
        });
        if (response.review) {
          reviews.unshift(normalizeLandingReview(response.review));
        } else {
          reviews = await loadLandingReviews();
        }
        reviews = reviews.filter(Boolean).slice(0, 8);
        renderLandingReviews(reviews);
        form.reset();
        byId("reviewRole").value = "fresher";
        byId("reviewRating").value = "5";
        setMessage(message, "Review added successfully.", "success");
      } catch (error) {
        setMessage(message, window.FC_API.getErrorMessage(error, "Unable to save review."), "error");
      }
    });
  }

  function debounce(fn, delay) {
    var timeoutId = null;
    return function () {
      var args = arguments;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        fn.apply(null, args);
      }, delay || 250);
    };
  }

  function splitFilterTerms(value) {
    return String(value || "")
      .split(",")
      .map(function (item) {
        return item.trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function normalizeJobFilters(raw) {
    return {
      search: String((raw && raw.search) || "").trim().toLowerCase(),
      category: String((raw && raw.category) || "").trim().toLowerCase(),
      location: String((raw && raw.location) || "").trim().toLowerCase(),
      company: String((raw && raw.company) || "").trim().toLowerCase(),
      experience: String((raw && raw.experience) || "").trim().toLowerCase(),
      skills: String((raw && raw.skills) || "").trim(),
      skillTerms: splitFilterTerms(raw && raw.skills),
      salaryMin: toNumber(raw && raw.salaryMin),
      salaryMax: toNumber(raw && raw.salaryMax)
    };
  }

  function buildJobFilterOptions(jobs) {
    return {
      categories: Array.from(new Set((jobs || []).reduce(function (items, job) {
        return items.concat(job.categories || []);
      }, []).filter(Boolean))).sort(),
      locations: Array.from(new Set((jobs || []).map(function (job) {
        return String(job.location || "").trim();
      }).filter(Boolean))).sort(),
      companies: Array.from(new Set((jobs || []).map(function (job) {
        return String(job.company_name || "").trim();
      }).filter(Boolean))).sort(),
      experience_levels: Array.from(new Set((jobs || []).map(function (job) {
        return String(job.experience_level || job.experience_required || "").trim();
      }).filter(Boolean))).sort()
    };
  }

  function populateOptions(select, items, defaultLabel) {
    if (!select) {
      return;
    }

    var currentValue = select.value;
    select.innerHTML = '<option value="">' + window.FC_API.escapeHtml(defaultLabel || "All options") + "</option>" +
      (items || [])
        .map(function (item) {
          return '<option value="' + window.FC_API.escapeHtml(item) + '">' + window.FC_API.escapeHtml(item) + "</option>";
        })
        .join("");
    if (currentValue) {
      select.value = currentValue;
    }
  }

  function populateDatalist(id, items) {
    var list = byId(id);
    if (!list) {
      return;
    }

    list.innerHTML = (items || [])
      .map(function (item) {
        return '<option value="' + window.FC_API.escapeHtml(item) + '"></option>';
      })
      .join("");
  }

  function populateJobFilterControls(prefix, jobs, options) {
    var filterOptions = options || buildJobFilterOptions(jobs || []);
    populateOptions(byId(prefix + "Category"), filterOptions.categories || [], "All categories");
    populateOptions(byId(prefix + "Experience"), filterOptions.experience_levels || [], "All experience levels");
    populateDatalist(prefix + "LocationList", filterOptions.locations || []);
    populateDatalist(prefix + "CompanyList", filterOptions.companies || []);
  }

  function readInputValue(id) {
    var field = byId(id);
    return field ? field.value : "";
  }

  function readJobFilters(prefix) {
    return normalizeJobFilters({
      search: readInputValue(prefix + "Search"),
      category: readInputValue(prefix + "Category"),
      location: readInputValue(prefix + "Location"),
      company: readInputValue(prefix + "Company"),
      skills: readInputValue(prefix + "Skills"),
      experience: readInputValue(prefix + "Experience"),
      salaryMin: readInputValue(prefix + "SalaryMin"),
      salaryMax: readInputValue(prefix + "SalaryMax")
    });
  }

  function buildJobsRequestPath(filters) {
    var params = new URLSearchParams();
    if (filters.search) {
      params.set("search", filters.search);
    }
    if (filters.category) {
      params.set("category", filters.category);
    }
    if (filters.location) {
      params.set("location", filters.location);
    }
    if (filters.company) {
      params.set("company", filters.company);
    }
    if (filters.skills) {
      params.set("skills", filters.skills);
    }
    if (filters.experience) {
      params.set("experience", filters.experience);
    }
    if (filters.salaryMin !== null) {
      params.set("salary_min", String(filters.salaryMin));
    }
    if (filters.salaryMax !== null) {
      params.set("salary_max", String(filters.salaryMax));
    }
    if (toNumber(filters.page) !== null) {
      params.set("page", String(Math.max(1, toNumber(filters.page))));
    }
    if (toNumber(filters.pageSize) !== null) {
      params.set("page_size", String(Math.max(1, toNumber(filters.pageSize))));
    }
    var query = params.toString();
    return "/api/jobs" + (query ? "?" + query : "");
  }

  function filterJobCollection(jobs, rawFilters) {
    var filters = normalizeJobFilters(rawFilters);

    return jobs.filter(function (job) {
      var haystack = [
        job.title,
        job.company_name,
        job.location || "",
        job.department || "",
        job.work_mode || "",
        job.industry_type || "",
        (job.categories || []).join(" "),
        (job.required_skills || []).join(" ")
      ]
        .join(" ")
        .toLowerCase();
      var skillHaystack = ((job.required_skills || []).join(" ")).toLowerCase();
      var jobSalaryMin = toNumber(job.salary_min);
      var jobSalaryMax = toNumber(job.salary_max);
      var matchesSearch = !filters.search || haystack.indexOf(filters.search) >= 0;
      var matchesCategory = !filters.category || (job.categories || []).some(function (item) {
        return item.toLowerCase() === filters.category;
      });
      var matchesLocation = !filters.location || String(job.location || "").toLowerCase().indexOf(filters.location) >= 0;
      var matchesCompany = !filters.company || String(job.company_name || "").toLowerCase().indexOf(filters.company) >= 0;
      var matchesExperience = !filters.experience || String(job.experience_level || job.experience_required || "").toLowerCase().indexOf(filters.experience) >= 0;
      var matchesSkills = !filters.skillTerms.length || filters.skillTerms.every(function (term) {
        return skillHaystack.indexOf(term) >= 0;
      });
      var matchesSalaryMin = filters.salaryMin === null || (jobSalaryMax !== null && jobSalaryMax >= filters.salaryMin);
      var matchesSalaryMax = filters.salaryMax === null || (jobSalaryMin !== null && jobSalaryMin <= filters.salaryMax);
      return matchesSearch && matchesCategory && matchesLocation && matchesCompany && matchesExperience && matchesSkills && matchesSalaryMin && matchesSalaryMax;
    });
  }

  function countApplicationsByStatus(applications) {
    var counts = {
      applied: 0,
      active: 0,
      offered: 0
    };

    (applications || []).forEach(function (application) {
      if (application.status === "offered") {
        counts.offered += 1;
      }
      if (["reviewing", "shortlisted", "interview"].indexOf(application.status) >= 0) {
        counts.active += 1;
      }
      counts.applied += 1;
    });
    return counts;
  }

  function timelineMarkup(steps, currentIndex) {
    if (!steps.length) {
      return '<div class="empty-state">Timeline data is not available for this item.</div>';
    }

    return steps
      .map(function (step, index) {
        var stateClass = "pending";
        if (currentIndex > index) {
          stateClass = "done";
        } else if (currentIndex === index) {
          stateClass = "current";
        }

        return (
          '<div class="timeline-step ' + stateClass + '">' +
          '<span class="timeline-index">' + window.FC_API.escapeHtml(String(index + 1)) + "</span>" +
          '<div class="timeline-copy">' +
          '<strong>' + window.FC_API.escapeHtml(step) + "</strong>" +
          "<span>" + window.FC_API.escapeHtml(stateClass === "current" ? "Current stage" : stateClass === "done" ? "Completed" : "Upcoming") + "</span>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function stageIndex(status) {
    var index = window.FC_API.statuses.indexOf(status);
    return index >= 0 ? index : 0;
  }

  function detailRowsMarkup(items) {
    return items
      .map(function (item) {
        return (
          '<div class="detail-item">' +
          '<span class="detail-label">' + window.FC_API.escapeHtml(item.label) + "</span>" +
          '<strong class="detail-value">' + window.FC_API.escapeHtml(item.value || "-") + "</strong>" +
          "</div>"
        );
      })
      .join("");
  }

  function detailParagraphMarkup(title, body, fallback) {
    return (
      '<div class="detail-paragraph">' +
      '<h3>' + window.FC_API.escapeHtml(title) + "</h3>" +
      '<p>' + window.FC_API.escapeHtml(body || fallback || "-") + "</p>" +
      "</div>"
    );
  }

  function jobCardMarkup(job, options) {
    var applied = options && options.application ? options.application : null;
    var showApply = options && options.showApply;
    var allowSave = options && options.allowSave;
    var isSaved = options && options.isSaved;
    var skills = (job.required_skills || []).slice(0, 3);
    var detailLink = jobDetailsHref(job.id);
    var saveAction = allowSave
      ? '<button class="btn ghost compact-btn save-job-button' + (isSaved ? " active-save" : "") + '" type="button" data-save-job-id="' + job.id + '" data-save-mode="' + (isSaved ? "remove" : "save") + '">' + (isSaved ? "Saved" : "Save job") + "</button>"
      : "";
    var footerAction = applied
      ? '<a class="text-link" href="' + applicationStatusHref(applied.id) + '">Open status</a>'
      : showApply
        ? '<button class="btn primary apply-button" type="button" data-job-id="' + job.id + '">Apply now</button>'
        : '<a class="btn ghost compact-btn" href="' + detailLink + '">Open details</a>';

    return (
      '<article class="card job-card">' +
      '<div class="job-card-top">' +
      '<div class="job-card-header">' +
      "<h3>" + window.FC_API.escapeHtml(job.title) + "</h3>" +
      '<span class="tag job-type-chip">' + window.FC_API.escapeHtml(job.job_type) + "</span>" +
      "</div>" +
      '<p class="meta-line">' +
      window.FC_API.escapeHtml(job.company_name) +
      " | " +
      window.FC_API.escapeHtml(job.location || "Location flexible") +
      " | " +
      window.FC_API.escapeHtml(toTitleCase(job.work_mode || "onsite")) +
      "</p>" +
      '<p class="job-description">' + window.FC_API.escapeHtml(job.description) + "</p>" +
      matchInsightsMarkup(job, { compact: true, limit: 3 }) +
      '<div class="tag-list">' +
      (job.categories || [])
        .map(function (category) {
          return '<span class="tag">' + window.FC_API.escapeHtml(category) + "</span>";
        })
        .join("") +
      skills
        .map(function (skill) {
          return '<span class="tag">' + window.FC_API.escapeHtml(skill) + "</span>";
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="job-card-bottom">' +
      '<div class="job-card-footer">' +
      '<div class="tag-list">' +
      '<span class="tag experience-chip">' + window.FC_API.escapeHtml(job.experience_level || "entry-level") + "</span>" +
      '<span class="tag experience-chip">' + window.FC_API.escapeHtml(formatCompensation(job)) + "</span>" +
      "</div>" +
      '<div class="job-card-actions">' + saveAction + footerAction + "</div>" +
      "</div>" +
      '<div class="card-link-row">' +
      '<a class="text-link" href="' + detailLink + '">View details</a>' +
      (applied
        ? '<a class="text-link" href="' + applicationStatusHref(applied.id) + '">Application status</a>'
        : isSaved
        ? '<span class="meta-line">Saved for quick comparison</span>'
        : '<span class="meta-line">Open details before applying</span>') +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderStatusPill(status) {
    var safeStatus = window.FC_API.statusClass(status);
    return (
      '<span class="status-pill ' +
      safeStatus +
      '">' +
      window.FC_API.escapeHtml(toTitleCase(safeStatus)) +
      "</span>"
    );
  }

  function pillMarkup(label, className) {
    return (
      '<span class="' + window.FC_API.escapeHtml(className || "tag") + '">' +
      window.FC_API.escapeHtml(label) +
      "</span>"
    );
  }

  function toTitleCase(value) {
    return String(value || "")
      .split("-")
      .join(" ")
      .split(" ")
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function safeJoin(list) {
    return Array.isArray(list) && list.length ? list.join(", ") : "-";
  }

  function compactLinkLabel(value) {
    var text = String(value || "").trim();
    if (!text) {
      return "-";
    }
    return text.replace(/^https?:\/\//i, "").replace(/\/+$/, "") || text;
  }

  function normalizeIsoDate(value) {
    if (!value) {
      return "";
    }
    var parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }

  function jobEmploymentType(jobType) {
    if (jobType === "internship") {
      return "INTERN";
    }
    if (jobType === "contract") {
      return "CONTRACTOR";
    }
    return "FULL_TIME";
  }

  function jobPostingDescription(job) {
    var sections = [];
    if (job.description) {
      sections.push("<p>" + window.FC_API.escapeHtml(job.description) + "</p>");
    }
    if (job.role_overview) {
      sections.push("<p>" + window.FC_API.escapeHtml(job.role_overview) + "</p>");
    }
    if (job.responsibilities) {
      sections.push("<p><strong>Responsibilities:</strong> " + window.FC_API.escapeHtml(job.responsibilities) + "</p>");
    }
    if (job.required_qualifications || job.requirements) {
      sections.push("<p><strong>Required qualifications:</strong> " + window.FC_API.escapeHtml(job.required_qualifications || job.requirements) + "</p>");
    }
    if (job.preferred_qualifications) {
      sections.push("<p><strong>Preferred qualifications:</strong> " + window.FC_API.escapeHtml(job.preferred_qualifications) + "</p>");
    }
    if ((job.required_skills || []).length) {
      sections.push(
        "<p><strong>Skills:</strong></p><ul>" +
          (job.required_skills || [])
            .map(function (skill) {
              return "<li>" + window.FC_API.escapeHtml(skill) + "</li>";
            })
            .join("") +
          "</ul>"
      );
    }
    return sections.join("");
  }

  function buildJobPostingStructuredData(job) {
    if (!job || !job.id) {
      return null;
    }

    var schema = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title || "Fresher role",
      description: jobPostingDescription(job),
      identifier: {
        "@type": "PropertyValue",
        name: job.company_name || "Fresher Connect",
        value: String(job.id)
      },
      datePosted: normalizeIsoDate(job.created_at || job.posted_date),
      validThrough: normalizeIsoDate(job.expires_at || job.expiry_date),
      employmentType: jobEmploymentType(job.job_type),
      hiringOrganization: {
        "@type": "Organization",
        name: job.company_name || "Fresher Connect",
        sameAs: job.company_website || window.location.origin + "/pages/index.html",
        logo: job.company_logo || window.location.origin + "/components/fc-logo.svg"
      },
      industry: job.industry_type || undefined,
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.city || job.location || "",
          addressRegion: job.state || "",
          addressCountry: job.country || ""
        }
      }
    };

    if (job.work_mode === "remote") {
      schema.jobLocationType = "TELECOMMUTE";
      delete schema.jobLocation;
      if (job.country) {
        schema.applicantLocationRequirements = {
          "@type": "Country",
          name: job.country
        };
      }
    }

    if (job.salary_min || job.salary_max) {
      schema.baseSalary = {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: {
          "@type": "QuantitativeValue",
          minValue: job.salary_min || job.salary_max || 0,
          maxValue: job.salary_max || job.salary_min || 0,
          unitText: job.job_type === "internship" ? "MONTH" : "YEAR"
        }
      };
    }

    if (!schema.datePosted) {
      delete schema.datePosted;
    }
    if (!schema.validThrough) {
      delete schema.validThrough;
    }
    if (!schema.industry) {
      delete schema.industry;
    }

    return schema;
  }

  function computeSavedJobMap(savedJobs) {
    var map = {};
    (savedJobs || []).forEach(function (job) {
      map[job.id] = job;
    });
    return map;
  }

  function externalLinkMarkup(label, href) {
    if (!href) {
      return "";
    }
    return '<a class="text-link" href="' + window.FC_API.escapeHtml(href) + '" target="_blank" rel="noreferrer">' + window.FC_API.escapeHtml(label) + "</a>";
  }

  function candidateResourceLinks(candidate) {
    var links = [
      externalLinkMarkup("Resume", candidate.resume_url || candidate.resume_path),
      externalLinkMarkup("LinkedIn", candidate.linkedin),
      externalLinkMarkup("Portfolio", candidate.portfolio)
    ].filter(Boolean);
    var notes = [];
    if (candidate.resume_parser_status && candidate.resume_parser_status !== "not_uploaded") {
      notes.push("Resume " + resumeParserLabel(candidate.resume_parser_status));
    }
    if ((candidate.resume_parsed_skills || []).length) {
      notes.push("AI skills: " + safeJoin((candidate.resume_parsed_skills || []).slice(0, 5)));
    }
    if (!links.length && !notes.length) {
      return '<span class="meta-line">No resume or external profile added yet.</span>';
    }
    return (
      (links.length ? '<div class="resource-link-row">' + links.join("") + "</div>" : "") +
      notes
        .map(function (note) {
          return '<div class="meta-line resume-skill-note">' + window.FC_API.escapeHtml(note) + "</div>";
        })
        .join("")
    );
  }

  function setFieldValue(id, value) {
    var field = byId(id);
    if (field) {
      field.value = value || "";
    }
  }

  function formatCompensation(job) {
    if (job.job_type === "internship") {
      return job.internship_stipend || job.salary_range || "Stipend TBD";
    }
    return job.salary_range || job.internship_stipend || "Compensation TBD";
  }

  function formatExpiry(dateValue) {
    return dateValue ? window.FC_API.formatDate(dateValue) : "No expiry";
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch (_error) {
      return String(value);
    }
  }

  function toDatetimeLocalValue(value) {
    if (!value) {
      return "";
    }

    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    var local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function applicationDecisionLabel(application) {
    if (!application || !application.decision_deadline) {
      return "";
    }
    return "Decision by " + window.FC_API.formatDate(application.decision_deadline) + (application.is_overdue ? " (overdue)" : "");
  }

  function formatPercentValue(value) {
    var numeric = toNumber(value);
    if (numeric === null) {
      return "0%";
    }
    return (Math.round(numeric * 10) / 10).toString().replace(/\.0$/, "") + "%";
  }

  function formatHoursValue(value) {
    var numeric = toNumber(value);
    if (numeric === null) {
      return "0h";
    }
    return (Math.round(numeric * 10) / 10).toString().replace(/\.0$/, "") + "h";
  }

  function auditActivityMarkup(item) {
    var summary = item.summary || toTitleCase(String(item.action || "activity").replace(/_/g, " "));
    var actor = item.actor_name || toTitleCase(item.actor_role || "system");
    var target = item.target_type ? toTitleCase(item.target_type) + " #" + String(item.target_id || "-") : "Platform";

    return (
      '<article class="activity-card">' +
      '<div class="activity-summary">' + window.FC_API.escapeHtml(summary) + "</div>" +
      '<div class="activity-meta">' +
      window.FC_API.escapeHtml(actor) +
      " | " +
      window.FC_API.escapeHtml(target) +
      " | " +
      window.FC_API.escapeHtml(formatDateTime(item.created_at)) +
      "</div>" +
      "</article>"
    );
  }

  function renderActivityList(targetId, items, emptyMessage) {
    var target = byId(targetId);
    if (!target) {
      return;
    }

    if (!(items || []).length) {
      target.innerHTML = '<div class="empty-state">' + window.FC_API.escapeHtml(emptyMessage || "No recent activity yet.") + "</div>";
      return;
    }

    target.innerHTML = (items || []).map(auditActivityMarkup).join("");
  }

  function resumeParserLabel(status) {
    var safeStatus = String(status || "not_uploaded").toLowerCase();
    if (safeStatus === "parsed") {
      return "AI parsed";
    }
    if (safeStatus === "fallback") {
      return "Fallback parsed";
    }
    if (safeStatus === "unavailable") {
      return "Unreadable";
    }
    if (safeStatus === "not_uploaded") {
      return "Not uploaded";
    }
    return toTitleCase(safeStatus);
  }

  function matchToneClass(score) {
    var numeric = toNumber(score);
    if (numeric === null) {
      return "low";
    }
    if (numeric >= 75) {
      return "strong";
    }
    if (numeric >= 45) {
      return "medium";
    }
    if (numeric > 0) {
      return "early";
    }
    return "low";
  }

  function matchPillMarkup(score, label) {
    var numeric = toNumber(score);
    if (numeric === null) {
      return "";
    }
    return (
      '<span class="match-pill ' + matchToneClass(numeric) + '">' +
      window.FC_API.escapeHtml(String(numeric)) +
      "% " +
      window.FC_API.escapeHtml(label || "AI match") +
      "</span>"
    );
  }

  function matchInsightsMarkup(subject, options) {
    var numeric = toNumber(subject && subject.match_score);
    if (numeric === null) {
      return "";
    }

    var config = options || {};
    var matchedSkills = (subject.matched_skills || []).slice(0, config.limit || 4);
    var missingSkills = (subject.missing_skills || []).slice(0, config.limit || 3);

    return (
      '<div class="match-insights' + (config.compact ? " compact" : "") + '">' +
      '<div class="match-insights-top">' +
      matchPillMarkup(numeric, subject.match_label || "AI match") +
      (config.showReason === false
        ? ""
        : '<span class="meta-line">' +
          window.FC_API.escapeHtml(subject.match_reason || "Compared against candidate and job skills.") +
          "</span>") +
      "</div>" +
      (matchedSkills.length
        ? '<div class="tag-list">' +
          matchedSkills
            .map(function (skill) {
              return '<span class="tag match-tag">' + window.FC_API.escapeHtml(skill) + "</span>";
            })
            .join("") +
          "</div>"
        : "") +
      (missingSkills.length
        ? '<div class="meta-line">Missing: ' + window.FC_API.escapeHtml(missingSkills.join(", ")) + "</div>"
        : "") +
      "</div>"
    );
  }

  function notificationStatusLabel(status) {
    var safeStatus = String(status || "skipped").toLowerCase();
    if (safeStatus === "sent") {
      return "Email sent";
    }
    if (safeStatus === "failed") {
      return "Email failed";
    }
    return "In-app alert";
  }

  function notificationCardMarkup(notification) {
    var metadata = notification.metadata || {};
    var matchMarkup = matchPillMarkup(metadata.match_score, "match");
    var matchedSkills = (metadata.matched_skills || []).slice(0, 3);
    var primaryLink = metadata.application_id
      ? '<a class="text-link" href="' + applicationStatusHref(metadata.application_id) + '">Open application status</a>'
      : metadata.job_id
        ? '<a class="text-link" href="' + jobDetailsHref(metadata.job_id) + '">Open linked job</a>'
        : '<span class="meta-line">No linked job</span>';
    var interviewMeta = metadata.interview_at
      ? '<span class="meta-line">Interview: ' + window.FC_API.escapeHtml(formatDateTime(metadata.interview_at)) + "</span>"
      : "";

    return (
      '<article class="notification-card' + (notification.is_read ? " is-read" : "") + '">' +
      '<div class="notification-top">' +
      '<span class="meta-line">' + window.FC_API.escapeHtml(window.FC_API.formatDate(notification.created_at)) + "</span>" +
      (matchMarkup || '<span class="tag">Job alert</span>') +
      "</div>" +
      '<h3>' + window.FC_API.escapeHtml(notification.title || "Notification") + "</h3>" +
      '<p class="job-description">' + window.FC_API.escapeHtml(notification.message || "") + "</p>" +
      (matchedSkills.length
        ? '<div class="tag-list">' +
          matchedSkills
            .map(function (skill) {
              return '<span class="tag match-tag">' + window.FC_API.escapeHtml(skill) + "</span>";
            })
            .join("") +
          "</div>"
        : "") +
      '<div class="card-link-row">' +
      primaryLink +
      interviewMeta +
      '<span class="meta-line">' + window.FC_API.escapeHtml(notificationStatusLabel(notification.email_status)) + "</span>" +
      (!notification.is_read
        ? '<button class="btn ghost compact-btn" type="button" data-notification-read="' + notification.id + '">Mark read</button>'
        : '<span class="meta-line">Read</span>') +
      "</div>" +
      "</article>"
    );
  }

  function prefillCompanyJobForm(user) {
    if (!user) {
      return;
    }

    setFieldValue("companyNameInput", user.company_name || user.name || "");
    setFieldValue("companyLogoInput", user.company_logo || "");
    setFieldValue("companyWebsiteInput", user.company_website || "");
    setFieldValue("industryTypeInput", user.industry_type || "IT");
    setFieldValue("companySizeInput", user.company_size || "1-10");
    setFieldValue("companyDescriptionInput", user.company_description || "");
  }

  function syncCompanyJobForm() {
    var jobType = byId("jobType");
    var workMode = byId("jobWorkMode");
    var applicationMethod = byId("applicationMethod");
    var salaryField = byId("salaryRangeField");
    var stipendField = byId("internshipStipendField");
    var applicationUrlField = byId("applicationUrlField");
    var applicationEmailField = byId("applicationEmailField");
    var remoteOption = byId("jobRemoteOption");
    var cityField = byId("jobCity");

    if (jobType && salaryField && stipendField) {
      var internshipSelected = jobType.value === "internship";
      salaryField.classList.toggle("hidden", internshipSelected);
      stipendField.classList.toggle("hidden", !internshipSelected);
    }

    if (applicationMethod && applicationUrlField && applicationEmailField) {
      applicationUrlField.classList.toggle("hidden", applicationMethod.value !== "external_link");
      applicationEmailField.classList.toggle("hidden", applicationMethod.value !== "email");
    }

    if (workMode && cityField && remoteOption) {
      var remoteOnly = workMode.value === "remote";
      cityField.required = !remoteOnly;
      remoteOption.value = remoteOnly ? "true" : remoteOption.value || "false";
    }
  }

  function resetCompanyJobForm(user) {
    var form = byId("jobForm");
    if (!form) {
      return;
    }

    form.reset();
    prefillCompanyJobForm(user);
    setFieldValue("jobType", "full-time");
    setFieldValue("jobWorkMode", "onsite");
    setFieldValue("jobRemoteOption", "false");
    setFieldValue("jobExperience", "fresher");
    setFieldValue("degreeRequired", "Any Graduate");
    setFieldValue("applicationMethod", "platform");
    setFieldValue("resumeRequired", "true");
    setFieldValue("portfolioRequired", "false");
    setFieldValue("coverLetterRequired", "false");
    setFieldValue("expiryDays", "30");
    syncCompanyJobForm();
  }

  async function requireRole(role) {
    var loginHref = role === "company" ? "company-login.html" : "login.html";
    try {
      var session = await window.FC_API.refreshSession();
      if (!session.user) {
        window.location.href = loginHref;
        return null;
      }
      state.currentUser = session.user;
      if (session.user.role !== role) {
        window.FC_API.redirectByRole(session.user);
        return null;
      }
      return session.user;
    } catch (_error) {
      window.location.href = loginHref;
      return null;
    }
  }

  async function initLanding() {
    var apiBaseLabel = byId("apiBaseLabel");
    if (apiBaseLabel) {
      apiBaseLabel.textContent = window.FC_API.getApiBase();
    }

    await initLandingReviews();

    setHeaderMenu({
      menuLabel: "Quick access",
      pageLabel: "Landing page",
      summary: "Profile, settings, logout, and more",
      title: "Open menu",
      subtitle: "Profile, settings, and more",
      badgeText: "FC",
      profileHref: "login.html",
      moreLinks: [
        { href: "index.html", label: "Home", description: "Explore the landing page." },
        { href: "jobs.html", label: "Jobs", description: "Browse the job listing." },
        { href: "login.html", label: "Login", description: "Sign in to your account." },
        { href: "register.html", label: "Create account", description: "Register as a fresher or company." }
      ]
    });

    try {
      var session = await window.FC_API.getSession();
      if (session.user) {
        state.currentUser = session.user;
        byId("landingStatus").textContent =
          "Signed in as " + session.user.email + ". Open your dashboard to continue.";
        var primaryCta = byId("primaryCta");
        primaryCta.textContent = "Open dashboard";
        primaryCta.href = dashboardHref(session.user);

        var secondaryCta = byId("secondaryCta");
        secondaryCta.textContent = "Logout";
        secondaryCta.href = "#";
        secondaryCta.addEventListener("click", async function (event) {
          event.preventDefault();
          try {
            await window.FC_API.request("/api/auth/logout", { method: "POST" });
          } catch (_error) {
            // Ignore and reload to clear UI state.
          }
          window.location.reload();
        });

        setHeaderMenu({
          user: session.user,
          menuLabel: "Active account",
          pageLabel: "Landing page",
          summary: session.user.email,
          title: session.user.name || session.user.email,
          subtitle: session.user.role === "company" ? "Company account menu" : "Fresher account menu",
          badgeText: session.user.role === "company"
            ? (session.user.company_name || session.user.name)
            : session.user.name,
          profileHref: dashboardHref(session.user),
          settingsTitle: "Account settings",
          settingsDescription: "Quick information about your signed-in account.",
          moreTitle: "More actions",
          moreDescription: "Jump to the most useful pages from the landing screen.",
          moreLinks: [
            {
              href: dashboardHref(session.user),
              label: "Open dashboard",
              description: "Go back to your main workspace."
            },
            { href: "jobs.html", label: "Browse jobs", description: "Open the job listing page." },
            { href: "index.html", label: "Home", description: "Stay on the landing page." },
            { href: "register.html", label: "Create another account", description: "Open the registration page." }
          ]
        });
      }
    } catch (_error) {
      byId("landingStatus").textContent =
        "Platform connection is not available right now. Start the backend and refresh.";
    }
  }

  async function initLogin() {
    var form = byId("loginForm");
    var message = byId("loginMessage");
    var initialRole = normalizeAuthRole(getQueryParam("role"));

    function applyLoginRole(role, syncUrl) {
      var safeRole = normalizeAuthRole(role);
      var config = LOGIN_ROLE_CONTENT[safeRole];
      var registerLink = byId("loginRegisterLink");

      document.body.dataset.loginRole = safeRole;
      document.title = config.documentTitle;

      setText("loginPageLabel", config.pageLabel);
      setText("loginPageTitle", config.pageTitle);
      setText("loginPageDescription", config.pageDescription);
      setText("loginRoleSummary", config.roleSummary);
      setText("loginFeatureKickerA", config.featureA.kicker);
      setText("loginFeatureTitleA", config.featureA.title);
      setText("loginFeatureBodyA", config.featureA.body);
      setText("loginFeatureKickerB", config.featureB.kicker);
      setText("loginFeatureTitleB", config.featureB.title);
      setText("loginFeatureBodyB", config.featureB.body);
      setText("loginFlowLabel", config.flowLabel);
      setText("loginFlowPointA", config.flowPoints[0]);
      setText("loginFlowPointB", config.flowPoints[1]);
      setText("loginFlowPointC", config.flowPoints[2]);
      setText("loginCardLabel", config.cardLabel);
      setText("loginCardTitle", config.cardTitle);
      setText("loginCardDescription", config.cardDescription);
      setText("loginRoleNoteTitle", config.noteTitle);
      setText("loginRoleNoteBody", config.noteBody);
      setText("loginSubmitButton", config.submitText);
      setText("loginRegisterPrompt", config.registerPrompt);

      if (registerLink) {
        registerLink.href = config.registerHref;
        registerLink.textContent = config.registerText;
      }

      document.querySelectorAll("[data-login-role]").forEach(function (button) {
        var active = button.dataset.loginRole === safeRole;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (syncUrl) {
        replaceQueryParam("role", safeRole === "company" ? safeRole : "");
      }
    }

    document.querySelectorAll("[data-login-role]").forEach(function (button) {
      button.addEventListener("click", function () {
        applyLoginRole(button.dataset.loginRole, true);
      });
    });
    applyLoginRole(initialRole, false);

    try {
      var session = await window.FC_API.getSession();
      if (session.user) {
        window.FC_API.redirectByRole(session.user);
        return;
      }
    } catch (_error) {
      setMessage(message, "Backend API is not reachable on " + window.FC_API.getApiBase() + ".", "error");
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setMessage(message, "Signing in...");

      try {
        var payload = readForm(form);
        await window.FC_API.request("/api/auth/login", {
          method: "POST",
          body: payload
        });
        var freshSession = await window.FC_API.refreshSession();
        window.FC_API.redirectByRole(freshSession.user);
      } catch (error) {
        setMessage(message, window.FC_API.getErrorMessage(error, "Login failed."), "error");
      }
    });
  }

  function toggleRegisterRole(role) {
    var safeRole = normalizeAuthRole(role);
    var fresherFields = byId("fresherFields");
    var companyFields = byId("companyFields");
    var roleInput = byId("accountRole");
    var companyName = byId("companyName");
    var education = byId("registerEducation");
    var gradYear = byId("registerGradYear");
    var loginLink = byId("registerLoginLink");

    roleInput.value = safeRole;
    document.body.dataset.registerRole = safeRole;
    fresherFields.classList.toggle("hidden", safeRole !== "fresher");
    companyFields.classList.toggle("hidden", safeRole !== "company");

    education.required = safeRole === "fresher";
    gradYear.required = safeRole === "fresher";
    companyName.required = safeRole === "company";

    setText("registerLoginPrompt", safeRole === "company" ? "Already registered as a company?" : "Already registered?");
    if (loginLink) {
      loginLink.href = safeRole === "company" ? "company-login.html" : "login.html";
      loginLink.textContent = safeRole === "company" ? "Login as company" : "Login as fresher";
    }

    document.querySelectorAll("[data-role-button]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.roleButton === safeRole);
    });
  }

  async function initRegister() {
    var form = byId("registerForm");
    var message = byId("registerMessage");
    var initialRole = normalizeAuthRole(getQueryParam("role"));

    document.querySelectorAll("[data-role-button]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleRegisterRole(button.dataset.roleButton);
        replaceQueryParam("role", button.dataset.roleButton === "company" ? "company" : "");
      });
    });
    toggleRegisterRole(initialRole);

    try {
      var session = await window.FC_API.getSession();
      if (session.user) {
        window.FC_API.redirectByRole(session.user);
        return;
      }
    } catch (_error) {
      setMessage(message, "Backend API is not reachable on " + window.FC_API.getApiBase() + ".", "error");
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setMessage(message, "Creating account...");

      try {
        var payload = readForm(form);
        await window.FC_API.request("/api/auth/register", {
          method: "POST",
          body: payload
        });
        var freshSession = await window.FC_API.refreshSession();
        window.FC_API.redirectByRole(freshSession.user);
      } catch (error) {
        setMessage(message, window.FC_API.getErrorMessage(error, "Registration failed."), "error");
      }
    });
  }

  function renderDetailList(target, items) {
    target.innerHTML = items
      .map(function (item) {
        var href = String(item.href || "").trim();
        var valueClass = "detail-value" + (item.valueClass ? " " + item.valueClass : "");
        var valueMarkup = (
          href && item.value && item.value !== "-"
            ? '<a class="' + valueClass + ' detail-link" href="' + window.FC_API.escapeHtml(href) + '"' +
                (href.indexOf("mailto:") === 0 ? "" : ' target="_blank" rel="noreferrer"') +
                ">" +
                window.FC_API.escapeHtml(item.value) +
                "</a>"
            : '<strong class="' + valueClass + '">' + window.FC_API.escapeHtml(item.value) + "</strong>"
        );
        return (
          '<div class="detail-item"><span class="detail-label">' +
          window.FC_API.escapeHtml(item.label) +
          "</span>" +
          valueMarkup +
          "</div>"
        );
      })
      .join("");
  }

  function computeApplicationMap(applications) {
    var map = {};
    applications.forEach(function (application) {
      map[application.job.id] = application;
    });
    return map;
  }

  function filterJobs(jobs) {
    return filterJobCollection(jobs, readJobFilters("job"));
  }

  function renderUserJobs() {
    var jobsGrid = byId("jobsGrid");
    var heading = byId("jobsHeading");
    var jobs = filterJobs(state.userDashboard.jobs);
    var applicationMap = computeApplicationMap(state.userDashboard.applications);
    var savedJobMap = computeSavedJobMap(state.userDashboard.saved_jobs || []);
    var jobCountChip = byId("jobCountChip");

    heading.textContent = jobs.length + " roles match your filters";
    if (jobCountChip) {
      jobCountChip.textContent = jobs.length + " roles";
    }
    renderUserJobSpotlight(jobs, applicationMap);

    if (!jobs.length) {
      jobsGrid.innerHTML = '<div class="empty-state">No jobs match the current search and category filter.</div>';
      return;
    }

    jobsGrid.innerHTML = jobs
      .map(function (job) {
        return jobCardMarkup(job, {
          application: applicationMap[job.id],
          showApply: true,
          allowSave: true,
          isSaved: Boolean(savedJobMap[job.id])
        });
      })
      .join("");
  }

  function renderSavedJobs() {
    var target = byId("savedJobsGrid");
    var heading = byId("savedJobsHeading");
    if (!target || !heading) {
      return;
    }

    var savedJobs = state.userDashboard.saved_jobs || [];
    var applicationMap = computeApplicationMap(state.userDashboard.applications);
    var savedJobMap = computeSavedJobMap(savedJobs);
    heading.textContent = savedJobs.length ? (savedJobs.length + " saved roles ready for review") : "Saved roles for later review";

    if (!savedJobs.length) {
      target.innerHTML = '<div class="empty-state">Save jobs from the listing to build your shortlist before applying.</div>';
      return;
    }

    target.innerHTML = savedJobs
      .map(function (job) {
        return jobCardMarkup(job, {
          application: applicationMap[job.id],
          showApply: true,
          allowSave: true,
          isSaved: Boolean(savedJobMap[job.id])
        });
      })
      .join("");
  }

  function renderUserApplications() {
    var tbody = byId("applicationsTableBody");
    var applications = state.userDashboard.applications;
    byId("applicationCount").textContent = String(applications.length);
    renderUserApplicationSummary(applications);

    if (!applications.length) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No applications yet. Apply to a job to start tracking.</div></td></tr>';
      return;
    }

    tbody.innerHTML = applications
      .map(function (application) {
        var interviewLine = application.interview_at
          ? '<div class="meta-line">Interview ' + window.FC_API.escapeHtml(formatDateTime(application.interview_at)) + "</div>"
          : "";
        var deadlineLine = applicationDecisionLabel(application)
          ? '<div class="meta-line">' + window.FC_API.escapeHtml(applicationDecisionLabel(application)) + "</div>"
          : "";
        return (
          "<tr>" +
          "<td><div class=\"table-title\">" + window.FC_API.escapeHtml(application.job.title) + "</div></td>" +
          "<td><div class=\"table-title\">" + window.FC_API.escapeHtml(application.job.company_name) + "</div></td>" +
          "<td>" + window.FC_API.formatDate(application.applied_at) + "</td>" +
          "<td>" + renderStatusPill(application.status) + deadlineLine + interviewLine + "</td>" +
          '<td><a class="text-link" href="' + applicationStatusHref(application.id) + '">Open status</a></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  function renderNotifications() {
    var list = byId("notificationList");
    var badge = byId("notificationCountBadge");
    if (!list || !badge || !state.userDashboard) {
      return;
    }

    var notifications = state.userDashboard.notifications || [];
    var unreadCount = Number(state.userDashboard.notification_unread_count || 0);
    badge.textContent = unreadCount ? unreadCount + " unread" : "All read";

    if (!notifications.length) {
      list.innerHTML = '<div class="empty-state">No job alerts yet. New matched openings will appear here after companies post relevant roles.</div>';
      return;
    }

    list.innerHTML = notifications.map(notificationCardMarkup).join("");
  }

  function renderUserApplicationSummary(applications) {
    var counts = countApplicationsByStatus(applications);
    if (byId("summaryApplied")) {
      byId("summaryApplied").textContent = String(counts.applied);
    }
    if (byId("summaryActive")) {
      byId("summaryActive").textContent = String(counts.active);
    }
    if (byId("summaryOffered")) {
      byId("summaryOffered").textContent = String(counts.offered);
    }
    if (byId("applicationStageChip")) {
      byId("applicationStageChip").textContent = counts.active + " active stages";
    }
  }

  function renderUserJobSpotlight(jobs, applicationMap) {
    var heading = byId("jobSpotlightHeading");
    var link = byId("jobSpotlightLink");
    var card = byId("jobSpotlightCard");
    if (!heading || !link || !card) {
      return;
    }

    if (!jobs.length) {
      heading.textContent = "Select a role from the listing";
      link.href = "jobs.html";
      link.textContent = "Open listing";
      card.className = "detail-highlight-card empty-state";
      card.textContent = "Search or browse jobs to see a focused role preview here.";
      return;
    }

    var job = jobs[0];
    var application = applicationMap[job.id];
    heading.textContent = job.title;
    link.href = jobDetailsHref(job.id);
    link.textContent = "Open job details";
    card.className = "detail-highlight-card";
    card.innerHTML =
      '<div class="detail-highlight-top">' +
      '<div>' +
      '<p class="meta-line">' + window.FC_API.escapeHtml(job.company_name + " | " + (job.location || "Location flexible")) + "</p>" +
      '<h3>' + window.FC_API.escapeHtml(job.title) + "</h3>" +
      "</div>" +
      (application ? renderStatusPill(application.status) : '<span class="tag">' + window.FC_API.escapeHtml(job.job_type) + "</span>") +
      "</div>" +
      '<p class="job-description">' + window.FC_API.escapeHtml(job.role_overview || job.description) + "</p>" +
      matchInsightsMarkup(job, { compact: true, limit: 3 }) +
      '<div class="tag-list">' +
      '<span class="tag">' + window.FC_API.escapeHtml(job.department || "General") + "</span>" +
      '<span class="tag">' + window.FC_API.escapeHtml(job.degree_required || "Any Graduate") + "</span>" +
      '<span class="tag">' + window.FC_API.escapeHtml(formatCompensation(job)) + "</span>" +
      "</div>" +
      '<div class="card-link-row">' +
      '<a class="text-link" href="' + jobDetailsHref(job.id) + '">Open job details</a>' +
      (application
        ? '<a class="text-link" href="' + applicationStatusHref(application.id) + '">View application status</a>'
        : '<span class="meta-line">Apply from the job card below</span>') +
      "</div>";
  }

  function renderUserProfile(user) {
    state.currentUser = user;
    byId("userName").textContent = user.name;
    byId("userMeta").textContent = (user.location || "Location not added") + " | " + user.email;
    byId("profileCompletion").textContent = user.profile_completion + "%";
    byId("userSummaryBox").textContent = user.summary || "Add a short profile summary so companies can quickly understand your background.";

    setHeaderMenu({
      user: user,
      menuLabel: "Active account",
      pageLabel: "Fresher dashboard",
      summary: user.email,
      title: user.name,
      subtitle: "Profile, settings, and more",
      badgeText: user.name,
      profileTarget: "userProfileSection",
      profileHref: "user.html",
      settingsTitle: "Profile settings",
      settingsDescription: "Review your account and connection details.",
      moreTitle: "More actions",
      moreDescription: "Jump to jobs, tracking, and home from one place.",
      moreLinks: [
        { href: "index.html", label: "Home", description: "Go back to the landing page." },
        { href: "jobs.html", label: "Job listing", description: "Open the dedicated job listing page." },
        { href: "#userJobsSection", target: "userJobsSection", label: "Browse jobs", description: "Jump to the jobs section." },
        {
          href: "#userApplicationsSection",
          target: "userApplicationsSection",
          label: "Application tracker",
          description: "See all submitted applications."
        },
        {
          href: "#userSavedJobsSection",
          target: "userSavedJobsSection",
          label: "Saved jobs",
          description: "Open roles you bookmarked for later."
        }
      ]
    });

    renderDetailList(byId("userDetailList"), [
      { label: "Email", value: user.email || "-" },
      { label: "Location", value: user.location || "-" },
      { label: "Education", value: user.education || "-" },
      { label: "Experience", value: user.experience || "-" },
      { label: "Skills", value: safeJoin(user.skills) },
      { label: "Resume", value: user.resume_filename || (user.resume_url || user.resume_path ? "Uploaded" : "-") },
      { label: "Resume parsing", value: resumeParserLabel(user.resume_parser_status) },
      { label: "AI skills", value: safeJoin(user.resume_parsed_skills) },
      { label: "LinkedIn", value: user.linkedin || "-" },
      { label: "Portfolio", value: user.portfolio || "-" }
    ]);
  }

  async function loadUserDashboard() {
    var data = await window.FC_API.request("/api/user/dashboard");
    state.userDashboard = data;
    renderUserProfile(data.user);
    populateJobFilterControls("job", data.jobs || [], buildJobFilterOptions(data.jobs || []));
    renderUserJobs();
    renderSavedJobs();
    renderUserApplications();
    renderNotifications();
  }

  async function initUserPage() {
    var user = await requireRole("fresher");
    if (!user) {
      return;
    }

    try {
      await loadUserDashboard();
    } catch (error) {
      setMessage(byId("userFeedback"), window.FC_API.getErrorMessage(error, "Unable to load dashboard."), "error");
      return;
    }

    [
      "jobSearch",
      "jobLocation",
      "jobCompany",
      "jobSkills",
      "jobSalaryMin",
      "jobSalaryMax"
    ].forEach(function (id) {
      var field = byId(id);
      if (field) {
        field.addEventListener("input", renderUserJobs);
      }
    });
    ["jobCategory", "jobExperience"].forEach(function (id) {
      var field = byId(id);
      if (field) {
        field.addEventListener("change", renderUserJobs);
      }
    });
    byId("editProfileButton").addEventListener("click", openUserProfileEditor);

    async function handleUserJobAction(event) {
      var applyButton = event.target.closest(".apply-button");
      var saveButton = event.target.closest(".save-job-button");

      if (!applyButton && !saveButton) {
        return;
      }

      if (applyButton) {
        applyButton.disabled = true;
        setMessage(byId("userFeedback"), "Submitting application...");

        try {
          var response = await window.FC_API.request("/api/applications", {
            method: "POST",
            body: { job_id: Number(applyButton.dataset.jobId) }
          });
          state.userDashboard.applications.unshift(response.application);
          renderUserJobs();
          renderSavedJobs();
          renderUserApplications();
          setMessage(byId("userFeedback"), "Application submitted successfully.", "success");
        } catch (error) {
          applyButton.disabled = false;
          setMessage(byId("userFeedback"), window.FC_API.getErrorMessage(error, "Application failed."), "error");
        }
        return;
      }

      saveButton.disabled = true;
      setMessage(byId("userFeedback"), saveButton.dataset.saveMode === "remove" ? "Removing saved job..." : "Saving job...");
      try {
        if (saveButton.dataset.saveMode === "remove") {
          await window.FC_API.request("/api/saved-jobs/" + Number(saveButton.dataset.saveJobId), {
            method: "DELETE"
          });
          state.userDashboard.saved_jobs = (state.userDashboard.saved_jobs || []).filter(function (job) {
            return job.id !== Number(saveButton.dataset.saveJobId);
          });
          setMessage(byId("userFeedback"), "Saved job removed.", "success");
        } else {
          await window.FC_API.request("/api/saved-jobs", {
            method: "POST",
            body: { job_id: Number(saveButton.dataset.saveJobId) }
          });
          await loadUserDashboard();
          setMessage(byId("userFeedback"), "Job saved successfully.", "success");
          return;
        }
        renderUserJobs();
        renderSavedJobs();
      } catch (error) {
        saveButton.disabled = false;
        setMessage(byId("userFeedback"), window.FC_API.getErrorMessage(error, "Unable to update saved jobs."), "error");
      }
    }

    byId("jobsGrid").addEventListener("click", handleUserJobAction);
    byId("savedJobsGrid").addEventListener("click", handleUserJobAction);
    byId("notificationList").addEventListener("click", async function (event) {
      var button = event.target.closest("[data-notification-read]");
      if (!button) {
        return;
      }

      button.disabled = true;
      try {
        var response = await window.FC_API.request("/api/notifications/" + Number(button.dataset.notificationRead) + "/read", {
          method: "PATCH"
        });
        state.userDashboard.notifications = response.notifications || [];
        state.userDashboard.notification_unread_count = response.unread_count || 0;
        renderNotifications();
        setMessage(byId("userFeedback"), "Notification marked as read.", "success");
      } catch (error) {
        button.disabled = false;
        setMessage(byId("userFeedback"), window.FC_API.getErrorMessage(error, "Unable to update notification."), "error");
      }
    });

    document.addEventListener("submit", async function (event) {
      if (event.target.id !== "editProfileForm") {
        return;
      }

      event.preventDefault();
      var form = event.target;
      var message = byId("editProfileMessage");
      setMessage(message, "Saving profile...");

      try {
        var payload = readForm(form);
        delete payload.resume_file;
        var fileInput = form.elements.resume_file;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          var uploadBody = new FormData();
          uploadBody.append("resume", fileInput.files[0]);
          var uploadResponse = await window.FC_API.request("/api/user/resume", {
            method: "POST",
            body: uploadBody
          });
          payload.resume_url = uploadResponse.resume_url;
        }
        await window.FC_API.request("/api/user/profile", {
          method: "PATCH",
          body: payload
        });
        await loadUserDashboard();
        closeSheet();
        setMessage(byId("userFeedback"), "Profile updated successfully.", "success");
      } catch (error) {
        setMessage(message, window.FC_API.getErrorMessage(error, "Unable to update profile."), "error");
      }
    });
  }

  function setStandaloneMenuContext(user, config) {
    var context = config || {};
    if (user) {
      setHeaderMenu({
        user: user,
        menuLabel: "Active account",
        pageLabel: context.pageLabel || "Workspace",
        summary: user.email,
        title: user.role === "company" ? (user.company_name || user.name) : user.name,
        subtitle: context.subtitle || "Profile, settings, and more",
        badgeText: user.role === "company" ? (user.company_name || user.name) : user.name,
        profileHref: dashboardHref(user),
        settingsTitle: context.settingsTitle || "Account settings",
        settingsDescription: context.settingsDescription || "Review your account details and active API connection.",
        moreTitle: context.moreTitle || "More actions",
        moreDescription: context.moreDescription || "Open related pages from the current flow.",
        moreLinks: context.moreLinks || defaultMenuContext().moreLinks
      });
      return;
    }

    setHeaderMenu({
      menuLabel: "Quick access",
      pageLabel: context.pageLabel || "Workspace",
      summary: context.summary || "Open the next page in the hiring flow",
      title: context.title || "Open menu",
      subtitle: context.subtitle || "Profile, settings, and more",
      badgeText: "FC",
      profileHref: "login.html",
      settingsTitle: context.settingsTitle || "Connection settings",
      settingsDescription: context.settingsDescription || "Review the active API connection and quick shortcuts.",
      moreTitle: context.moreTitle || "More actions",
      moreDescription: context.moreDescription || "Open related pages from the current flow.",
      moreLinks: context.moreLinks || defaultMenuContext().moreLinks
    });
  }

  function renderJobsPage() {
    var grid = byId("jobsPageGrid");
    var heading = byId("jobsPageHeading");
    var jobs = state.jobsPage.jobs || [];
    var pagination = state.jobsPage.pagination || {};
    var applicationMap = computeApplicationMap(state.jobsPage.applications || []);
    var savedJobMap = computeSavedJobMap(state.jobsPage.saved_jobs || []);
    var allowApply = Boolean(state.currentUser && state.currentUser.role === "fresher");
    var allowSave = allowApply;
    var total = toNumber(pagination.total);
    var pageSize = toNumber(pagination.page_size) || jobs.length;
    var page = toNumber(pagination.page) || 1;
    var start = jobs.length ? ((page - 1) * pageSize) + 1 : 0;
    var end = jobs.length ? start + jobs.length - 1 : 0;

    heading.textContent = String(total !== null ? total : jobs.length) + " jobs match your filters";
    byId("jobsPageCount").textContent = String(total !== null ? total : jobs.length);
    byId("jobsPageCategories").textContent = String((((state.jobsPage.filter_options || {}).categories) || []).length);
    if (byId("jobsPagePaginationSummary")) {
      byId("jobsPagePaginationSummary").textContent = jobs.length
        ? "Showing " + start + "-" + end + " of " + String(total !== null ? total : jobs.length) + " roles."
        : "Showing 0 roles.";
    }
    if (byId("jobsPagePrev")) {
      byId("jobsPagePrev").disabled = !pagination.has_prev;
    }
    if (byId("jobsPageNext")) {
      byId("jobsPageNext").disabled = !pagination.has_next;
    }

    if (!jobs.length) {
      grid.innerHTML = '<div class="empty-state">No jobs match the current listing filters.</div>';
      return;
    }

    grid.innerHTML = jobs
      .map(function (job) {
        return jobCardMarkup(job, {
          application: applicationMap[job.id],
          showApply: allowApply,
          allowSave: allowSave,
          isSaved: Boolean(savedJobMap[job.id])
        });
      })
      .join("");
  }

  async function loadJobsPageListing(filters) {
    var jobsResponse = await window.FC_API.request(buildJobsRequestPath(filters));
    state.jobsPage.jobs = jobsResponse.jobs || [];
    state.jobsPage.categories = jobsResponse.categories || [];
    state.jobsPage.filter_options = jobsResponse.filters || buildJobFilterOptions(state.jobsPage.jobs);
    state.jobsPage.pagination = jobsResponse.pagination || {};
    state.jobsPage.query = {
      search: filters.search || "",
      category: filters.category || "",
      location: filters.location || "",
      company: filters.company || "",
      skills: filters.skills || "",
      experience: filters.experience || "",
      salaryMin: filters.salaryMin,
      salaryMax: filters.salaryMax,
      page: toNumber(filters.page) || 1,
      pageSize: toNumber(filters.pageSize) || 9
    };
    populateJobFilterControls("jobsPage", state.jobsPage.jobs, state.jobsPage.filter_options);
    renderJobsPage();
  }

  async function initJobsPage() {
    var session = null;
    try {
      session = await window.FC_API.getSession();
      if (session.user) {
        state.currentUser = session.user;
      }
    } catch (_error) {
      session = null;
    }

    setStandaloneMenuContext(session && session.user, {
      pageLabel: "Job listing",
      summary: "Browse roles and open detailed job pages",
      settingsTitle: "Listing settings",
      settingsDescription: "Review the active API endpoint and account access from the listing page.",
      moreLinks: [
        { href: "index.html", label: "Home", description: "Go back to the landing page." },
        { href: "jobs.html", label: "Job listing", description: "Stay on the job listing page." },
        { href: "login.html", label: "Login", description: "Sign in to apply and track status." },
        { href: "register.html", label: "Create account", description: "Register as fresher or company." }
      ]
    });

    try {
      var applications = [];
      var savedJobs = [];
      if (session && session.user && session.user.role === "fresher") {
        var applicationResponse = await window.FC_API.request("/api/applications/me");
        applications = applicationResponse.applications || [];
        var savedResponse = await window.FC_API.request("/api/saved-jobs");
        savedJobs = savedResponse.saved_jobs || [];
      }
      state.jobsPage = {
        jobs: [],
        categories: [],
        filter_options: {},
        pagination: {},
        query: { page: 1, pageSize: 9 },
        applications: applications,
        saved_jobs: savedJobs
      };
      await loadJobsPageListing(Object.assign(readJobFilters("jobsPage"), { page: 1, pageSize: 9 }));
    } catch (error) {
      setMessage(byId("jobsPageMessage"), window.FC_API.getErrorMessage(error, "Unable to load job listing."), "error");
      return;
    }

    var refreshJobsPage = debounce(async function () {
      try {
        setMessage(byId("jobsPageMessage"), "Updating filters...");
        await loadJobsPageListing(Object.assign(readJobFilters("jobsPage"), { page: 1, pageSize: 9 }));
        setMessage(byId("jobsPageMessage"), "", "");
      } catch (error) {
        setMessage(byId("jobsPageMessage"), window.FC_API.getErrorMessage(error, "Unable to update listing filters."), "error");
      }
    }, 250);

    [
      "jobsPageSearch",
      "jobsPageLocation",
      "jobsPageCompany",
      "jobsPageSkills",
      "jobsPageSalaryMin",
      "jobsPageSalaryMax"
    ].forEach(function (id) {
      var field = byId(id);
      if (field) {
        field.addEventListener("input", refreshJobsPage);
      }
    });
    ["jobsPageCategory", "jobsPageExperience"].forEach(function (id) {
      var field = byId(id);
      if (field) {
        field.addEventListener("change", refreshJobsPage);
      }
    });
    if (byId("jobsPagePrev")) {
      byId("jobsPagePrev").addEventListener("click", async function () {
        if (!state.jobsPage || !state.jobsPage.pagination || !state.jobsPage.pagination.has_prev) {
          return;
        }
        try {
          await loadJobsPageListing(Object.assign({}, state.jobsPage.query || {}, { page: Math.max(1, (toNumber((state.jobsPage.pagination || {}).page) || 1) - 1) }));
        } catch (error) {
          setMessage(byId("jobsPageMessage"), window.FC_API.getErrorMessage(error, "Unable to load the previous page."), "error");
        }
      });
    }
    if (byId("jobsPageNext")) {
      byId("jobsPageNext").addEventListener("click", async function () {
        if (!state.jobsPage || !state.jobsPage.pagination || !state.jobsPage.pagination.has_next) {
          return;
        }
        try {
          await loadJobsPageListing(Object.assign({}, state.jobsPage.query || {}, { page: (toNumber((state.jobsPage.pagination || {}).page) || 1) + 1 }));
        } catch (error) {
          setMessage(byId("jobsPageMessage"), window.FC_API.getErrorMessage(error, "Unable to load the next page."), "error");
        }
      });
    }
    byId("jobsPageGrid").addEventListener("click", async function (event) {
      var applyButton = event.target.closest(".apply-button");
      var saveButton = event.target.closest(".save-job-button");
      if (!applyButton && !saveButton) {
        return;
      }

      if (applyButton) {
        applyButton.disabled = true;
        setMessage(byId("jobsPageMessage"), "Submitting application...");
        try {
          var response = await window.FC_API.request("/api/applications", {
            method: "POST",
            body: { job_id: Number(applyButton.dataset.jobId) }
          });
          state.jobsPage.applications.unshift(response.application);
          renderJobsPage();
          setMessage(byId("jobsPageMessage"), "Application submitted successfully.", "success");
        } catch (error) {
          applyButton.disabled = false;
          setMessage(byId("jobsPageMessage"), window.FC_API.getErrorMessage(error, "Application failed."), "error");
        }
        return;
      }

      saveButton.disabled = true;
      setMessage(byId("jobsPageMessage"), saveButton.dataset.saveMode === "remove" ? "Removing saved job..." : "Saving job...");
      try {
        if (saveButton.dataset.saveMode === "remove") {
          await window.FC_API.request("/api/saved-jobs/" + Number(saveButton.dataset.saveJobId), {
            method: "DELETE"
          });
          state.jobsPage.saved_jobs = (state.jobsPage.saved_jobs || []).filter(function (job) {
            return job.id !== Number(saveButton.dataset.saveJobId);
          });
          setMessage(byId("jobsPageMessage"), "Saved job removed.", "success");
        } else {
          await window.FC_API.request("/api/saved-jobs", {
            method: "POST",
            body: { job_id: Number(saveButton.dataset.saveJobId) }
          });
          var refreshedSaved = await window.FC_API.request("/api/saved-jobs");
          state.jobsPage.saved_jobs = refreshedSaved.saved_jobs || [];
          setMessage(byId("jobsPageMessage"), "Job saved successfully.", "success");
        }
        renderJobsPage();
      } catch (error) {
        saveButton.disabled = false;
        setMessage(byId("jobsPageMessage"), window.FC_API.getErrorMessage(error, "Unable to update saved jobs."), "error");
      }
    });
  }

  function renderJobDetailsPage() {
    var detailState = state.jobDetails;
    var hero = byId("jobDetailHero");
    var overview = byId("jobDetailOverview");
    var responsibilities = byId("jobDetailResponsibilities");
    var required = byId("jobDetailRequired");
    var preferred = byId("jobDetailPreferred");
    var stages = byId("jobDetailStages");
    var company = byId("jobDetailCompany");
    var application = byId("jobDetailApplication");
    var job = detailState.job;
    var factRows;

    if (!job) {
      applySeo({
        title: "Job Details | Fresher Connect",
        description: "Open a fresher-friendly job, review role requirements, compensation, company information, and hiring stages before applying.",
        robots: "noindex,follow",
        canonicalUrl: buildCanonicalUrl([])
      });
      hero.innerHTML = '<div class="empty-state">No job selected. Open the listing page and choose a role.</div>';
      overview.innerHTML = '<div class="empty-state">Job content is not available.</div>';
      responsibilities.innerHTML = '<div class="empty-state">Responsibilities are not available.</div>';
      required.innerHTML = '<div class="empty-state">No qualification details available.</div>';
      preferred.innerHTML = '<div class="empty-state">No qualification details available.</div>';
      stages.innerHTML = '<div class="empty-state">No hiring stages available.</div>';
      company.innerHTML = '<div class="empty-state">Company details are not available.</div>';
      application.innerHTML = '<div class="empty-state">Application actions are not available.</div>';
      return;
    }

    applySeo({
      title: job.title + " at " + job.company_name + " | Fresher Connect",
      description: (job.description || "Explore this fresher-friendly job opening on Fresher Connect.").slice(0, 155),
      robots: "index,follow,max-image-preview:large",
      canonicalUrl: buildCanonicalUrl(["job"]),
      ogType: "article",
      jsonLd: buildJobPostingStructuredData(job)
    });

    var currentUser = detailState.user;
    var currentApplication = (detailState.applications || []).find(function (item) {
      return item.job && item.job.id === job.id;
    });
    var isSaved = Boolean(computeSavedJobMap(detailState.saved_jobs || [])[job.id]);
    var saveAction = currentUser && currentUser.role === "fresher"
      ? '<button class="btn ghost compact-btn save-job-button' + (isSaved ? " active-save" : "") + '" type="button" data-detail-save="' + job.id + '" data-save-mode="' + (isSaved ? "remove" : "save") + '">' + (isSaved ? "Saved" : "Save job") + "</button>"
      : "";
    var heroActions;
    if (currentApplication) {
      heroActions =
        renderStatusPill(currentApplication.status) +
        saveAction +
        '<a class="btn ghost compact-btn" href="' + applicationStatusHref(currentApplication.id) + '">Open application status</a>';
    } else if (currentUser && currentUser.role === "fresher") {
      heroActions =
        '<button class="btn primary" type="button" data-detail-apply="' + job.id + '">Apply now</button>' +
        saveAction +
        '<a class="btn ghost compact-btn" href="jobs.html">Back to listing</a>';
    } else if (currentUser && currentUser.role === "company") {
      heroActions =
        '<a class="btn primary" href="' + dashboardHref(currentUser) + '">Open company dashboard</a>' +
        '<a class="btn ghost compact-btn" href="jobs.html">View listing</a>';
    } else if (currentUser && currentUser.role === "admin") {
      heroActions =
        '<a class="btn primary" href="admin.html">Open admin dashboard</a>' +
        '<a class="btn ghost compact-btn" href="jobs.html">View listing</a>';
    } else {
      heroActions =
        '<a class="btn primary" href="login.html">Login to apply</a>' +
        '<a class="btn ghost compact-btn" href="register.html">Create account</a>';
    }

    hero.innerHTML =
      '<div class="detail-hero-copy">' +
      '<span class="section-label">Job Details</span>' +
      '<h1 class="page-title page-title-small">' + window.FC_API.escapeHtml(job.title) + "</h1>" +
      '<p class="meta-line">' +
      window.FC_API.escapeHtml(job.company_name) +
      " | " +
      window.FC_API.escapeHtml(job.location || "Location flexible") +
      " | " +
      window.FC_API.escapeHtml(toTitleCase(job.work_mode || "onsite")) +
      "</p>" +
      '<p class="muted">' + window.FC_API.escapeHtml(job.description) + "</p>" +
      '<div class="button-row">' + heroActions + "</div>" +
      '<div id="jobDetailMessage" class="form-message"></div>' +
      "</div>" +
      '<div class="job-facts-grid">' +
      (function () {
        factRows = [
          { label: "Experience", value: job.experience_level || "Fresher" },
          { label: "Degree", value: job.degree_required || "Any Graduate" },
          { label: "Compensation", value: formatCompensation(job) },
          { label: "Expires", value: formatExpiry(job.expires_at) }
        ];
        if (toNumber(job.match_score) !== null) {
          factRows.push({ label: "AI Match", value: job.match_score + "% " + (job.match_label || "Match") });
        }
        return detailRowsMarkup(factRows);
      }()) +
      "</div>";

    overview.innerHTML = detailParagraphMarkup("Role overview", job.role_overview || job.description, "Role overview not added.");
    responsibilities.innerHTML = detailParagraphMarkup("Responsibilities", job.responsibilities, "Responsibilities have not been added yet.");
    required.innerHTML = detailParagraphMarkup("Required qualifications", job.required_qualifications || job.requirements, "Required qualifications have not been added.");
    preferred.innerHTML = detailParagraphMarkup("Preferred qualifications", job.preferred_qualifications, "Preferred qualifications have not been added.");
    stages.innerHTML = timelineMarkup(job.hiring_stages || [], currentApplication ? Math.min(stageIndex(currentApplication.status), Math.max((job.hiring_stages || []).length - 1, 0)) : -1);
    company.innerHTML = detailRowsMarkup([
      { label: "Company", value: job.company_name || "-" },
      { label: "Industry", value: job.industry_type || "-" },
      { label: "Website", value: job.company_website || "-" },
      { label: "Size", value: job.company_size || "-" },
      { label: "Description", value: job.company_description || "-" }
    ]);
    application.innerHTML = detailRowsMarkup([
      { label: "Application method", value: toTitleCase(job.application_method || "platform") },
      { label: "Resume required", value: job.resume_required ? "Yes" : "No" },
      { label: "Portfolio required", value: job.portfolio_required ? "Yes" : "No" },
      { label: "Cover letter required", value: job.cover_letter_required ? "Yes" : "No" }
    ]) + matchInsightsMarkup(job, { limit: 4 });
  }

  async function initJobDetailsPage() {
    var session = null;
    try {
      session = await window.FC_API.getSession();
      if (session.user) {
        state.currentUser = session.user;
      }
    } catch (_error) {
      session = null;
    }

    setStandaloneMenuContext(session && session.user, {
      pageLabel: "Job details",
      summary: "Review role details and application actions",
      settingsTitle: "Job page settings",
      settingsDescription: "Review your active account and API connection from the job details page.",
      moreLinks: [
        { href: "jobs.html", label: "Job listing", description: "Go back to the full job listing." },
        { href: "index.html", label: "Home", description: "Return to the landing page." },
        { href: session && session.user ? dashboardHref(session.user) : "login.html", label: session && session.user ? "Dashboard" : "Login", description: session && session.user ? "Open your dashboard." : "Sign in to continue." }
      ]
    });

    try {
      var jobsResponse = await window.FC_API.request("/api/jobs");
      var jobId = toNumber(getQueryParam("job"));
      var job = (jobsResponse.jobs || []).find(function (item) {
        return item.id === jobId;
      }) || (jobsResponse.jobs || [])[0] || null;
      var applications = [];
      var savedJobs = [];
      if (session && session.user && session.user.role === "fresher") {
        var applicationResponse = await window.FC_API.request("/api/applications/me");
        applications = applicationResponse.applications || [];
        var savedResponse = await window.FC_API.request("/api/saved-jobs");
        savedJobs = savedResponse.saved_jobs || [];
      }

      state.jobDetails = {
        user: session && session.user ? session.user : null,
        applications: applications,
        saved_jobs: savedJobs,
        jobs: jobsResponse.jobs || [],
        job: job
      };
      renderJobDetailsPage();
    } catch (error) {
      byId("jobDetailHero").innerHTML = '<div class="empty-state">' + window.FC_API.escapeHtml(window.FC_API.getErrorMessage(error, "Unable to load job details.")) + '</div>';
    }

    byId("jobDetailHero").addEventListener("click", async function (event) {
      var applyButton = event.target.closest("[data-detail-apply]");
      var saveButton = event.target.closest("[data-detail-save]");
      if (!applyButton && !saveButton) {
        return;
      }

      if (applyButton) {
        applyButton.disabled = true;
        setMessage(byId("jobDetailMessage"), "Submitting application...");
        try {
          var response = await window.FC_API.request("/api/applications", {
            method: "POST",
            body: { job_id: Number(applyButton.dataset.detailApply) }
          });
          state.jobDetails.applications.unshift(response.application);
          renderJobDetailsPage();
        } catch (error) {
          applyButton.disabled = false;
          setMessage(byId("jobDetailMessage"), window.FC_API.getErrorMessage(error, "Application failed."), "error");
        }
        return;
      }

      saveButton.disabled = true;
      setMessage(byId("jobDetailMessage"), saveButton.dataset.saveMode === "remove" ? "Removing saved job..." : "Saving job...");
      try {
        if (saveButton.dataset.saveMode === "remove") {
          await window.FC_API.request("/api/saved-jobs/" + Number(saveButton.dataset.detailSave), {
            method: "DELETE"
          });
          state.jobDetails.saved_jobs = (state.jobDetails.saved_jobs || []).filter(function (jobItem) {
            return jobItem.id !== Number(saveButton.dataset.detailSave);
          });
          setMessage(byId("jobDetailMessage"), "Saved job removed.", "success");
        } else {
          await window.FC_API.request("/api/saved-jobs", {
            method: "POST",
            body: { job_id: Number(saveButton.dataset.detailSave) }
          });
          var refreshedSaved = await window.FC_API.request("/api/saved-jobs");
          state.jobDetails.saved_jobs = refreshedSaved.saved_jobs || [];
          setMessage(byId("jobDetailMessage"), "Job saved successfully.", "success");
        }
        renderJobDetailsPage();
      } catch (error) {
        saveButton.disabled = false;
        setMessage(byId("jobDetailMessage"), window.FC_API.getErrorMessage(error, "Unable to update saved jobs."), "error");
      }
    });
  }

  function renderApplicationStatusPage() {
    var currentState = state.applicationStatusPage;
    var selectedId = toNumber(getQueryParam("application"));
    var selected = (currentState.applications || []).find(function (item) {
      return item.id === selectedId;
    }) || (currentState.applications || [])[0] || null;
    var hero = byId("applicationHero");
    var timeline = byId("applicationTimeline");
    var summary = byId("applicationSummary");
    var jobDetails = byId("applicationJobDetails");
    var applicationList = byId("applicationList");

    if (!selected) {
      hero.innerHTML = '<div class="empty-state">No application is available yet. Apply to a role first.</div>';
      timeline.innerHTML = '<div class="empty-state">Status timeline will appear here after you apply.</div>';
      summary.innerHTML = '<div class="empty-state">No application summary available.</div>';
      jobDetails.innerHTML = '<div class="empty-state">No job details available.</div>';
      applicationList.innerHTML = '<div class="empty-state">No application links available.</div>';
      return;
    }

    hero.innerHTML =
      '<div class="detail-hero-copy">' +
      '<span class="section-label">Application Status</span>' +
      '<h1 class="page-title page-title-small">' + window.FC_API.escapeHtml(selected.job.title) + "</h1>" +
      '<p class="meta-line">' + window.FC_API.escapeHtml(selected.job.company_name) + " | " + window.FC_API.escapeHtml(selected.job.location || "Location flexible") + "</p>" +
      (selected.interview_at ? '<p class="meta-line">Interview scheduled for ' + window.FC_API.escapeHtml(formatDateTime(selected.interview_at)) + "</p>" : "") +
      '<div class="button-row">' +
      renderStatusPill(selected.status) +
      '<a class="btn ghost compact-btn" href="' + jobDetailsHref(selected.job.id) + '">Open job details</a>' +
      '<a class="btn ghost compact-btn" href="user.html">Back to dashboard</a>' +
      "</div>" +
      "</div>" +
      '<div class="job-facts-grid">' +
      detailRowsMarkup([
        { label: "Applied", value: window.FC_API.formatDate(selected.applied_at) },
        { label: "Current stage", value: toTitleCase(selected.status) },
        { label: "Decision deadline", value: selected.decision_deadline ? window.FC_API.formatDate(selected.decision_deadline) : "-" },
        { label: "Interview", value: selected.interview_at ? formatDateTime(selected.interview_at) : "-" },
        { label: "Work mode", value: toTitleCase(selected.job.work_mode || "onsite") },
        { label: "Compensation", value: formatCompensation(selected.job) }
      ]) +
      "</div>";

    timeline.innerHTML = timelineMarkup(
      window.FC_API.statuses.map(function (status) {
        return toTitleCase(status);
      }),
      stageIndex(selected.status)
    );
    summary.innerHTML = detailRowsMarkup([
      { label: "Company", value: selected.job.company_name || "-" },
      { label: "Location", value: selected.job.location || "-" },
      { label: "Department", value: selected.job.department || "-" },
      { label: "Employment type", value: toTitleCase(selected.job.job_type || "full-time") },
      { label: "Decision note", value: selected.decision_reason || "-" }
    ]);
    jobDetails.innerHTML = detailRowsMarkup([
      { label: "Role", value: selected.job.title || "-" },
      { label: "Experience", value: selected.job.experience_level || "-" },
      { label: "Degree", value: selected.job.degree_required || "-" },
      { label: "Skills", value: safeJoin(selected.job.required_skills) }
    ]);
    applicationList.innerHTML = (currentState.applications || [])
      .map(function (application) {
        return (
          '<a class="sheet-link' + (application.id === selected.id ? ' active-link' : '') + '" href="' + applicationStatusHref(application.id) + '">' +
          '<strong>' + window.FC_API.escapeHtml(application.job.title) + "</strong>" +
          '<span>' + window.FC_API.escapeHtml(application.job.company_name + " | " + toTitleCase(application.status)) + "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  async function initApplicationStatusPage() {
    var user = await requireRole("fresher");
    if (!user) {
      return;
    }

    setStandaloneMenuContext(user, {
      pageLabel: "Application status",
      summary: user.email,
      settingsTitle: "Status page settings",
      settingsDescription: "Review your profile and the active API connection from the status page.",
      moreLinks: [
        { href: "user.html", label: "Dashboard", description: "Go back to your candidate dashboard." },
        { href: "jobs.html", label: "Job listing", description: "Browse more jobs." },
        { href: "index.html", label: "Home", description: "Return to the landing page." }
      ]
    });

    try {
      var response = await window.FC_API.request("/api/applications/me");
      state.applicationStatusPage = {
        applications: response.applications || []
      };
      renderApplicationStatusPage();
    } catch (error) {
      byId("applicationHero").innerHTML = '<div class="empty-state">' + window.FC_API.escapeHtml(window.FC_API.getErrorMessage(error, "Unable to load application status.")) + '</div>';
    }
  }

  function renderAdminAnalytics(analytics) {
    var analyticsGrid = byId("adminAnalyticsGrid");
    var statusGrid = byId("adminStatusGrid");
    if (byId("adminHeroUsers")) {
      byId("adminHeroUsers").textContent = String(analytics.users || 0);
    }
    if (byId("adminHeroJobs")) {
      byId("adminHeroJobs").textContent = String(analytics.active_jobs || 0);
    }
    if (byId("adminHeroApplications")) {
      byId("adminHeroApplications").textContent = String(analytics.applications || 0);
    }

    analyticsGrid.innerHTML = [
      { label: "Candidates", value: analytics.candidates || 0 },
      { label: "Companies", value: analytics.companies || 0 },
      { label: "Verified companies", value: analytics.verified_companies || 0 },
      { label: "Verification queue", value: analytics.pending_companies || 0 },
      { label: "Admins", value: analytics.admins || 0 },
      { label: "Moderation queue", value: analytics.moderated_jobs || 0 },
      { label: "Saved jobs", value: analytics.saved_jobs || 0 },
      { label: "Total applications", value: analytics.applications || 0 }
    ]
      .map(function (item) {
        return (
          '<div class="metric admin-metric">' +
          '<span class="detail-label">' + window.FC_API.escapeHtml(item.label) + "</span>" +
          '<strong>' + window.FC_API.escapeHtml(String(item.value)) + "</strong>" +
          "</div>"
        );
      })
      .join("");

    statusGrid.innerHTML = window.FC_API.statuses
      .map(function (status) {
        return (
          '<div class="status-box">' +
          '<span>' + window.FC_API.escapeHtml(toTitleCase(status)) + "</span>" +
          '<strong>' + window.FC_API.escapeHtml(String((analytics.application_statuses || {})[status] || 0)) + "</strong>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderCompanyAnalytics(analytics) {
    var grid = byId("companyAnalyticsGrid");
    var topJobs = byId("companyTopJobsList");
    if (!grid) {
      return;
    }

    grid.innerHTML = [
      { label: "Decision rate", value: formatPercentValue(analytics.decision_rate) },
      { label: "Shortlist rate", value: formatPercentValue(analytics.shortlisted_rate) },
      { label: "Interview rate", value: formatPercentValue(analytics.interview_rate) },
      { label: "Offer rate", value: formatPercentValue(analytics.offer_rate) },
      { label: "Avg decision time", value: formatHoursValue(analytics.avg_decision_hours) },
      { label: "SLA breaches", value: String(analytics.sla_breaches || 0) }
    ]
      .map(function (item) {
        return (
          '<div class="metric admin-metric">' +
          '<span class="detail-label">' + window.FC_API.escapeHtml(item.label) + "</span>" +
          '<strong>' + window.FC_API.escapeHtml(item.value) + "</strong>" +
          "</div>"
        );
      })
      .join("");

    if (!topJobs) {
      return;
    }

    if (!((analytics.top_jobs || []).length)) {
      topJobs.innerHTML = '<div class="empty-state">Post roles and review applicants to unlock job-level analytics.</div>';
      return;
    }

    topJobs.innerHTML = (analytics.top_jobs || [])
      .map(function (job) {
        return (
          '<article class="activity-card">' +
          '<div class="activity-summary">' + window.FC_API.escapeHtml(job.title || "Job") + "</div>" +
          '<div class="activity-meta">' +
          window.FC_API.escapeHtml(String(job.application_count || 0)) +
          " applicants | Decision rate " +
          window.FC_API.escapeHtml(formatPercentValue(job.decision_rate)) +
          " | Interviews " +
          window.FC_API.escapeHtml(String(job.interview_count || 0)) +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function companyVerificationOptions(selected) {
    return ["verified", "pending", "rejected"]
      .map(function (status) {
        return (
          '<option value="' + window.FC_API.escapeHtml(status) + '"' + (status === selected ? " selected" : "") + ">" +
          window.FC_API.escapeHtml(toTitleCase(status)) +
          "</option>"
        );
      })
      .join("");
  }

  function adminUserActionMarkup(user) {
    return (
      '<form class="inline-form admin-user-form" data-user-id="' + (user.user_id || user.id) + '">' +
      '<select name="is_active">' +
      '<option value="true"' + (user.is_active ? " selected" : "") + ">Active</option>" +
      '<option value="false"' + (!user.is_active ? " selected" : "") + ">Disabled</option>" +
      "</select>" +
      ((user.db_role || user.role) === "company"
        ? '<select name="verification_status">' + companyVerificationOptions(user.verification_status || "verified") + "</select>"
        : "") +
      '<button class="btn primary" type="submit">Save</button>' +
      "</form>"
    );
  }

  function adminModerationOptions(selected) {
    return ["approved", "pending", "rejected"]
      .map(function (status) {
        return (
          '<option value="' + window.FC_API.escapeHtml(status) + '"' + (status === selected ? " selected" : "") + ">" +
          window.FC_API.escapeHtml(toTitleCase(status)) +
          "</option>"
        );
      })
      .join("");
  }

  function renderAdminUsers() {
    var tbody = byId("adminUsersBody");
    var users = state.adminDashboard.users || [];
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No users are available.</div></td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map(function (user) {
        return (
          "<tr>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(user.name || "-") + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(user.email || "-") + "</div>" +
          "</td>" +
          "<td>" + pillMarkup(toTitleCase(user.db_role || user.role), "tag") + "</td>" +
          "<td>" +
          '<div class="meta-line">Created ' + window.FC_API.escapeHtml(window.FC_API.formatDate(user.created_at)) + "</div>" +
          '<div class="meta-line">Completion ' + window.FC_API.escapeHtml(String(user.profile_completion || 0)) + "%</div>" +
          (((user.db_role || user.role) === "company")
            ? '<div class="meta-line">Verification ' + window.FC_API.escapeHtml(toTitleCase(user.verification_status || "verified")) + "</div>"
            : "") +
          "</td>" +
          "<td>" + pillMarkup(user.is_active ? "Active" : "Disabled", user.is_active ? "status-pill offered" : "status-pill rejected") + "</td>" +
          "<td>" + adminUserActionMarkup(user) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderAdminJobs() {
    var tbody = byId("adminJobsBody");
    var jobs = state.adminDashboard.jobs || [];
    if (!jobs.length) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No jobs are available.</div></td></tr>';
      return;
    }

    tbody.innerHTML = jobs
      .map(function (job) {
        return (
          "<tr>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(job.title || "-") + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(job.location || "-") + "</div>" +
          '<div class="meta-line"><a class="text-link" href="' + jobDetailsHref(job.id) + '">Open job details</a></div>' +
          "</td>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(job.company_name || "-") + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(job.industry_type || "-") + "</div>" +
          "</td>" +
          "<td>" + window.FC_API.escapeHtml(String(job.application_count || 0)) + "</td>" +
          "<td>" +
          pillMarkup(toTitleCase(job.moderation_status || "approved"), "tag") +
          '<div class="meta-line">' + window.FC_API.escapeHtml(job.publicly_visible ? "Visible to candidates" : "Not visible to candidates") + "</div>" +
          "</td>" +
          "<td>" +
          '<form class="inline-form admin-job-form" data-job-id="' + job.id + '">' +
          '<select name="moderation_status">' + adminModerationOptions(job.moderation_status || "approved") + "</select>" +
          '<select name="is_active">' +
          '<option value="true"' + (job.is_active ? " selected" : "") + ">Visible</option>" +
          '<option value="false"' + (!job.is_active ? " selected" : "") + ">Hidden</option>" +
          "</select>" +
          '<button class="btn primary" type="submit">Update</button>' +
          "</form>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function loadAdminDashboard() {
    var data = await window.FC_API.request("/api/admin/dashboard");
    state.adminDashboard = data;
    state.currentUser = data.user;

    setHeaderMenu({
      user: data.user,
      menuLabel: "Active account",
      pageLabel: "Admin dashboard",
      summary: data.user.email,
      title: data.user.name,
      subtitle: "Admin controls, settings, and more",
      badgeText: data.user.name,
      profileTarget: "adminAnalyticsSection",
      profileHref: "admin.html",
      settingsTitle: "Admin settings",
      settingsDescription: "Review the active admin account and backend connection.",
      moreTitle: "Admin actions",
      moreDescription: "Jump between analytics, users, and moderation.",
      moreLinks: [
        { href: "index.html", label: "Home", description: "Return to the landing page." },
        { href: "#adminAnalyticsSection", target: "adminAnalyticsSection", label: "Analytics", description: "Open the analytics snapshot." },
        { href: "#adminUsersSection", target: "adminUsersSection", label: "Users", description: "Manage platform accounts." },
        { href: "#adminJobsSection", target: "adminJobsSection", label: "Jobs", description: "Moderate job posts." }
      ]
    });

    renderAdminAnalytics(data.analytics || {});
    renderActivityList("adminAuditList", data.recent_activity || [], "No audit activity recorded yet.");
    renderAdminUsers();
    renderAdminJobs();
  }

  async function initAdminPage() {
    var admin = await requireRole("admin");
    if (!admin) {
      return;
    }

    try {
      await loadAdminDashboard();
    } catch (error) {
      setMessage(byId("adminMessage"), window.FC_API.getErrorMessage(error, "Unable to load admin dashboard."), "error");
      return;
    }

    byId("adminUsersBody").addEventListener("submit", async function (event) {
      var form = event.target.closest(".admin-user-form");
      if (!form) {
        return;
      }

      event.preventDefault();
      var button = form.querySelector("button");
      button.disabled = true;
      try {
        var body = { is_active: form.elements.is_active.value === "true" };
        if (form.elements.verification_status) {
          body.verification_status = form.elements.verification_status.value;
        }
        await window.FC_API.request("/api/admin/users/" + form.dataset.userId, {
          method: "PATCH",
          body: body
        });
        await loadAdminDashboard();
        setMessage(byId("adminMessage"), "User updated successfully.", "success");
      } catch (error) {
        setMessage(byId("adminMessage"), window.FC_API.getErrorMessage(error, "Unable to update user."), "error");
      } finally {
        button.disabled = false;
      }
    });

    byId("adminJobsBody").addEventListener("submit", async function (event) {
      var form = event.target.closest(".admin-job-form");
      if (!form) {
        return;
      }

      event.preventDefault();
      var button = form.querySelector("button");
      button.disabled = true;
      try {
        await window.FC_API.request("/api/admin/jobs/" + form.dataset.jobId, {
          method: "PATCH",
          body: {
            moderation_status: form.elements.moderation_status.value,
            is_active: form.elements.is_active.value === "true"
          }
        });
        await loadAdminDashboard();
        setMessage(byId("adminMessage"), "Job moderation updated.", "success");
      } catch (error) {
        setMessage(byId("adminMessage"), window.FC_API.getErrorMessage(error, "Unable to update moderation state."), "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  function renderStatusGrid(statusCounts) {
    var target = byId("statusGrid");
    target.innerHTML = window.FC_API.statuses
      .map(function (status) {
        return (
          '<div class="status-box">' +
          "<span>" + window.FC_API.escapeHtml(toTitleCase(status)) + "</span>" +
          "<strong>" + window.FC_API.escapeHtml(String(statusCounts[status] || 0)) + "</strong>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderCompanyJobs() {
    var jobs = state.companyDashboard.posted_jobs;
    var target = byId("companyJobsGrid");
    byId("postedJobsCount").textContent = String(jobs.length);
    if (byId("heroOpenJobs")) {
      byId("heroOpenJobs").textContent = String(jobs.length);
    }

    if (!jobs.length) {
      target.innerHTML = '<div class="empty-state">No jobs posted yet. Use the form above to add the first opening.</div>';
      return;
    }

    target.innerHTML = jobs
      .map(function (job) {
        return (
          '<article class="card company-job-card">' +
          '<div class="job-card-top">' +
          '<div class="job-card-header">' +
          "<h3>" + window.FC_API.escapeHtml(job.title) + "</h3>" +
          '<span class="tag job-type-chip">' + window.FC_API.escapeHtml(job.job_type) + "</span>" +
          "</div>" +
          '<p class="meta-line">' +
          window.FC_API.escapeHtml(job.department || "General") +
          " | " +
          window.FC_API.escapeHtml(job.location || "Location flexible") +
          " | " +
          window.FC_API.escapeHtml(toTitleCase(job.work_mode || "onsite")) +
          "</p>" +
          '<p class="job-description">' + window.FC_API.escapeHtml(job.description) + "</p>" +
          '<div class="tag-list">' +
          (job.categories || [])
            .map(function (category) {
              return '<span class="tag">' + window.FC_API.escapeHtml(category) + "</span>";
            })
            .join("") +
          (job.required_skills || [])
            .slice(0, 4)
            .map(function (skill) {
              return '<span class="tag">' + window.FC_API.escapeHtml(skill) + "</span>";
            })
            .join("") +
          "</div>" +
          "</div>" +
          '<div class="detail-list compact-detail-list">' +
          '<div><strong>Experience</strong><span>' + window.FC_API.escapeHtml(job.experience_level || "fresher") + "</span></div>" +
          '<div><strong>Degree</strong><span>' + window.FC_API.escapeHtml(job.degree_required || "Any Graduate") + "</span></div>" +
          '<div><strong>Compensation</strong><span>' + window.FC_API.escapeHtml(formatCompensation(job)) + "</span></div>" +
          '<div><strong>Expires</strong><span>' + window.FC_API.escapeHtml(formatExpiry(job.expires_at)) + "</span></div>" +
          "</div>" +
          '<div class="stack-between card-actions">' +
          '<span class="meta-line">' +
          window.FC_API.escapeHtml((job.hiring_stages || []).join(" -> ") || "Hiring stages not added") +
          "</span>" +
          '<div class="tag-list">' +
          '<span class="status-pill applied">' +
          window.FC_API.escapeHtml(String(job.application_count || 0)) +
          " applicants</span>" +
          '<a class="text-link" href="' + jobDetailsHref(job.id) + '">Open job details</a>' +
          "</div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function statusOptions(selected) {
    return window.FC_API.statuses
      .map(function (status) {
        return (
          '<option value="' +
          window.FC_API.escapeHtml(status) +
          '"' +
          (status === selected ? " selected" : "") +
          ">" +
          window.FC_API.escapeHtml(toTitleCase(status)) +
          "</option>"
        );
      })
      .join("");
  }

  function companyApplicationStatusOptions(selected) {
    return (
      '<option value="">All statuses</option>' +
      window.FC_API.statuses
        .map(function (status) {
          return (
            '<option value="' + window.FC_API.escapeHtml(status) + '"' + (status === selected ? " selected" : "") + ">" +
            window.FC_API.escapeHtml(toTitleCase(status)) +
            "</option>"
          );
        })
        .join("")
    );
  }

  function populateCompanyApplicationFilters(applications) {
    var statusField = byId("companyApplicationStatusFilter");
    var experienceField = byId("companyApplicationExperienceFilter");
    var currentStatus = statusField ? statusField.value : "";
    var currentExperience = experienceField ? experienceField.value : "";
    var experienceOptions = [];

    (applications || []).forEach(function (application) {
      var experience = String(((application.candidate || {}).experience) || "").trim();
      if (experience && experienceOptions.indexOf(experience) === -1) {
        experienceOptions.push(experience);
      }
    });

    experienceOptions.sort(function (left, right) {
      return left.localeCompare(right);
    });

    if (statusField) {
      statusField.innerHTML = companyApplicationStatusOptions(currentStatus);
      statusField.value = currentStatus;
    }

    if (experienceField) {
      experienceField.innerHTML =
        '<option value="">All experience</option>' +
        experienceOptions
          .map(function (item) {
            return '<option value="' + window.FC_API.escapeHtml(item) + '"' + (item === currentExperience ? " selected" : "") + ">" +
              window.FC_API.escapeHtml(item) +
              "</option>";
          })
          .join("");
      experienceField.value = currentExperience;
    }
  }

  function readCompanyApplicationFilters() {
    return {
      search: String(readInputValue("companyApplicationSearch") || "").trim().toLowerCase(),
      skills: splitFilterTerms(readInputValue("companyApplicationSkills")),
      experience: String(readInputValue("companyApplicationExperienceFilter") || "").trim().toLowerCase(),
      status: String(readInputValue("companyApplicationStatusFilter") || "").trim().toLowerCase()
    };
  }

  function filterCompanyApplications(applications) {
    var filters = readCompanyApplicationFilters();

    return (applications || []).filter(function (application) {
      var candidate = application.candidate || {};
      var haystack = [
        candidate.name || "",
        candidate.email || "",
        candidate.location || "",
        candidate.experience || "",
        application.job.title || "",
        application.job.company_name || ""
      ]
        .join(" ")
        .toLowerCase();
      var skillHaystack = [
        safeJoin(candidate.skills),
        safeJoin(candidate.resume_parsed_skills),
        safeJoin(application.matched_skills)
      ]
        .join(" ")
        .toLowerCase();
      var matchesSearch = !filters.search || haystack.indexOf(filters.search) >= 0;
      var matchesExperience = !filters.experience || String(candidate.experience || "").toLowerCase().indexOf(filters.experience) >= 0;
      var matchesStatus = !filters.status || String(application.status || "").toLowerCase() === filters.status;
      var matchesSkills = !filters.skills.length || filters.skills.every(function (term) {
        return skillHaystack.indexOf(term) >= 0;
      });
      return matchesSearch && matchesExperience && matchesStatus && matchesSkills;
    });
  }

  function syncCompanyApplicationForm(form) {
    if (!form || !form.elements || !form.elements.interview_at) {
      return;
    }

    var showInterview = form.elements.status.value === "interview";
    form.elements.interview_at.disabled = !showInterview;
    form.elements.interview_at.classList.toggle("hidden", !showInterview);
  }

  function renderCompanyApplications() {
    var applications = state.companyDashboard.applications;
    var tbody = byId("companyApplicationsBody");
    if (byId("heroApplicants")) {
      byId("heroApplicants").textContent = String(applications.length);
    }
    if (byId("heroStages")) {
      byId("heroStages").textContent = String(
        window.FC_API.statuses.filter(function (status) {
          return (state.companyDashboard.status_counts || {})[status] > 0;
        }).length
      );
    }

    populateCompanyApplicationFilters(applications);

    if (!applications.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state">No candidates have applied yet.</div></td></tr>';
      if (byId("companyApplicationFilterSummary")) {
        byId("companyApplicationFilterSummary").textContent = "No applicants yet.";
      }
      return;
    }

    var filteredApplications = filterCompanyApplications(applications);
    if (byId("companyApplicationFilterSummary")) {
      byId("companyApplicationFilterSummary").textContent = "Showing " + filteredApplications.length + " of " + applications.length + " applicants.";
    }

    if (!filteredApplications.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state">No applicants match the current filters.</div></td></tr>';
      return;
    }

    tbody.innerHTML = filteredApplications
      .map(function (application) {
        var candidate = application.candidate || {};
        var deadlineLabel = applicationDecisionLabel(application);
        return (
          "<tr>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(candidate.name || "-") + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(candidate.email || "-") + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(candidate.location || "-") + "</div>" +
          '<div class="meta-line">Experience: ' + window.FC_API.escapeHtml(candidate.experience || "fresher") + "</div>" +
          candidateResourceLinks(candidate) +
          "</td>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(application.job.title) + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(application.job.company_name) + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(window.FC_API.formatDate(application.applied_at)) + "</div>" +
          (deadlineLabel ? '<div class="meta-line">' + window.FC_API.escapeHtml(deadlineLabel) + "</div>" : "") +
          "</td>" +
          "<td>" +
          '<div class="candidate-fit-stack">' +
          '<div class="meta-line">Profile skills: ' + window.FC_API.escapeHtml(safeJoin(candidate.skills)) + "</div>" +
          ((candidate.resume_parsed_skills || []).length
            ? '<div class="meta-line">Resume skills: ' + window.FC_API.escapeHtml(safeJoin(candidate.resume_parsed_skills)) + "</div>"
            : "") +
          matchInsightsMarkup(application, { compact: true, limit: 3 }) +
          "</div>" +
          "</td>" +
          "<td>" +
          '<div class="candidate-fit-stack">' +
          renderStatusPill(application.status) +
          (application.interview_at ? '<div class="meta-line">Interview ' + window.FC_API.escapeHtml(formatDateTime(application.interview_at)) + "</div>" : "") +
          (application.decision_reason ? '<div class="meta-line">' + window.FC_API.escapeHtml(application.decision_reason) + "</div>" : "") +
          '<form class="inline-form application-status-form" data-application-id="' +
          application.id +
          '">' +
          '<select name="status">' + statusOptions(application.status) + "</select>" +
          '<input class="inline-input" name="interview_at" type="datetime-local" value="' + window.FC_API.escapeHtml(toDatetimeLocalValue(application.interview_at)) + '">' +
          '<button class="btn primary" type="submit">Update</button>' +
          '<button class="btn ghost compact-btn" type="button" data-status-shortcut="shortlisted" data-application-id="' + application.id + '">Shortlist</button>' +
          '<button class="btn ghost compact-btn" type="button" data-status-shortcut="interview" data-application-id="' + application.id + '">Interview</button>' +
          '<button class="btn ghost compact-btn" type="button" data-status-shortcut="rejected" data-application-id="' + application.id + '">Reject</button>' +
          "</form>" +
          "</div>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    Array.prototype.forEach.call(tbody.querySelectorAll(".application-status-form"), function (form) {
      syncCompanyApplicationForm(form);
    });
  }

  function renderCompanyProfile(user) {
    state.currentUser = user;
    byId("companyNameHeading").textContent = user.company_name || user.name;
    byId("companyMeta").textContent = (user.industry_type || "Company account") + " | " + user.email;
    byId("companyProfileCompletion").textContent = user.profile_completion + "%";

    setHeaderMenu({
      user: user,
      menuLabel: "Active account",
      pageLabel: "Company dashboard",
      summary: user.email,
      title: user.company_name || user.name,
      subtitle: "Profile, settings, and more",
      badgeText: user.company_name || user.name,
      profileTarget: "companyProfileSection",
      profileHref: "company.html",
      settingsTitle: "Company settings",
      settingsDescription: "Review your company account and connected platform details.",
      moreTitle: "More actions",
      moreDescription: "Jump to job creation, pipeline, and landing page.",
      moreLinks: [
        { href: "index.html", label: "Home", description: "Go back to the landing page." },
        { href: "jobs.html", label: "Job listing", description: "See the candidate-facing job listing page." },
        {
          href: "#companyJobFormSection",
          target: "companyJobFormSection",
          label: "Post a job",
          description: "Jump straight to the job form."
        },
        {
          href: "#companyApplicationsSection",
          target: "companyApplicationsSection",
          label: "Applicant pipeline",
          description: "Review and update candidates."
        }
      ]
    });

    renderDetailList(byId("companyDetailList"), [
      { label: "Company", value: user.company_name || user.name || "-" },
      { label: "Verified", value: toTitleCase(user.verification_status || "verified") },
      { label: "Industry", value: user.industry_type || "-" },
      { label: "Size", value: user.company_size || "-" },
      {
        label: "Website",
        value: compactLinkLabel(user.company_website),
        href: user.company_website || "",
        valueClass: "detail-value-break"
      },
      { label: "Logo", value: user.company_logo ? "Added" : "-" },
      {
        label: "Email",
        value: user.email || "-",
        href: user.email ? "mailto:" + user.email : "",
        valueClass: "detail-value-break"
      },
      { label: "Description", value: user.company_description || "-" }
    ]);
    prefillCompanyJobForm(user);
  }

  async function loadCompanyDashboard() {
    var data = await window.FC_API.request("/api/company/dashboard");
    state.companyDashboard = data;
    renderCompanyProfile(data.user);
    renderStatusGrid(data.status_counts || {});
    renderCompanyAnalytics(data.analytics || {});
    renderActivityList("companyRecentActivity", data.recent_activity || [], "No company activity recorded yet.");
    renderCompanyJobs();
    renderCompanyApplications();
  }

  async function initCompanyPage() {
    var company = await requireRole("company");
    if (!company) {
      return;
    }

    try {
      await loadCompanyDashboard();
    } catch (error) {
      setMessage(byId("jobFormMessage"), window.FC_API.getErrorMessage(error, "Unable to load dashboard."), "error");
      return;
    }

    byId("jobForm").addEventListener("submit", async function (event) {
      event.preventDefault();
      var form = event.currentTarget;
      var message = byId("jobFormMessage");
      setMessage(message, "Publishing job...");

      try {
        var createResponse = await window.FC_API.request("/api/company/jobs", {
          method: "POST",
          body: readForm(form)
        });
        resetCompanyJobForm(state.companyDashboard.user);
        await loadCompanyDashboard();
        var notificationSummary = createResponse.notification_summary || {};
        var successMessage = "Job published successfully.";
        if ((notificationSummary.notifications_created || 0) > 0) {
          successMessage += " " + notificationSummary.notifications_created + " matched candidates notified";
          if ((notificationSummary.emails_sent || 0) > 0) {
            successMessage += ", " + notificationSummary.emails_sent + " by email.";
          } else {
            successMessage += ".";
          }
        }
        setMessage(message, successMessage, "success");
      } catch (error) {
        setMessage(message, window.FC_API.getErrorMessage(error, "Unable to publish job."), "error");
      }
    });

    byId("jobType").addEventListener("change", syncCompanyJobForm);
    byId("jobWorkMode").addEventListener("change", syncCompanyJobForm);
    byId("applicationMethod").addEventListener("change", syncCompanyJobForm);
    if (byId("companyApplicationFilters")) {
      byId("companyApplicationFilters").addEventListener("input", renderCompanyApplications);
      byId("companyApplicationFilters").addEventListener("change", renderCompanyApplications);
    }
    resetCompanyJobForm(state.companyDashboard.user);

    byId("companyApplicationsBody").addEventListener("submit", async function (event) {
      var form = event.target.closest(".application-status-form");
      if (!form) {
        return;
      }

      event.preventDefault();
      var button = form.querySelector("button");
      button.disabled = true;

      try {
        var body = { status: form.elements.status.value };
        if (form.elements.interview_at && !form.elements.interview_at.disabled && form.elements.interview_at.value) {
          body.interview_at = form.elements.interview_at.value;
        }
        await window.FC_API.request("/api/company/applications/" + form.dataset.applicationId, {
          method: "PATCH",
          body: body
        });
        await loadCompanyDashboard();
        setMessage(byId("jobFormMessage"), "Application status updated.", "success");
      } catch (error) {
        setMessage(byId("jobFormMessage"), window.FC_API.getErrorMessage(error, "Status update failed."), "error");
      } finally {
        button.disabled = false;
      }
    });

    byId("companyApplicationsBody").addEventListener("change", function (event) {
      var form = event.target.closest(".application-status-form");
      if (!form) {
        return;
      }
      if (event.target.name === "status") {
        syncCompanyApplicationForm(form);
      }
    });

    byId("companyApplicationsBody").addEventListener("click", async function (event) {
      var shortcut = event.target.closest("[data-status-shortcut]");
      if (!shortcut) {
        return;
      }

      shortcut.disabled = true;
      try {
        var shortcutBody = { status: shortcut.dataset.statusShortcut };
        var shortcutForm = shortcut.closest(".application-status-form");
        if (shortcut.dataset.statusShortcut === "interview" && shortcutForm && shortcutForm.elements.interview_at && shortcutForm.elements.interview_at.value) {
          shortcutBody.interview_at = shortcutForm.elements.interview_at.value;
        }
        await window.FC_API.request("/api/company/applications/" + shortcut.dataset.applicationId, {
          method: "PATCH",
          body: shortcutBody
        });
        await loadCompanyDashboard();
        setMessage(byId("jobFormMessage"), "Candidate status updated.", "success");
      } catch (error) {
        setMessage(byId("jobFormMessage"), window.FC_API.getErrorMessage(error, "Unable to update candidate status."), "error");
      } finally {
        shortcut.disabled = false;
      }
    });
  }
}());
