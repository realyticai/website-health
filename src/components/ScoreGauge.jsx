import { getScoreColor } from '../utils/scoring';

export default function ScoreGauge({ score, size = 100 }) {
  const strokeWidth = size < 60 ? 4 : 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  // Background fill color (lighter version)
  const bgColor = score >= 90
    ? 'rgba(34, 197, 94, 0.1)'
    : score >= 50
      ? 'rgba(245, 158, 11, 0.1)'
      : 'rgba(239, 68, 68, 0.1)';

  const fontSize = size < 60 ? '1rem' : '1.8rem';

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Colored background circle fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill={bgColor}
          stroke="none"
        />
        {/* Gray track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--gray-200)"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Colored progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Score number centered */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontFamily="var(--font-heading)"
          fontSize={fontSize}
          fontWeight="800"
        >
          {score ?? '–'}
        </text>
      </svg>
    </div>
  );
}
