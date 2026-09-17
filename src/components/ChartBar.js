const ChartBar = ({ value, maxValue, label }) => {
  const fillHeight = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

  return (
    <div className="chart-bar" title={`${label}: $${value.toFixed(2)}`}>
      <div className="chart-bar-track" aria-hidden="true">
        <div
          className="chart-bar-fill"
          style={{ height: `${fillHeight}%` }}
        />
      </div>
      <span>{label}</span>
    </div>
  );
};

export default ChartBar;
