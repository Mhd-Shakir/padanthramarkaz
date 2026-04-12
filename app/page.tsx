'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LeaderboardEntry {
  _id: string;
  name: string;
  place: string;
  userCount: number;
  totalAmount: number;
  joinedAt: string;
}



function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-100">
      <td className="px-3 py-3"><div className="h-4 skeleton rounded w-8" /></td>
      <td className="px-3 py-3"><div className="h-4 skeleton rounded w-28" /></td>
      <td className="px-3 py-3"><div className="h-4 skeleton rounded w-20" /></td>
      <td className="px-3 py-3"><div className="h-4 skeleton rounded w-10 ml-auto" /></td>
    </tr>
  );
}

export default function HomePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeaderboard(data.leaderboard);
      setLastUpdated(new Date());
    } catch {
      // silent fail on background refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const filtered = leaderboard.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.place.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <div className="min-h-screen bg-white dot-grid">

      {/* ── TOP HERO BANNER ─────────────────────────────────────── */}
      <div className="relative text-white overflow-hidden bg-black">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/image.png"
            alt="Padanthara Markaz Background"
            fill
            className="object-cover object-center opacity-40"
            priority
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center text-center gap-5">
          {/* Logo */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 bg-white rounded-2xl p-2 shadow-2xl">
            <Image
              src="/logo.png"
              alt="Padanthara Markaz Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase drop-shadow-md">
              Padanthara Markaz
            </h1>
          </div>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 border border-white/30 bg-black/30 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest shadow-lg">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            LIVE LEADERBOARD
          </div>
        </div>
      </div>

      {/* ── STICKY HEADER (after banner) ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-black rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[11px]">PM</span>
            </div>
            <span className="font-bold text-sm truncate">Padanthara Markaz</span>
          </div>
          <Link
            href="/auth"
            className="flex-shrink-0 flex items-center gap-1.5 bg-black text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Admin Portal
            <span className="hidden sm:inline">→</span>
          </Link>
        </div>
      </header>



      {/* ── LEADERBOARD TABLE ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-20 pt-6">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden animate-fade-up">

          {/* Controls */}
          <div className="px-4 py-3 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm sm:text-base">Rankings</h2>
              {leaderboard.length > 0 && (
                <span className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                  {leaderboard.length} admins
                </span>
              )}
              {lastUpdated && (
                <span className="text-[10px] text-neutral-400 hidden sm:inline">
                  · {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  placeholder="Search admins..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs border border-neutral-200 rounded-lg px-3 py-2 pl-7 focus:outline-none focus:border-black w-full sm:w-44 transition-all"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">⌕</span>
              </div>
              <button
                onClick={fetchLeaderboard}
                className="text-xs border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors font-medium flex-shrink-0"
                title="Refresh"
              >
                ↻
              </button>
            </div>
          </div>

          {/* Table — scrollable on mobile */}
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-sm min-w-[340px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Place
                  </th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-neutral-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-2 border-dashed border-neutral-200 rounded-full flex items-center justify-center">
                          <span className="text-neutral-300 text-lg">∅</span>
                        </div>
                        <p className="text-xs font-medium">
                          {search ? `No admins match "${search}"` : 'No admins yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => {
                    const rank = leaderboard.indexOf(entry) + 1;
                    const isTop3 = rank <= 3;
                    const maxCount = leaderboard[0]?.userCount || 1;
                    return (
                      <tr
                        key={entry._id}
                        className={`border-b border-neutral-50 transition-colors hover:bg-neutral-50/80 ${
                          isTop3 ? 'bg-neutral-50/40' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black ${
                              rank === 1
                                ? 'bg-black text-white'
                                : rank === 2
                                ? 'bg-neutral-600 text-white'
                                : rank === 3
                                ? 'bg-neutral-400 text-white'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="px-3 py-3">
                          <span className={`font-semibold text-sm leading-none ${isTop3 ? 'text-black' : 'text-neutral-800'}`}>
                            {entry.name}
                          </span>
                        </td>

                        {/* Place */}
                        <td className="px-3 py-3 text-neutral-500 text-xs max-w-[90px]">
                          <span className="truncate block">{entry.place}</span>
                        </td>

                        {/* Users + bar */}
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="hidden md:flex w-16 h-1 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-black rounded-full"
                                style={{ width: `${Math.min(100, (entry.userCount / maxCount) * 100)}%` }}
                              />
                            </div>
                            <span className="font-black text-sm tabular-nums">{entry.userCount}</span>
                          </div>
                        </td>


                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Padanthara Markaz. All rights reserved.</p>
          <Link href="/auth" className="hover:text-black transition-colors font-medium">
            Admin Login →
          </Link>
        </div>
      </footer>
    </div>
  );
}
