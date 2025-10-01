import React from 'react';

const MetricsChart = ({ data, type = 'bar', title, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(item => item.count));
    const barWidth = 100 / data.length;
    
    return (
      <svg width="100%" height={height} className="overflow-visible">
        {data.map((item, index) => {
          const barHeight = (item.count / maxValue) * (height - 40);
          const x = (index * barWidth) + (barWidth / 2);
          const y = height - 20 - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={`${index * barWidth + 2}%`}
                y={y}
                width={`${barWidth - 4}%`}
                height={barHeight}
                fill="#3b82f6"
                className="transition-all duration-300 hover:fill-blue-600"
                rx="4"
              />
              <text
                x={`${x}%`}
                y={height - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600 font-medium"
              >
                {item.month || item.name}
              </text>
              <text
                x={`${x}%`}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-800 font-bold"
              >
                {item.count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    let currentAngle = 0;

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];

    // Columnas de leyenda: 1 (<=6 items), 2 (<=12), 3 (>12)
    const legendColsClasses = data.length > 12
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : data.length > 6
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1';

    return (
      <div className="flex flex-col lg:flex-row gap-4">
        <svg width="100%" height={height} className="overflow-visible lg:flex-shrink-0 lg:w-auto">
          <g transform={`translate(${height/2}, ${height/2})`}>
            {data.map((item, index) => {
              const percentage = (item.count / total) * 100;
              const angle = (percentage / 100) * 360;
              const largeArcFlag = angle > 180 ? 1 : 0;

              const x1 = Math.cos(currentAngle * Math.PI / 180) * 60;
              const y1 = Math.sin(currentAngle * Math.PI / 180) * 60;
              const x2 = Math.cos((currentAngle + angle) * Math.PI / 180) * 60;
              const y2 = Math.sin((currentAngle + angle) * Math.PI / 180) * 60;

              const path = [
                `M 0 0`,
                `L ${x1} ${y1}`,
                `A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              currentAngle += angle;

              return (
                <g key={index}>
                  <path
                    d={path}
                    fill={colors[index % colors.length]}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                  <text
                    x={Math.cos((currentAngle - angle/2) * Math.PI / 180) * 80}
                    y={Math.sin((currentAngle - angle/2) * Math.PI / 180) * 80}
                    className="text-xs fill-white font-bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {percentage.toFixed(1)}%
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Leyenda accesible y responsiva */}
        <div className={`grid ${legendColsClasses} gap-x-6 gap-y-2 items-start content-start min-w-[220px]`}
             aria-label="Leyenda de activos por categoría">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <span
                className="inline-block w-3 h-3 rounded-sm mr-2"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-xs text-gray-700 truncate">
                {item.name} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...data.map(item => item.count));
    const width = 300; // Ancho fijo para el SVG
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((item.count / maxValue) * height);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="100%" height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          className="transition-all duration-300"
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((item.count / maxValue) * height);
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
                className="transition-all duration-300 hover:r-6"
              />
              <text
                x={x}
                y={y > height/2 ? y + 20 : y - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600 font-medium"
              >
                {item.count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="w-full">
        {renderChart()}
      </div>
    </div>
  );
};

export default MetricsChart;
