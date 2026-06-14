const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  "adrian.localhost",
  "*.adrian.localhost",
]

const nextConfig = {
  allowedDevOrigins,
  async headers() {
    return [
      {
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
        source: "/:path*",
      },
    ]
  },
}

export default nextConfig
