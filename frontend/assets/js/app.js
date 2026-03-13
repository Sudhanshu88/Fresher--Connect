(function () {
  var page = document.body.dataset.page;
  var state = {
    userDashboard: null,
    companyDashboard: null,
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
    }
  }

  function byId(id) {
    return document.getElementById(id);
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
      '<label for="editSummary">Summary</label>' +
      '<textarea id="editSummary" name="summary" rows="4" placeholder="Write a short profile summary">' + window.FC_API.escapeHtml(user.summary || "") + "</textarea>" +
      "</div>" +
      '<div class="field">' +
      '<label for="editResume">Resume path</label>' +
      '<input id="editResume" name="resume_path" type="text" value="' + window.FC_API.escapeHtml(user.resume_path || "") + '" placeholder="Resume link or file name">' +
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
        primaryCta.href = session.user.role === "company" ? "company.html" : "user.html";

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
          profileHref: session.user.role === "company" ? "company.html" : "user.html",
          settingsTitle: "Account settings",
          settingsDescription: "Quick information about your signed-in account.",
          moreTitle: "More actions",
          moreDescription: "Jump to the most useful pages from the landing screen.",
          moreLinks: [
            {
              href: session.user.role === "company" ? "company.html" : "user.html",
              label: "Open dashboard",
              description: "Go back to your main workspace."
            },
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
    var search = byId("jobSearch").value.trim().toLowerCase();
    var category = byId("jobCategory").value.trim().toLowerCase();

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
      var matchesSearch = !search || haystack.indexOf(search) >= 0;
      var matchesCategory = !category || (job.categories || []).some(function (item) {
        return item.toLowerCase() === category;
      });
      return matchesSearch && matchesCategory;
    });
  }

  function renderUserJobs() {
    var jobsGrid = byId("jobsGrid");
    var heading = byId("jobsHeading");
    var jobs = filterJobs(state.userDashboard.jobs);
    var applicationMap = computeApplicationMap(state.userDashboard.applications);
    var jobCountChip = byId("jobCountChip");

    heading.textContent = jobs.length + " roles match your filters";
    if (jobCountChip) {
      jobCountChip.textContent = jobs.length + " roles";
    }

    if (!jobs.length) {
      jobsGrid.innerHTML = '<div class="empty-state">No jobs match the current search and category filter.</div>';
      return;
    }

    jobsGrid.innerHTML = jobs
      .map(function (job) {
        var applied = applicationMap[job.id];
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
          (job.required_skills || [])
            .slice(0, 3)
            .map(function (skill) {
              return '<span class="tag">' + window.FC_API.escapeHtml(skill) + "</span>";
            })
            .join("") +
          "</div>" +
          "</div>" +
          '<div class="job-card-footer">' +
          '<div class="tag-list">' +
          '<span class="tag experience-chip">' +
          window.FC_API.escapeHtml(job.experience_level || "entry-level") +
          "</span>" +
          '<span class="tag experience-chip">' +
          window.FC_API.escapeHtml(formatCompensation(job)) +
          "</span>" +
          "</div>" +
          (applied
            ? renderStatusPill(applied.status)
            : '<button class="btn primary apply-button" type="button" data-job-id="' +
              job.id +
              '">Apply now</button>') +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderUserApplications() {
    var tbody = byId("applicationsTableBody");
    var applications = state.userDashboard.applications;
    byId("applicationCount").textContent = String(applications.length);

    if (!applications.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state">No applications yet. Apply to a job to start tracking.</div></td></tr>';
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
          "</tr>"
        );
      })
      .join("");
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
        { href: "#userJobsSection", target: "userJobsSection", label: "Browse jobs", description: "Jump to the jobs section." },
        {
          href: "#userApplicationsSection",
          target: "userApplicationsSection",
          label: "Application tracker",
          description: "See all submitted applications."
        }
      ]
    });

    renderDetailList(byId("userDetailList"), [
      { label: "Email", value: user.email || "-" },
      { label: "Location", value: user.location || "-" },
      { label: "Education", value: user.education || "-" },
      { label: "Skills", value: safeJoin(user.skills) }
    ]);
  }

  function populateCategories(categories) {
    var select = byId("jobCategory");
    select.innerHTML = '<option value="">All categories</option>' +
      categories
        .map(function (category) {
          return '<option value="' + window.FC_API.escapeHtml(category) + '">' +
            window.FC_API.escapeHtml(category) +
            "</option>";
        })
        .join("");
  }

  async function loadUserDashboard() {
    var data = await window.FC_API.request("/api/user/dashboard");
    state.userDashboard = data;
    renderUserProfile(data.user);
    populateCategories(data.categories || []);
    renderUserJobs();
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

    byId("jobSearch").addEventListener("input", renderUserJobs);
    byId("jobCategory").addEventListener("change", renderUserJobs);
    byId("editProfileButton").addEventListener("click", openUserProfileEditor);

    byId("jobsGrid").addEventListener("click", async function (event) {
      var button = event.target.closest(".apply-button");
      if (!button) {
        return;
      }

      button.disabled = true;
      setMessage(byId("userFeedback"), "Submitting application...");

      try {
        var response = await window.FC_API.request("/api/applications", {
          method: "POST",
          body: { job_id: Number(button.dataset.jobId) }
        });
        state.userDashboard.applications.unshift(response.application);
        renderUserJobs();
        renderUserApplications();
        setMessage(byId("userFeedback"), "Application submitted successfully.", "success");
      } catch (error) {
        button.disabled = false;
        setMessage(byId("userFeedback"), window.FC_API.getErrorMessage(error, "Application failed."), "error");
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
        await window.FC_API.request("/api/user/profile", {
          method: "PATCH",
          body: readForm(form)
        });
        await loadUserDashboard();
        closeSheet();
        setMessage(byId("userFeedback"), "Profile updated successfully.", "success");
      } catch (error) {
        setMessage(message, window.FC_API.getErrorMessage(error, "Unable to update profile."), "error");
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
          '<span class="status-pill applied">' +
          window.FC_API.escapeHtml(String(job.application_count || 0)) +
          " applicants</span>" +
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
          "</td>" +
          "<td>" +
          '<div class="table-title">' + window.FC_API.escapeHtml(application.job.title) + "</div>" +
          '<div class="meta-line">' + window.FC_API.escapeHtml(application.job.company_name) + "</div>" +
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
  }
}());
