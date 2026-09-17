export const MONTH_LABELS = [
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

export const getAvailableYears = (expenses, currentYear) => {
  const years = new Set([
    currentYear,
    ...expenses.map((expense) => expense.date.getFullYear()),
  ]);

  return [...years].sort((a, b) => b - a);
};

export const getExpensesForYear = (expenses, year) =>
  expenses
    .filter((expense) => expense.date.getFullYear() === year)
    .slice()
    .sort((a, b) => b.date - a.date);

export const summarizeExpenses = (expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;
  const largest = expenses.reduce(
    (highest, expense) => Math.max(highest, expense.amount),
    0
  );

  return { total, count, average, largest };
};

export const getMonthlyExpenseTotals = (expenses) => {
  const dataPoints = MONTH_LABELS.map((label) => ({ label, value: 0 }));

  expenses.forEach((expense) => {
    dataPoints[expense.date.getMonth()].value += expense.amount;
  });

  return dataPoints;
};
