/**
 * Remote image hosts are restricted to the Supabase project this site actually
 * uploads to, derived from NEXT_PUBLIC_SUPABASE_URL.
 *
 * The permissive `hostname: '**'` this started with made /_next/image an
 * unauthenticated open proxy: anyone could pass any https URL and have this
 * deployment fetch it, resize it, and serve it from this domain — burning the
 * image-optimisation quota, laundering the origin of arbitrary content through
 * a domain that carries the owner's name, and giving a free SSRF-shaped fetch
 * primitive against any host the deployment can reach.
 *
 * Deriving the host rather than hardcoding it means pointing the site at a
 * different Supabase project needs no edit here. If the variable is absent at
 * build time, no remote host is permitted at all — local /public images still
 * work, and a missing upload is a visibly broken image rather than a silently
 * reopened proxy.
 */
function supabaseImageHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];

  try {
    const { hostname } = new URL(url);
    return [
      {
        protocol: 'https',
        hostname,
        pathname: '/storage/v1/object/public/**',
      },
    ];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseImageHost(),
  },
};

export default nextConfig;
