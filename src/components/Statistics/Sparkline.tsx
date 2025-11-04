import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  fillColor?: string;
  showFill?: boolean;
}

export const Sparkline = ({
  data,
  width = 100,
  height = 30,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  fillColor = 'rgba(59, 130, 246, 0.1)',
  showFill = true,
}: SparklineProps) => {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Prevent division by zero

  // Calculate points for the line
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create a filled area path
  const areaPath = showFill
    ? `M 0,${height} L ${points} L ${width},${height} Z`
    : '';

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {showFill && (
        <path
          d={areaPath}
          fill={fillColor}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
