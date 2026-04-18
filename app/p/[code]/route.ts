import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /p/[code]
 * Resolves a 6-char shortCode → redirects to /pay/[userId]
 * Public — no auth required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || code.length > 12) {
    return NextResponse.redirect(new URL('/', _req.url));
  }

  try {
    await connectDB();
    const user = await User.findOne({ shortCode: code }).select('_id').lean();

    if (!user) {
      // Return a minimal 404 page inline
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Link not found</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>❌ Payment link not found</h2>
          <p>This link may be invalid or expired.</p>
        </body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const destination = new URL(`/pay/${user._id}`, _req.url);
    // 302 so future short-code updates still work
    return NextResponse.redirect(destination, { status: 302 });
  } catch {
    return NextResponse.redirect(new URL('/', _req.url));
  }
}
