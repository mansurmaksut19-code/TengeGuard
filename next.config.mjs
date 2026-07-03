/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  }
];

const apiHeaders = [
  ...securityHeaders,
  {
    key: "Cache-Control",
    value: "no-store, max-age=0"
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: apiHeaders
      },
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
