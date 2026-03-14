(function () {
  var TRACKABLE_STATUSES = [
    "applied",
    "reviewing",
    "shortlisted",
    "interview",
    "offered",
    "rejected"
  ];

  function normalizeBase(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function detectApiBase() {
    var params = new URLSearchParams(window.location.search);
    var queryBase = normalizeBase(params.get("api"));
    if (queryBase) {
      window.localStorage.setItem("fc_api_base", queryBase);
      return queryBase;
    }

    if (typeof window.FC_API_BASE === "string" && window.FC_API_BASE.trim()) {
      return normalizeBase(window.FC_API_BASE);
    }

    var stored = normalizeBase(window.localStorage.getItem("fc_api_base"));
    if (stored) {
      return stored;
    }

    if (window.location.port === "5000") {
      return normalizeBase(window.location.origin);
    }

    return "http://127.0.0.1:5000";
  }

  var state = {
    apiBase: detectApiBase(),
    session: null,
    pendingSession: null
  };

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

    state.pendingSession = fetch(resolveUrl("/api/session"), {
      credentials: "include"
    })
      .then(async function (response) {
        var data = await parseResponse(response);
        if (!response.ok) {
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

    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      var session = await getSession(Boolean(config.refreshSession));
      headers.set("X-CSRF-Token", session.csrf_token);
    }

    var response = await fetch(resolveUrl(path), {
      method: method,
      headers: headers,
      body: body,
      credentials: "include"
    });
    var data = await parseResponse(response);

    if (!response.ok) {
      throw createError(response, data);
    }

    if (path === "/api/auth/logout") {
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
      window.localStorage.setItem("fc_api_base", state.apiBase);
      state.session = null;
    },
    refreshSession: function () {
      return getSession(true);
    },
    statusClass: statusClass,
    statuses: TRACKABLE_STATUSES.slice()
  };
}());
