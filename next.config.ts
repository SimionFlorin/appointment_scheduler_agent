import type { NextConfig } from "next";

const devTunnelOrigins =
  process.env.DEV_TUNNEL_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  ...(devTunnelOrigins.length > 0
    ? { allowedDevOrigins: devTunnelOrigins }
    : {}),
};

export default nextConfig;
