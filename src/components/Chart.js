import ChartBar from "./ChartBar";

const Chart = ({ dataPoints }) => {
  const maxValue = Math.max(0, ...dataPoints.map((dataPoint) => dataPoint.value));
  const activeMonths = dataPoints
    .filter((dataPoint) => dataPoint.value > 0)
    .map((dataPoint) => `${dataPoint.label} $${dataPoint.value.toFixed(2)}`);
  const chartDescription = activeMonths.length
    ? `Monthly expense chart. ${activeMonths.join(", ")}.`
    : "Monthly expense chart. No spending recorded for this year.";

  return (
    <div className="chart" role="img" aria-label={chartDescription}>
      {dataPoints.map((dataPoint) => (
        <ChartBar
          key={dataPoint.label}
          value={dataPoint.value}
          maxValue={maxValue}
          label={dataPoint.label}
        />
      ))}
    </div>
  );
};

export default Chart;
