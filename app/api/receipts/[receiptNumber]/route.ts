import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

// Get receipt by receipt number (public endpoint)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ receiptNumber: string }> }
) {
  try {
    const { receiptNumber } = await params;
    await connectDB();

    const transaction = await Transaction.findOne({
      receiptNumber: receiptNumber,
    })
      .populate('userId', 'name place contact amount')
      .populate('adminId', 'name place')
      .populate('verifiedBy', 'name place');

    if (!transaction) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'verified') {
      return NextResponse.json(
        { error: 'Receipt not verified yet' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      receiptNumber: transaction.receiptNumber,
      user: transaction.userId,
      admin: transaction.adminId,
      amount: transaction.amount,
      submittedAt: transaction.submittedAt,
      verifiedAt: transaction.verifiedAt,
      verifiedBy: transaction.verifiedBy,
      status: transaction.status,
      notes: transaction.notes,
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
