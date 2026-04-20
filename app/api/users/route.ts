import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
// Explicitly import Admin so its schema is registered with Mongoose before
// any populate() call — Turbopack tree-shakes unused imports otherwise.
import '@/models/Admin';
import Transaction from '@/models/Transaction';

// POST: Add a new user (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { name, place, contact, amount, adminId } = await req.json();

    if (session.isSuperAdmin && !adminId) {
      return NextResponse.json(
        { error: 'Super Admin must select an Admin to assign the user to.' },
        { status: 400 }
      );
    }

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
      createdBy: session.isSuperAdmin ? adminId : session.adminId,
    });

    if (session.isSuperAdmin) {
      await user.populate('createdBy', 'name place');
    }

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

    const query = session.isSuperAdmin ? {} : { createdBy: session.adminId };

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('createdBy', 'name place')
        .select('name place contact amount shortCode createdAt createdBy')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Fetch latest transaction for each user to determine status
    const usersWithStatus = await Promise.all(
      users.map(async (user: any) => {
        const lastTx = await Transaction.findOne({ userId: user._id })
          .sort({ createdAt: -1 })
          .select('status receiptNumber verifiedAt')
          .lean();
        return {
          ...user,
          transactionStatus: lastTx?.status || 'pending',
          receiptNumber: lastTx?.receiptNumber || null,
          verifiedAt: lastTx?.verifiedAt || null,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStatus,
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
