import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Transaction from '@/models/Transaction';

// Get all transactions for admin
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all transactions for this admin
    const transactions = await Transaction.find({
      adminId: session.adminId,
    })
      .populate('userId', 'name place contact amount')
      .populate('verifiedBy', 'name')
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
