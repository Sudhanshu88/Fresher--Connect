import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://13.201.31.227:5000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/login.html", destination: "/login", permanent: false },
      { source: "/register.html", destination: "/register", permanent: false },
      { source: "/company-login", destination: "/login?role=company", permanent: false },
      { source: "/company-login.html", destination: "/login?role=company", permanent: false },
      { source: "/admin-login", destination: "/admin/login", permanent: false },
      { source: "/admin-login.html", destination: "/admin/login", permanent: false },
      { source: "/jobs.html", destination: "/jobs", permanent: false },
      {
        source: "/job-details.html",
        has: [{ type: "query", key: "job", value: "(?<jobId>[^/]+)" }],
        destination: "/jobs/:jobId",
        permanent: false
      },
      { source: "/job-details.html", destination: "/jobs", permanent: false },
      {
        source: "/application-status.html",
        has: [{ type: "query", key: "application", value: "(?<applicationId>[^/]+)" }],
        destination: "/applications/:applicationId",
        permanent: false
      },
      { source: "/application-status.html", destination: "/user", permanent: false },
      { source: "/user.html", destination: "/user", permanent: false },
      { source: "/company.html", destination: "/company", permanent: false },
      { source: "/admin.html", destination: "/admin", permanent: false }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
