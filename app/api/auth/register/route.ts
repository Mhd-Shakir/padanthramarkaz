import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { generateAccessCode, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { name, place, phone } = await req.json();

    if (!name || !place || !phone) {
      return NextResponse.json(
        { error: 'Name, place, and phone are required' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existing = await Admin.findOne({ phone: phone.trim() });
    if (existing) {
      return NextResponse.json(
        { error: 'An admin with this phone number already exists' },
        { status: 409 }
      );
    }

    // Generate a unique access code
    let accessCode = generateAccessCode(name);
    let codeExists = await Admin.findOne({ accessCode });
    let attempts = 0;
    while (codeExists && attempts < 10) {
      accessCode = generateAccessCode(name);
      codeExists = await Admin.findOne({ accessCode });
      attempts++;
    }

    const admin = await Admin.create({
      name: name.trim(),
      place: place.trim(),
      phone: phone.trim(),
      accessCode,
      isSuperAdmin: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Save your access code.',
        accessCode: admin.accessCode,
        name: admin.name,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
