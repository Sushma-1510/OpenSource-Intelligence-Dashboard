import { useState, useEffect, useContext } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Database, Clock } from 'lucide-react';
import { DashboardContext } from '../context/DashboardContext';
import apiClient from '../services/api';

const WINDOWS = [7, 30, 90];

const timeAgo = (iso) => {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
};

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/**
 * Time-series panel: fastest-growing repos over a window, star history for the
 * selected repo, and ingestion freshness from the sync log.
 */
const GrowthPanel = () => {
  const { isDarkMode } = useContext(DashboardContext);
  const [days, setDays] = useState(7);
  const [gainers, setGainers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [freshness, setFreshness] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get('/github/growth', { params: { days, limit: 8 } }),
      apiClient.get('/dashboard/sync-logs', { params: { limit: 1 } }),
    ])
      .then(([growthRes, logsRes]) => {
        if (cancelled) return;
        setError(null);
        const rows = growthRes.data || [];
        setGainers(rows);
        setFreshness({ ...logsRes.freshness, snapshotCount: logsRes.snapshotCount });
        setSelected((prev) => (rows.some((r) => r.fullName === prev) ? prev : rows[0]?.fullName || null));
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [days]);

  useEffect(() => {
    if (!selected) return undefined;
    let cancelled = false;
    apiClient
      .get('/github/history', { params: { fullName: selected, days } })
      .then((res) => !cancelled && setHistory(res.data || []))
      .catch(() => !cancelled && setHistory([]));
    return () => {
      cancelled = true;
    };
  }, [selected, days]);

  const textColor = isDarkMode ? '#94a3b8' : '#475569';
  const gridColor = isDarkMode ? 'rgba(36, 47, 73, 0.4)' : 'rgba(226, 232, 240, 0.7)';

  return (
    <div className="glass-card p-6 mt-6 border-slate-100 dark:border-gray-800/80 bg-white/60 dark:bg-[#0f172a]/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h2 className="text-sm font-extrabold font-outfit text-slate-800 dark:text-white uppercase tracking-wide">
            Star growth
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                days === w
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-gray-700'
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {freshness && (
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> GitHub synced {timeAgo(freshness.github)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Reddit synced {timeAgo(freshness.reddit)}
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> {freshness.snapshotCount?.toLocaleString() || 0} daily snapshots stored
          </span>
        </div>
      )}

      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : gainers.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Not enough history yet. A snapshot is saved each day the dashboard syncs, so growth appears
          after at least two days of data.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <ul className="lg:col-span-2 space-y-1.5">
            {gainers.map((g) => (
              <li key={g.fullName}>
                <button
                  onClick={() => setSelected(g.fullName)}
                  className={`w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-lg ${
                    selected === g.fullName
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <span className="truncate font-semibold">{g.fullName}</span>
                  <span className="ml-2 whitespace-nowrap font-mono text-emerald-600 dark:text-emerald-400">
                    +{g.starGain.toLocaleString()} ({g.growthPct}%)
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="lg:col-span-3 h-64">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Daily stars: <span className="font-semibold">{selected}</span>
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={selected ? history : []} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tickFormatter={shortDate} tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis
                  domain={['dataMin', 'dataMax']}
                  tick={{ fill: textColor, fontSize: 11 }}
                  tickFormatter={(v) => v.toLocaleString()}
                  width={70}
                />
                <Tooltip
                  labelFormatter={shortDate}
                  formatter={(v) => [v.toLocaleString(), 'Stars']}
                  contentStyle={{
                    background: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="stars" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthPanel;
