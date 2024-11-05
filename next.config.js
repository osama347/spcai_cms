/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'rsfmsafiyxfrqklkkjqj.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        },
      ],
      unoptimized: true,
    },
  }
  
  module.exports = nextConfig