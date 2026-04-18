import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  place: string;
  contact: string;
  amount: number;
  shortCode: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/** 6-char alphanumeric code — ~2.2 billion combinations, enough for any scale */
function makeShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    place: {
      type: String,
      required: [true, 'Place is required'],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, 'Contact is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    shortCode: {
      type: String,
      unique: true,
      sparse: true,      // allows existing docs without this field
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Created by admin is required'],
    },
  },
  { timestamps: true }
);

// Auto-generate shortCode before saving if missing (works for new and existing users)
UserSchema.pre('save', async function () {
  if (!this.shortCode) {
    let code = makeShortCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await mongoose.models.User?.findOne({ shortCode: code });
      if (!exists) break;
      code = makeShortCode();
      attempts++;
    }
    this.shortCode = code;
  }
});

// Index for fast lookups by admin
UserSchema.index({ createdBy: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
