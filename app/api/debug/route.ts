import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
  }

  return NextResponse.json({
    envVars,
    url: request.url,
    host: request.headers.get('host'),
  })
}
