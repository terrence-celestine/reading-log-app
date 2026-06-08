export const BookSkeleton = () => (
    <div className="p-6 border border-slate-700/50 rounded-2xl bg-slate-800/20 animate-pulse flex gap-6">
      <div className="w-24 h-36 bg-slate-800 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-3">
          <div className="h-5 w-1/3 bg-slate-800 rounded" />
          <div className="h-4 w-1/4 bg-slate-800 rounded" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-slate-800/50 rounded" />
            <div className="h-3 w-5/6 bg-slate-800/50 rounded" />
          </div>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded mt-4" />
      </div>
    </div>
);
