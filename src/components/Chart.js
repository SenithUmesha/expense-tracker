import ChartBar from "./ChartBar";

const Chart = ({ dataPoints }) => {
  const maxValue = Math.max(0, ...dataPoints.map((dataPoint) => dataPoint.value));

  return (
    <div className="chart" aria-label="Monthly expense chart">
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
