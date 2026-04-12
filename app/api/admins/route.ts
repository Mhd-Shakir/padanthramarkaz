import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

// GET all admins (Super Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const query = search
      ? {
          isSuperAdmin: false,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { place: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        }
      : { isSuperAdmin: false };

    const [admins, total] = await Promise.all([
      Admin.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Admin.countDocuments(query),
    ]);

    // Get user counts for these admins
    const adminIds = admins.map((a) => a._id);
    const userCounts = await User.aggregate([
      { $match: { createdBy: { $in: adminIds } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    const countMap = new Map(
      userCounts.map((item) => [item._id.toString(), { count: item.count, totalAmount: item.totalAmount }])
    );

    const adminsWithStats = admins.map((admin) => {
      const stats = countMap.get(admin._id.toString()) || { count: 0, totalAmount: 0 };
      return { ...admin, userCount: stats.count, totalAmount: stats.totalAmount };
    });

    return NextResponse.json({
      admins: adminsWithStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Toggle admin active status (Super Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { adminId, isActive } = await req.json();

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { isActive },
      { new: true }
    ).select('-__v');

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, admin });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
