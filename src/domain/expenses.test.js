import {
  getAvailableYears,
  getExpensesForYear,
  getMonthlyExpenseTotals,
  summarizeExpenses,
} from "./expenses";

const expense = (id, amount, date) => ({
  id,
  title: id,
  amount,
  date: new Date(`${date}T12:00:00`),
});

describe("expense domain analytics", () => {
  test("derives unique available years and always keeps the current year", () => {
    const result = getAvailableYears(
      [
        expense("a", 10, "2024-01-02"),
        expense("b", 20, "2024-02-03"),
        expense("c", 30, "2022-03-04"),
      ],
      2026
    );

    expect(result).toEqual([2026, 2024, 2022]);
  });

  test("filters and sorts a year without mutating the original collection", () => {
    const expenses = [
      expense("older", 10, "2025-01-01"),
      expense("other-year", 20, "2024-12-01"),
      expense("newer", 30, "2025-03-01"),
    ];
    const originalOrder = expenses.map((item) => item.id);

    const result = getExpensesForYear(expenses, 2025);

    expect(result.map((item) => item.id)).toEqual(["newer", "older"]);
    expect(expenses.map((item) => item.id)).toEqual(originalOrder);
  });

  test("derives summary values from the visible expense collection", () => {
    const result = summarizeExpenses([
      expense("coffee", 4.5, "2026-01-01"),
      expense("train", 10.5, "2026-01-02"),
      expense("groceries", 30, "2026-01-03"),
    ]);

    expect(result).toEqual({
      total: 45,
      count: 3,
      average: 15,
      largest: 30,
    });
  });

  test("returns a zero summary for an empty year", () => {
    expect(summarizeExpenses([])).toEqual({
      total: 0,
      count: 0,
      average: 0,
      largest: 0,
    });
  });

  test("buckets expenses into twelve monthly totals", () => {
    const result = getMonthlyExpenseTotals([
      expense("jan-1", 10, "2026-01-01"),
      expense("jan-2", 2.5, "2026-01-10"),
      expense("mar", 7, "2026-03-20"),
    ]);

    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ label: "Jan", value: 12.5 });
    expect(result[1]).toEqual({ label: "Feb", value: 0 });
    expect(result[2]).toEqual({ label: "Mar", value: 7 });
  });
});
