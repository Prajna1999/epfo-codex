import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TWILIO_IVR_NUMBER: process.env.TWILIO_IVR_NUMBER,
  },
   allowedDevOrigins: ['13a4-2401-4900-8fd2-4ad4-a0f2-ed86-e81e-404f.ngrok-free.app'],
};

export default nextConfig;
