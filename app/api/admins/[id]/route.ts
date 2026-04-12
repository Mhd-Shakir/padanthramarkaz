import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { name, place, phone } = await req.json();

    if (!name || !place || !phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const admin = await Admin.findByIdAndUpdate(
      params.id,
      { name: name.trim(), place: place.trim(), phone: phone.trim() },
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

export async function DELETE(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const admin = await Admin.findByIdAndDelete(params.id);

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
