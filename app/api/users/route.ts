import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import { getSession } from '@/lib/auth';

// POST: Add a new user (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin cannot add users directly. Use an admin account.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { name, place, contact, amount } = await req.json();

    if (!name || !place || !contact || amount === undefined) {
      return NextResponse.json(
        { error: 'All fields (name, place, contact, amount) are required' },
        { status: 400 }
      );
    }

    const user = await User.create({
      name: name.trim(),
      place: place.trim(),
      contact: contact.trim(),
      amount: Number(amount),
      createdBy: session.adminId,
    });

    return NextResponse.json(
      { success: true, user },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Add user error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Get users (Super Admin gets all, Admin gets their own)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let query = {};
    if (!session.isSuperAdmin) {
      query = { createdBy: session.adminId };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('createdBy', 'name place')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Get users error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
