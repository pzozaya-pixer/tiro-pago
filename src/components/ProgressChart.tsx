const points = [8.2, 8.85, 8.45, 8.78, 8.42, 9.05];

export function ProgressChart() {
  const width = 290;
  const height = 105;
  const min = 7;
  const max = 10;
  const coordinates = points.map((point, index) => {
    const x = 16 + index * ((width - 32) / (points.length - 1));
    const y = 12 + ((max - point) / (max - min)) * (height - 28);
    return `${x},${y}`;
  });

  return (
    <div className="progress-card">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución semanal">
        {[10, 9, 8, 7].map((tick) => {
          const y = 12 + ((max - tick) / (max - min)) * (height - 28);
          return (
            <g key={tick}>
              <text x="0" y={y + 4}>
                {tick}
              </text>
              <line x1="34" x2={width - 8} y1={y} y2={y} />
            </g>
          );
        })}
        <polyline points={coordinates.join(' ')} />
        {coordinates.map((coord) => {
          const [cx, cy] = coord.split(',').map(Number);
          return <circle key={coord} cx={cx} cy={cy} r="4.5" />;
        })}
      </svg>
      <div className="progress-card__score">
        <strong>8,91</strong>
        <span>Media semanal</span>
      </div>
    </div>
  );
}
