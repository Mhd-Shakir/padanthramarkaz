import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Admin from '@/models/Admin';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, notes } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    const [user, admin] = await Promise.all([
      User.findById(userId),
      Admin.findById(session.adminId),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Create and verify transaction in one go
    const transaction = new Transaction({
      userId: user._id,
      adminId: admin._id,
      amount: user.amount,
      status: 'verified',
      submittedAt: new Date(),
      verifiedAt: new Date(),
      verifiedBy: admin._id,
      notes: notes || 'Direct verification by admin',
    });

    await transaction.save();

    return NextResponse.json({
      success: true,
      transaction: {
        _id: transaction._id,
        receiptNumber: transaction.receiptNumber,
        amount: transaction.amount,
        userName: user.name,
        place: user.place,
        date: transaction.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Instant verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
