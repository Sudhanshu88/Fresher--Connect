import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/", destination: "/index.html", permanent: false },
      { source: "/login", destination: "/login.html", permanent: false },
      { source: "/register", destination: "/register.html", permanent: false },
      { source: "/company-login", destination: "/company-login.html", permanent: false },
      { source: "/jobs", destination: "/jobs.html", permanent: false },
      { source: "/jobs/:id", destination: "/job-details.html?job=:id", permanent: false },
      { source: "/applications/:id", destination: "/application-status.html?application=:id", permanent: false },
      { source: "/user", destination: "/user.html", permanent: false },
      { source: "/company", destination: "/company.html", permanent: false },
      { source: "/admin", destination: "/admin.html", permanent: false }
    ];
  }
};

export default nextConfig;
