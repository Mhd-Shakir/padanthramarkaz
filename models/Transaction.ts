import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  submittedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  receiptNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Generate unique receipt number */
function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${year}${month}${day}-${random}`;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    submittedAt: Date,
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    notes: String,
  },
  { timestamps: true }
);

// Auto-generate receipt number when status changes to verified
TransactionSchema.pre('save', async function () {
  if (this.status === 'verified' && !this.receiptNumber) {
    let number = generateReceiptNumber();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await mongoose.models.Transaction?.findOne({
        receiptNumber: number,
      });
      if (!exists) break;
      number = generateReceiptNumber();
      attempts++;
    }
    this.receiptNumber = number;
  }
});

// Index for finding transactions by user and status
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ adminId: 1, status: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
