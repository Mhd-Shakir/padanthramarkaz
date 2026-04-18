import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

function makeShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * PATCH /api/users/[id]/shortcode
 * Generates and assigns a 6-char shortCode for an existing user.
 * Safe to call multiple times — reuses existing code if already assigned.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    // Scope to the owning admin or super admin
    const query = session.isSuperAdmin
      ? { _id: id }
      : { _id: id, createdBy: session.adminId };

    // Fetch the current user
    const user = await User.findOne(query).select('shortCode');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Already has a code — return it immediately, no DB write needed
    if (user.shortCode) {
      return NextResponse.json({ shortCode: user.shortCode });
    }

    // Generate a unique 6-char code
    let code = makeShortCode();
    for (let attempt = 0; attempt < 10; attempt++) {
      const clash = await User.findOne({ shortCode: code, _id: { $ne: id } }).select('_id');
      if (!clash) break;
      code = makeShortCode();
    }

    // Persist directly — no save() so timestamps don't change
    await User.updateOne(query, { $set: { shortCode: code } });

    return NextResponse.json({ shortCode: code });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
