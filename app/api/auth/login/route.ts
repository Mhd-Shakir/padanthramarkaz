import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const normalizedName = name.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // ── Super Admin check (from env vars) ──────────────────────────
    const superName = (process.env.SUPER_ADMIN_NAME || '').toLowerCase();
    const superPhone = (process.env.SUPER_ADMIN_PHONE || '').trim();

    if (normalizedName === superName && normalizedPhone === superPhone) {
      const token = await signToken({
        adminId: 'superadmin',
        name: 'Super Admin',
        isSuperAdmin: true,
        accessCode: 'superadmin',
      });

      const response = NextResponse.json({
        success: true,
        isSuperAdmin: true,
        name: 'Super Admin',
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // ── Regular Admin check (from MongoDB) ─────────────────────────
    await connectDB();

    const admin = await Admin.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      phone: normalizedPhone,
      isActive: true,
      isSuperAdmin: false,
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'No account found with that name and phone number.' },
        { status: 401 }
      );
    }

    const token = await signToken({
      adminId: admin._id.toString(),
      name: admin.name,
      isSuperAdmin: false,
      accessCode: admin.accessCode,
    });

    const response = NextResponse.json({
      success: true,
      isSuperAdmin: false,
      name: admin.name,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
