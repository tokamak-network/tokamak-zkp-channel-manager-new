/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    // Ignore React Native modules that MetaMask SDK tries to import
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
