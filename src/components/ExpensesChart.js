import Chart from "./Chart";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ExpensesChart = ({ expenses }) => {
  const dataPoints = MONTHS.map((month) => ({ label: month, value: 0 }));

  expenses.forEach((expense) => {
    dataPoints[expense.date.getMonth()].value += expense.amount;
  });

  return <Chart dataPoints={dataPoints} />;
};

export default ExpensesChart;
