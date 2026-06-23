import { useTrainingStore } from '../store/useTrainingStore';
import { formatAverage } from '../lib/scoring';

export function ProgressChart() {
  const tiradas = useTrainingStore((state) => state.tiradas);

  // Obtener las últimas 6 tiradas válidas (con disparos) en orden cronológico
  const validTiradas = [...tiradas]
    .filter((t) => t.totalShots > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartTiradas = validTiradas.slice(-6);
  const points = chartTiradas.map((t) => t.averageScore);

  // Si no hay datos, mostramos un estado inicial elegante
  if (points.length === 0) {
    return (
      <div className="progress-card" style={{ display: 'grid', gridTemplateColumns: '1fr', placeItems: 'center', minHeight: '107px', padding: '24px' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' }}>
          Registra tu primera tirada para ver el progreso semanal
        </span>
      </div>
    );
  }

  // Calcular la media de las tiradas mostradas en el gráfico
  const totalScore = chartTiradas.reduce((sum, t) => sum + t.totalScore, 0);
  const totalShots = chartTiradas.reduce((sum, t) => sum + t.totalShots, 0);
  const chartAverage = totalShots ? totalScore / totalShots : 0;

  const width = 290;
  const height = 105;
  const max = 10;
  // Establecemos un mínimo dinámico pero que no sea mayor que 7 para mantener la perspectiva
  const min = Math.min(7, Math.max(0, Math.floor(Math.min(...points) - 0.5)));

  const coordinates = points.map((point, index) => {
    const x = 38 + (points.length > 1 ? index * ((width - 50) / (points.length - 1)) : (width - 50) / 2);
    const y = 12 + ((max - point) / (max - min)) * (height - 28);
    return `${x},${y}`;
  });

  // Generar ticks de 1 en 1 desde max (10) hasta min
  const ticks = Array.from({ length: 11 - min }, (_, i) => 10 - i);

  return (
    <div className="progress-card">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución semanal">
        {ticks.map((tick) => {
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
        {coordinates.map((coord, idx) => {
          const [cx, cy] = coord.split(',').map(Number);
          return <circle key={idx} cx={cx} cy={cy} r="4.5" />;
        })}
      </svg>
      <div className="progress-card__score">
        <strong>{formatAverage(chartAverage)}</strong>
        <span>Media semanal</span>
      </div>
    </div>
  );
}

