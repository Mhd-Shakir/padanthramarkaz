import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import User from '@/models/User';

// Public leaderboard: list all admins with their user counts
export async function GET() {
  try {
    await connectDB();

    const admins = await Admin.find({ isSuperAdmin: false, isActive: true })
      .select('name place createdAt')
      .sort({ name: 1 })
      .lean();

    // Count users per admin efficiently
    const userCounts = await User.aggregate([
      { $group: { _id: '$createdBy', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    const countMap = new Map(
      userCounts.map((item) => [item._id.toString(), { count: item.count, totalAmount: item.totalAmount }])
    );

    const leaderboard = admins
      .map((admin) => {
        const stats = countMap.get(admin._id.toString()) || { count: 0, totalAmount: 0 };
        return {
          _id: admin._id,
          name: admin.name,
          place: admin.place,
          userCount: stats.count,
          totalAmount: stats.totalAmount,
          joinedAt: admin.createdAt,
        };
      })
      .sort((a, b) => b.userCount - a.userCount);

    const totalUsers = leaderboard.reduce((sum, a) => sum + a.userCount, 0);
    const totalAmount = leaderboard.reduce((sum, a) => sum + a.totalAmount, 0);

    return NextResponse.json({
      leaderboard,
      stats: {
        totalAdmins: admins.length,
        totalUsers,
        totalAmount,
      },
    });
  } catch (error: unknown) {
    console.error('Leaderboard error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
