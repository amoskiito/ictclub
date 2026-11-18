// Small dependency-free SVG charts for the admin dashboard.
const NAVY = "#1b2340";
const TEAL = "#1fb6a6";
const YELLOW = "#d99a00";
const GRID = "#e3e6ef";
const short = (s, n = 12) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function LineChart({ data, title, height = 230 }) {
  const W = 640, H = height, pad = { l: 38, r: 14, t: 14, b: 30 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = Math.ceil(max / 4) * 4 || 4;
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const summary = `${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={summary}>
      <title>{summary}</title>
      {[0, 1, 2, 3, 4].map((t) => {
        const v = (top / 4) * t;
        return (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={GRID} />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" className="chart-tick">{Math.round(v)}</text>
          </g>
        );
      })}
      <polyline points={points} fill="none" stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.value)} r="4" fill={NAVY}><title>{`${d.label}: ${d.value}`}</title></circle>
          {(i % 2 === 0 || data.length < 8) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="chart-tick">{d.label.slice(2)}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// data: [{ label, values: [a, b] }], series: [{ name, color }]
export function BarChart({ data, series, title, height = 250, max }) {
  const W = 640, H = height, pad = { l: 38, r: 14, t: 14, b: 54 };
  const top = max || Math.max(1, ...data.flatMap((d) => d.values));
  const niceTop = max || Math.ceil(top / 4) * 4 || 4;
  const group = (W - pad.l - pad.r) / Math.max(1, data.length);
  const barW = Math.min(34, (group - 10) / series.length);
  const y = (v) => pad.t + (1 - v / niceTop) * (H - pad.t - pad.b);
  const summary = `${title}: ${data.map((d) => `${d.label} ${series.map((s, i) => `${s.name} ${d.values[i]}`).join(" ")}`).join("; ")}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={summary}>
        <title>{summary}</title>
        {[0, 1, 2, 3, 4].map((t) => {
          const v = (niceTop / 4) * t;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={GRID} />
              <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" className="chart-tick">{Math.round(v * 10) / 10}</text>
            </g>
          );
        })}
        {data.map((d, gi) => {
          const gx = pad.l + gi * group + (group - barW * series.length) / 2;
          return (
            <g key={d.label + gi}>
              {series.map((s, si) => (
                <rect key={s.name} x={gx + si * barW} y={y(d.values[si])} width={barW - 2}
                  height={H - pad.b - y(d.values[si])} rx="3" fill={s.color}>
                  <title>{`${d.label} - ${s.name}: ${d.values[si]}`}</title>
                </rect>
              ))}
              <text x={pad.l + gi * group + group / 2} y={H - pad.b + 16} textAnchor="middle" className="chart-tick">
                {short(d.label, 14)}
              </text>
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export const CHART_COLORS = { navy: NAVY, teal: TEAL, gold: YELLOW };
