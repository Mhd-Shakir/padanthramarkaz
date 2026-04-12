import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [totalAdmins, activeAdmins, userStats] = await Promise.all([
      Admin.countDocuments({ isSuperAdmin: false }),
      Admin.countDocuments({ isSuperAdmin: false, isActive: true }),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const totalUsers = userStats.length > 0 ? userStats[0].totalUsers : 0;
    const totalAmount = userStats.length > 0 ? userStats[0].totalAmount : 0;

    return NextResponse.json({
      totalAdmins,
      activeAdmins,
      totalUsers,
      totalAmount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
