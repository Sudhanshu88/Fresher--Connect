(function () {
  var TRACKABLE_STATUSES = [
    "applied",
    "reviewing",
    "shortlisted",
    "interview",
    "offered",
    "rejected"
  ];
  var TOKEN_STORAGE_KEY = "fc_auth_token";
  var TOKEN_EXPIRY_KEY = "fc_auth_expires_at";
  var ERROR_MESSAGES = {
    account_disabled: "This account has been disabled. Please contact a platform administrator.",
    admin_access_required: "This area is restricted to administrator accounts.",
    admin_login_required: "Administrator accounts must use the dedicated admin sign-in page.",
    company_not_found: "The selected employer record could not be found.",
    company_name_required: "Enter your registered company name before continuing.",
    company_verification_only: "This action only supports employer verification decisions.",
    company_verification_pending: "Your company account is pending administrator verification before sign-in can be enabled.",
    company_verification_rejected: "Your company account did not pass the administrator verification review.",
    education_required: "Enter your highest qualification before continuing.",
    email_already_registered: "This email is already registered. Sign in instead or use a different email.",
    email_required: "Enter your email address before continuing.",
    grad_year_required: "Enter your graduation year before continuing.",
    invalid_credentials: "The email address or password you entered is incorrect.",
    invalid_role: "Please choose whether you are creating a candidate or company account.",
    name_required: "Enter your full name before continuing.",
    password_too_short: "Use a password with at least 8 characters.",
    verification_status_required: "Select a verification decision before saving."
  };

  function readSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch (_error) {
      return "";
    }
  }

  function writeSessionValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_error) {
      // Ignore storage failures and continue with in-memory state.
    }
  }

  function removeSessionValue(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (_error) {
      // Ignore storage failures and continue with in-memory state.
    }
  }

  function normalizeBase(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function browserDefaultBase() {
    return normalizeBase(window.location.origin);
  }

  function coerceBrowserBase(value) {
    var normalized = normalizeBase(value);
    if (!normalized) {
      return browserDefaultBase();
    }

    if (window.location.protocol === "https:" && /^http:\/\//i.test(normalized)) {
      return browserDefaultBase();
    }

    return normalized;
  }

  function detectApiBase() {
    var params = new URLSearchParams(window.location.search);
    var queryBase = normalizeBase(params.get("api"));
    if (queryBase) {
      var nextQueryBase = coerceBrowserBase(queryBase);
      writeSessionValue("fc_api_base", nextQueryBase);
      return nextQueryBase;
    }

    if (typeof window.FC_API_BASE === "string" && window.FC_API_BASE.trim()) {
      return coerceBrowserBase(window.FC_API_BASE);
    }

    var stored = normalizeBase(readSessionValue("fc_api_base"));
    if (stored) {
      return coerceBrowserBase(stored);
    }

    if (window.location.port === "5000") {
      return normalizeBase(window.location.origin);
    }

    return browserDefaultBase();
  }

  var state = {
    apiBase: detectApiBase(),
    session: null,
    pendingSession: null,
    accessToken: readSessionValue(TOKEN_STORAGE_KEY),
    tokenExpiresAt: readSessionValue(TOKEN_EXPIRY_KEY)
  };

  function persistToken(token, expiresAt) {
    state.accessToken = String(token || "");
    state.tokenExpiresAt = String(expiresAt || "");

    if (state.accessToken) {
      writeSessionValue(TOKEN_STORAGE_KEY, state.accessToken);
    } else {
      removeSessionValue(TOKEN_STORAGE_KEY);
    }

    if (state.tokenExpiresAt) {
      writeSessionValue(TOKEN_EXPIRY_KEY, state.tokenExpiresAt);
    } else {
      removeSessionValue(TOKEN_EXPIRY_KEY);
    }
  }

  function clearToken() {
    persistToken("", "");
  }

  function resolveUrl(path) {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return state.apiBase + path;
  }

  function createError(response, data) {
    var message = "Request failed";
    if (data && typeof data === "object") {
      message = data.error || data.message || message;
    }
    var error = new Error(message);
    error.status = response.status;
    error.data = data;
    return error;
  }

  async function parseResponse(response) {
    var contentType = response.headers.get("content-type") || "";
    if (contentType.indexOf("application/json") >= 0) {
      return response.json();
    }
    return { ok: response.ok, text: await response.text() };
  }

  async function getSession(force) {
    if (!force && state.session) {
      return state.session;
    }

    if (!force && state.pendingSession) {
      return state.pendingSession;
    }

    var headers = new Headers();
    if (state.accessToken) {
      headers.set("Authorization", "Bearer " + state.accessToken);
    }

    state.pendingSession = fetch(resolveUrl("/api/session"), {
      headers: headers
    })
      .then(async function (response) {
        var data = await parseResponse(response);
        if (!response.ok) {
          if (response.status === 401) {
            clearToken();
            state.session = { ok: true, user: null };
            return state.session;
          }
          throw createError(response, data);
        }
        state.session = data;
        return data;
      })
      .finally(function () {
        state.pendingSession = null;
      });

    return state.pendingSession;
  }

  async function request(path, options) {
    var config = options || {};
    var method = (config.method || "GET").toUpperCase();
    var headers = new Headers(config.headers || {});
    var body = config.body;

    if (body && !(body instanceof FormData) && typeof body === "object") {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    if (state.accessToken) {
      headers.set("Authorization", "Bearer " + state.accessToken);
    }

    var response = await fetch(resolveUrl(path), {
      method: method,
      headers: headers,
      body: body
    });
    var data = await parseResponse(response);

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        state.session = { ok: true, user: null };
      }
      throw createError(response, data);
    }

    if (data && data.access_token) {
      persistToken(data.access_token, data.expires_at || "");
      state.session = { ok: true, user: data.user || null };
    }

    if (path === "/api/auth/logout") {
      clearToken();
      state.session = null;
      return data;
    }

    return data;
  }

  function redirectByRole(user) {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    if (user.role === "admin") {
      window.location.href = "admin.html";
      return;
    }
    window.location.href = user.role === "company" ? "company.html" : "user.html";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    try {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
    } catch (_error) {
      return String(value);
    }
  }

  function statusClass(status) {
    var safeStatus = String(status || "applied").toLowerCase();
    return TRACKABLE_STATUSES.indexOf(safeStatus) >= 0 ? safeStatus : "applied";
  }

  function getErrorMessage(error, fallback) {
    if (!error) {
      return fallback;
    }
    var code = "";
    if (error.data && typeof error.data === "object") {
      code = String(error.data.error || error.data.message || "").trim();
    }
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
    return (
      (error.data && (error.data.error || error.data.message)) ||
      error.message ||
      fallback
    );
  }

  window.FC_API = {
    request: request,
    getSession: getSession,
    redirectByRole: redirectByRole,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    getErrorMessage: getErrorMessage,
    getApiBase: function () {
      return state.apiBase;
    },
    setApiBase: function (value) {
      state.apiBase = normalizeBase(value);
      writeSessionValue("fc_api_base", state.apiBase);
      state.session = null;
    },
    refreshSession: function () {
      return getSession(true);
    },
    clearToken: clearToken,
    getAccessToken: function () {
      return state.accessToken;
    },
    statusClass: statusClass,
    statuses: TRACKABLE_STATUSES.slice()
  };
}());
