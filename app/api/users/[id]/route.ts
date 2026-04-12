import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { name, place, contact, amount } = await req.json();

    if (!name || !place || !contact || amount === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Admins can only edit their own users unless they are superAdmin
    const query = session.isSuperAdmin ? { _id: params.id } : { _id: params.id, createdBy: session.adminId };

    const user = await User.findOneAndUpdate(
      query,
      { name: name.trim(), place: place.trim(), contact: contact.trim(), amount: Number(amount) },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const query = session.isSuperAdmin ? { _id: params.id } : { _id: params.id, createdBy: session.adminId };
    const user = await User.findOneAndDelete(query);

    if (!user) {
      return NextResponse.json({ error: 'User not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
