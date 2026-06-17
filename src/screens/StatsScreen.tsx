// src/screens/StatsScreen.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useMemo } from 'react';
import { useStreak } from '../hooks/useStreak';
import { BookOpen, Trophy, Zap, FileText } from 'lucide-react';

const StatsScreen = () => {
  const books = useLiveQuery(() => db.books.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const notes = useLiveQuery(() => db.bookNotes.toArray());
  const streak = useStreak();

  const stats = useMemo(() => {
    if (!books) return null;
    const active = books.filter(b => !b.deleted);
    const finished = active.filter(b => b.status === 'finished');
    const reading = active.filter(b => b.status === 'reading');
    const wantToRead = active.filter(b => b.status === 'to-read');
    const totalPages = finished.reduce((sum, b) => sum + b.totalPages, 0);

    // Top authors
    const authorCount: Record<string, number> = {};
    active.forEach(b => {
      const author = b.author.toLowerCase().trim();
      authorCount[author] = (authorCount[author] ?? 0) + 1;
    });
    const topAuthors = Object.entries(authorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author, count]) => ({ author, count }));

    // Completion rate
    const completionRate = active.length > 0
      ? Math.round((finished.length / active.length) * 100)
      : 0;

    return {
      total: active.length,
      finished: finished.length,
      reading: reading.length,
      wantToRead: wantToRead.length,
      totalPages,
      topAuthors,
      completionRate,
    };
  }, [books]);

  const sessionStats = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;

    // Pages per day for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const pagesPerDay = last7Days.map(day => {
      const daySessions = sessions.filter(s =>
        new Date(s.date).toISOString().split('T')[0] === day
      );
      const pages = daySessions.reduce((sum, s) => sum + (s.pagesRead ?? 0), 0);
      return {
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        pages,
      };
    });

    const totalSessionPages = sessions.reduce((sum, s) => sum + (s.pagesRead ?? 0), 0);
    const avgPagesPerSession = sessions.length > 0
      ? Math.round(totalSessionPages / sessions.length)
      : 0;

    const maxPages = Math.max(...pagesPerDay.map(d => d.pages), 1);

    return { pagesPerDay, totalSessionPages, avgPagesPerSession, maxPages };
  }, [sessions]);

  const noteStats = useMemo(() => {
    if (!notes) return { total: 0, noteCount: 0, quoteCount: 0 };
    return {
      total: notes.length,
      noteCount: notes.filter(n => n.type === 'note').length,
      quoteCount: notes.filter(n => n.type === 'quote').length,
    };
  }, [notes]);

  if (!stats) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-[13px] text-[#888780]">Loading stats…</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[15px] font-medium text-[#2C2C2A]">Your stats</h1>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[#888780] mb-1">
            <BookOpen size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Total books</span>
          </div>
          <p className="text-3xl font-medium text-[#2C2C2A]">{stats.total}</p>
          <p className="text-[10px] text-[#B4B2A9]">{stats.wantToRead} want to read</p>
        </div>
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[#888780] mb-1">
            <Trophy size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Finished</span>
          </div>
          <p className="text-3xl font-medium text-[#2C2C2A]">{stats.finished}</p>
          <p className="text-[10px] text-[#B4B2A9]">{stats.completionRate}% completion rate</p>
        </div>
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[#888780] mb-1">
            <Zap size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Streak</span>
          </div>
          <p className="text-3xl font-medium text-[#2C2C2A]">{streak}</p>
          <p className="text-[10px] text-[#B4B2A9]">day{streak !== 1 ? 's' : ''} in a row</p>
        </div>
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[#888780] mb-1">
            <FileText size={13} />
            <span className="text-[10px] uppercase tracking-wider font-medium">Pages read</span>
          </div>
          <p className="text-3xl font-medium text-[#2C2C2A]">{stats.totalPages.toLocaleString()}</p>
          <p className="text-[10px] text-[#B4B2A9]">across finished books</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Library breakdown</p>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {stats.finished > 0 && (
            <div
              className="bg-[#3B6D11] h-full rounded-l-full"
              style={{ width: `${(stats.finished / stats.total) * 100}%` }}
            />
          )}
          {stats.reading > 0 && (
            <div
              className="bg-[#185FA5] h-full"
              style={{ width: `${(stats.reading / stats.total) * 100}%` }}
            />
          )}
          {stats.wantToRead > 0 && (
            <div
              className="bg-[#E8E5DE] h-full rounded-r-full"
              style={{ width: `${(stats.wantToRead / stats.total) * 100}%` }}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3B6D11]" />
            <span className="text-[11px] text-[#5F5E5A]">Finished ({stats.finished})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#185FA5]" />
            <span className="text-[11px] text-[#5F5E5A]">Reading ({stats.reading})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#E8E5DE]" />
            <span className="text-[11px] text-[#5F5E5A]">Want ({stats.wantToRead})</span>
          </div>
        </div>
      </div>

      {/* Reading activity - last 7 days */}
      {sessionStats && (
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Pages last 7 days</p>
            <p className="text-[11px] text-[#888780]">avg {sessionStats.avgPagesPerSession} pp/session</p>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {sessionStats.pagesPerDay.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                  <div
                    className="w-full rounded-t-sm bg-[#2C2C2A] transition-all"
                    style={{
                      height: d.pages > 0 ? `${Math.max((d.pages / sessionStats.maxPages) * 60, 4)}px` : '2px',
                      background: d.pages > 0 ? '#2C2C2A' : '#E8E5DE',
                    }}
                  />
                </div>
                <span className="text-[9px] text-[#B4B2A9]">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top authors */}
      {stats.topAuthors.length > 0 && (
        <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Top authors</p>
          {stats.topAuthors.map((a, i) => (
            <div key={a.author} className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-[#B4B2A9] w-4">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-[#2C2C2A] capitalize">{a.author}</span>
                  <span className="text-[11px] text-[#888780]">{a.count} book{a.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-1 bg-[#E8E5DE] rounded-full">
                  <div
                    className="h-1 bg-[#2C2C2A] rounded-full"
                    style={{ width: `${(a.count / stats.topAuthors[0].count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes stats */}
      <div className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">Notes & quotes</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-2xl font-medium text-[#2C2C2A]">{noteStats.total}</p>
            <p className="text-[10px] text-[#B4B2A9]">total</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-2xl font-medium text-[#2C2C2A]">{noteStats.noteCount}</p>
            <p className="text-[10px] text-[#B4B2A9]">notes</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-2xl font-medium text-[#2C2C2A]">{noteStats.quoteCount}</p>
            <p className="text-[10px] text-[#B4B2A9]">quotes</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatsScreen;