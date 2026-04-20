import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Transaction from '@/models/Transaction';
import Admin from '@/models/Admin';

// Admin verifies transaction
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes } = await req.json();
    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be verified or rejected' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify admin exists and is authorized
    const admin = await Admin.findById(session.adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Ensure admin can only verify transactions they created
    if (transaction.adminId.toString() !== session.adminId) {
      return NextResponse.json(
        { error: 'Cannot verify transactions from other admins' },
        { status: 403 }
      );
    }

    // Update transaction
    transaction.status = status;
    transaction.verifiedAt = new Date();
    transaction.verifiedBy = admin._id;
    if (notes) transaction.notes = notes;

    await transaction.save();

    return NextResponse.json({
      message: `Payment ${status} successfully`,
      transaction: {
        _id: transaction._id,
        status: transaction.status,
        receiptNumber: transaction.receiptNumber,
        verifiedAt: transaction.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return NextResponse.json(
      { error: 'Failed to verify transaction' },
      { status: 500 }
    );
  }
}

// Get transaction details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    
    const session = await getSession();
    if (!session || !session.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const transaction = await Transaction.findById(transactionId)
      .populate('userId', 'name amount place')
      .populate('adminId', 'name place')
      .populate('verifiedBy', 'name');

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (transaction.adminId._id.toString() !== session.adminId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this transaction' },
        { status: 403 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}
