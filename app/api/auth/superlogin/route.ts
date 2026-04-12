import { NextResponse } from 'next/server';

// This route is deprecated. Super Admin now logs in via /api/auth/login
// using SUPER_ADMIN_NAME and SUPER_ADMIN_PHONE from .env.local
export async function POST() {
  return NextResponse.json(
    { error: 'Use the main login endpoint with your name and phone number.' },
    { status: 410 }
  );
}
