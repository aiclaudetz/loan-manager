import React from 'react';

// Vertical bar chart built with plain SVG - no external library needed.
// data: [{ label: 'Jan', value: 120000 }, ...]
export const BarChart = ({ data, color = '#2563eb', height = 220, formatValue }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No data to display</div>;
  }

  const width = 640;
  const paddingLeft = 56;
  const paddingBottom = 36;
  const paddingTop = 16;
  const chartWidth = width - paddingLeft - 16;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barGap = 14;
  const barWidth = Math.max(8, chartWidth / data.length - barGap);

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxValue / yTicks) * i));

  const fmt = formatValue || ((v) => v.toLocaleString());

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', fontFamily: 'inherit' }}>
      {/* Grid lines and Y-axis numbers */}
      {ticks.map((t, i) => {
        const y = paddingTop + chartHeight - (t / maxValue) * chartHeight;
        return (
          <g key={i}>
            <line x1={paddingLeft} y1={y} x2={width - 16} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {fmt(t)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = maxValue > 0 ? (d.value / maxValue) * chartHeight : 0;
        const x = paddingLeft + i * (barWidth + barGap) + barGap / 2;
        const y = paddingTop + chartHeight - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill={color} />
            <text
              x={x + barWidth / 2}
              y={paddingTop + chartHeight + 18}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Donut chart built with plain SVG.
// data: [{ label: 'Active', value: 5, color: '#2563eb' }, ...]
export const DonutChart = ({ data, size = 200, thickness = 32 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No data to display</div>;
  }

  const radius = size / 2;
  const innerRadius = radius - thickness;
  const center = radius;

  let cumulative = 0;
  const segments = data
    .filter(d => d.value > 0)
    .map((d) => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += d.value;
      const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);
      const ix1 = center + innerRadius * Math.cos(endAngle);
      const iy1 = center + innerRadius * Math.sin(endAngle);
      const ix2 = center + innerRadius * Math.cos(startAngle);
      const iy2 = center + innerRadius * Math.sin(startAngle);

      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      return { ...d, pathData, percent: Math.round((d.value / total) * 100) };
    });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
        {segments.map((s, i) => (
          <path key={i} d={s.pathData} fill={s.color} />
        ))}
        <text x={center} y={center - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e293b">
          {total}
        </text>
        <text x={center} y={center + 16} textAnchor="middle" fontSize="11" fill="#94a3b8">
          Total
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, display: 'inline-block' }} />
            <span style={{ color: '#475569' }}>{s.label}</span>
            <span style={{ color: '#94a3b8' }}>({s.value} — {s.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
