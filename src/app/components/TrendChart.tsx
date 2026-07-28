import { LineChart } from "lucide-react";

interface TrendChartProps {
  history: number[];
}

const EDITION_YEAR = 2026;

export default function TrendChart({ history }: TrendChartProps) {
  const data = history
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 5)
    .reverse();

  if (data.length < 2) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1a365d] shadow-sm ring-1 ring-slate-200">
          <LineChart className="h-5 w-5" />
        </span>
        <h4 className="mt-4 text-sm font-bold text-slate-900">
          More ranking history is needed
        </h4>
        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
          This institution currently has one verified ranking edition. The trend chart
          will appear after a second edition is available.
        </p>
      </div>
    );
  }

  const width = 640;
  const height = 280;
  const padding = 44;
  const years = data.map(
    (_, index) => EDITION_YEAR - (data.length - 1 - index),
  );
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const domainPadding = Math.max(2, Math.ceil((dataMax - dataMin) * 0.2));
  const minRank = Math.max(1, dataMin - domainPadding);
  const maxRank = Math.max(minRank + 1, dataMax + domainPadding);
  const xSpan = width - padding * 2;
  const ySpan = height - padding * 2;

  const getX = (index: number) =>
    padding + (index * xSpan) / Math.max(data.length - 1, 1);
  const getY = (value: number) =>
    padding + ((value - minRank) / (maxRank - minRank)) * ySpan;

  const pathData = data
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(value)}`,
    )
    .join(" ");

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h4 className="font-serif text-lg font-bold text-slate-900">
          Ranking trajectory
        </h4>
        <p className="text-xs text-slate-500">
          Verified AUR edition history. A lower rank is better.
        </p>
      </div>

      <div className="min-w-[520px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Ranking history from ${years[0]} to ${years.at(-1)}`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * ySpan;
            const rankLabel = Math.round(minRank + ratio * (maxRank - minRank));
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  #{rankLabel}
                </text>
              </g>
            );
          })}

          {years.map((year, index) => (
            <text
              key={year}
              x={getX(index)}
              y={height - padding + 22}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] font-bold"
            >
              {year}
            </text>
          ))}

          <path
            d={pathData}
            fill="none"
            stroke="#1a365d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((value, index) => {
            const x = getX(index);
            const y = getY(value);
            return (
              <g key={`${years[index]}-${value}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#ffffff"
                  stroke="#d89b22"
                  strokeWidth="3"
                />
                <text
                  x={x}
                  y={y - 14}
                  textAnchor="middle"
                  className="fill-amber-700 font-mono text-[10px] font-bold"
                >
                  #{value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
