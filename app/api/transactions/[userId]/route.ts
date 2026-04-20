import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

// User submits payment claim (public endpoint)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create transaction with status 'submitted'
    const transaction = new Transaction({
      userId: user._id,
      adminId: user.createdBy,
      amount: user.amount,
      status: 'submitted',
      submittedAt: new Date(),
    });

    await transaction.save();

    return NextResponse.json(
      {
        message: 'Payment submitted for verification',
        transaction: {
          _id: transaction._id,
          status: transaction.status,
          amount: transaction.amount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting payment:', error);
    return NextResponse.json(
      { error: 'Failed to submit payment' },
      { status: 500 }
    );
  }
}

// Get transaction status (public endpoint)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    await connectDB();
    const transaction = await Transaction.findOne({
      userId: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!transaction) {
      return NextResponse.json({
        status: 'pending',
        receiptNumber: null,
      });
    }

    return NextResponse.json({
      _id: transaction._id,
      status: transaction.status,
      amount: transaction.amount,
      submittedAt: transaction.submittedAt,
      verifiedAt: transaction.verifiedAt,
      receiptNumber: transaction.receiptNumber,
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}
