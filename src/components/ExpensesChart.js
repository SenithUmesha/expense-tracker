import { getMonthlyExpenseTotals } from "../domain/expenses";
import Chart from "./Chart";

const ExpensesChart = ({ expenses }) => (
  <Chart dataPoints={getMonthlyExpenseTotals(expenses)} />
);

export default ExpensesChart;
