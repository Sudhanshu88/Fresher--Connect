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

  function loadTheme() {
    var savedTheme = window.localStorage.getItem("fc_theme");
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
      window.localStorage.setItem("fc_theme", state.theme);
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
    if (!links.length) {
      return '<span class="meta-line">No resume or external profile added yet.</span>';
    }
    return '<div class="resource-link-row">' + links.join("") + "</div>";
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
    try {
      var session = await window.FC_API.refreshSession();
      if (!session.user) {
        window.location.href = "login.html";
        return null;
      }
      state.currentUser = session.user;
      if (session.user.role !== role) {
        window.FC_API.redirectByRole(session.user);
        return null;
      }
      return session.user;
    } catch (_error) {
      window.location.href = "login.html";
      return null;
    }
  }

  async function initLanding() {
    var apiBaseLabel = byId("apiBaseLabel");
    if (apiBaseLabel) {
      apiBaseLabel.textContent = window.FC_API.getApiBase();
    }

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
    var fresherFields = byId("fresherFields");
    var companyFields = byId("companyFields");
    var roleInput = byId("accountRole");
    var companyName = byId("companyName");
    var education = byId("registerEducation");
    var gradYear = byId("registerGradYear");

    roleInput.value = role;
    fresherFields.classList.toggle("hidden", role !== "fresher");
    companyFields.classList.toggle("hidden", role !== "company");

    education.required = role === "fresher";
    gradYear.required = role === "fresher";
    companyName.required = role === "company";

    document.querySelectorAll("[data-role-button]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.roleButton === role);
    });
  }

  async function initRegister() {
    var form = byId("registerForm");
    var message = byId("registerMessage");

    document.querySelectorAll("[data-role-button]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleRegisterRole(button.dataset.roleButton);
      });
    });
    toggleRegisterRole("fresher");

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
        return (
          '<div class="detail-item"><span class="detail-label">' +
          window.FC_API.escapeHtml(item.label) +
          "</span><strong class=\"detail-value\">" +
          window.FC_API.escapeHtml(item.value) +
          "</strong></div>"
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
        return (
          "<tr>" +
          "<td><div class=\"table-title\">" + window.FC_API.escapeHtml(application.job.title) + "</div></td>" +
          "<td><div class=\"table-title\">" + window.FC_API.escapeHtml(application.job.company_name) + "</div></td>" +
          "<td>" + window.FC_API.formatDate(application.applied_at) + "</td>" +
          "<td>" + renderStatusPill(application.status) + "</td>" +
          '<td><a class="text-link" href="' + applicationStatusHref(application.id) + '">Open status</a></td>' +
          "</tr>"
        );
      })
      .join("");
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
      { label: "Resume", value: user.resume_url || user.resume_path ? "Uploaded" : "-" },
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
    var applicationMap = computeApplicationMap(state.jobsPage.applications || []);
    var savedJobMap = computeSavedJobMap(state.jobsPage.saved_jobs || []);
    var allowApply = Boolean(state.currentUser && state.currentUser.role === "fresher");
    var allowSave = allowApply;

    heading.textContent = jobs.length + " jobs match your filters";
    byId("jobsPageCount").textContent = String(jobs.length);
    byId("jobsPageCategories").textContent = String((((state.jobsPage.filter_options || {}).categories) || []).length);

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
        applications: applications,
        saved_jobs: savedJobs
      };
      await loadJobsPageListing(readJobFilters("jobsPage"));
    } catch (error) {
      setMessage(byId("jobsPageMessage"), window.FC_API.getErrorMessage(error, "Unable to load job listing."), "error");
      return;
    }

    var refreshJobsPage = debounce(async function () {
      try {
        setMessage(byId("jobsPageMessage"), "Updating filters...");
        await loadJobsPageListing(readJobFilters("jobsPage"));
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

    if (!job) {
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
      detailRowsMarkup([
        { label: "Experience", value: job.experience_level || "Fresher" },
        { label: "Degree", value: job.degree_required || "Any Graduate" },
        { label: "Compensation", value: formatCompensation(job) },
        { label: "Expires", value: formatExpiry(job.expires_at) }
      ]) +
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
    ]);
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
      { label: "Employment type", value: toTitleCase(selected.job.job_type || "full-time") }
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

  function adminUserActionMarkup(user) {
    return (
      '<form class="inline-form admin-user-form" data-user-id="' + (user.user_id || user.id) + '">' +
      '<select name="is_active">' +
      '<option value="true"' + (user.is_active ? " selected" : "") + ">Active</option>" +
      '<option value="false"' + (!user.is_active ? " selected" : "") + ">Disabled</option>" +
      "</select>" +
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
        await window.FC_API.request("/api/admin/users/" + form.dataset.userId, {
          method: "PATCH",
          body: { is_active: form.elements.is_active.value === "true" }
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

    if (!applications.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state">No candidates have applied yet.</div></td></tr>';
      return;
    }

    tbody.innerHTML = applications
      .map(function (application) {
        var candidate = application.candidate || {};
        return (
          "<tr>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(candidate.name || "-") + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(candidate.email || "-") + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(candidate.location || "-") + "</div>" +
          candidateResourceLinks(candidate) +
          "</td>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(application.job.title) + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(application.job.company_name) + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(window.FC_API.formatDate(application.applied_at)) + "</div>" +
          "</td>" +
          "<td>" +
          window.FC_API.escapeHtml(safeJoin(candidate.skills)) +
          "</td>" +
          "<td>" +
          '<form class="inline-form application-status-form" data-application-id="' +
          application.id +
          '">' +
          '<select name="status">' + statusOptions(application.status) + "</select>" +
          '<button class="btn primary" type="submit">Update</button>' +
          '<button class="btn ghost compact-btn" type="button" data-status-shortcut="shortlisted" data-application-id="' + application.id + '">Shortlist</button>' +
          "</form>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
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
      { label: "Industry", value: user.industry_type || "-" },
      { label: "Size", value: user.company_size || "-" },
      { label: "Website", value: user.company_website || "-" },
      { label: "Logo", value: user.company_logo ? "Added" : "-" },
      { label: "Email", value: user.email || "-" },
      { label: "Description", value: user.company_description || "-" }
    ]);
    prefillCompanyJobForm(user);
  }

  async function loadCompanyDashboard() {
    var data = await window.FC_API.request("/api/company/dashboard");
    state.companyDashboard = data;
    renderCompanyProfile(data.user);
    renderStatusGrid(data.status_counts || {});
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
        await window.FC_API.request("/api/company/jobs", {
          method: "POST",
          body: readForm(form)
        });
        resetCompanyJobForm(state.companyDashboard.user);
        await loadCompanyDashboard();
        setMessage(message, "Job published successfully.", "success");
      } catch (error) {
        setMessage(message, window.FC_API.getErrorMessage(error, "Unable to publish job."), "error");
      }
    });

    byId("jobType").addEventListener("change", syncCompanyJobForm);
    byId("jobWorkMode").addEventListener("change", syncCompanyJobForm);
    byId("applicationMethod").addEventListener("change", syncCompanyJobForm);
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
        await window.FC_API.request("/api/company/applications/" + form.dataset.applicationId, {
          method: "PATCH",
          body: { status: form.elements.status.value }
        });
        await loadCompanyDashboard();
        setMessage(byId("jobFormMessage"), "Application status updated.", "success");
      } catch (error) {
        setMessage(byId("jobFormMessage"), window.FC_API.getErrorMessage(error, "Status update failed."), "error");
      } finally {
        button.disabled = false;
      }
    });

    byId("companyApplicationsBody").addEventListener("click", async function (event) {
      var shortcut = event.target.closest("[data-status-shortcut]");
      if (!shortcut) {
        return;
      }

      shortcut.disabled = true;
      try {
        await window.FC_API.request("/api/company/applications/" + shortcut.dataset.applicationId, {
          method: "PATCH",
          body: { status: shortcut.dataset.statusShortcut }
        });
        await loadCompanyDashboard();
        setMessage(byId("jobFormMessage"), "Candidate shortlisted.", "success");
      } catch (error) {
        setMessage(byId("jobFormMessage"), window.FC_API.getErrorMessage(error, "Unable to update candidate status."), "error");
      } finally {
        shortcut.disabled = false;
      }
    });
  }
}());
