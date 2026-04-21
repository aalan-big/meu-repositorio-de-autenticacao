/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'pg', '@prisma/adapter-pg'],
};

export default nextConfig;
