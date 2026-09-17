import { useEffect, useMemo, useState } from "react";

import Header from "./components/Header";
import NewExpense from "./components/NewExpense";
import NoTransactions from "./components/NoTransactions";
import Transactions from "./components/Transactions";
import AddExpenseFAB from "./components/AddExpenseFAB";
import ExpensesChart from "./components/ExpensesChart";

const STORAGE_KEY = "expense-tracker.expenses.v1";

const loadExpenses = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored
      .map((expense) => ({
        ...expense,
        amount: Number(expense.amount),
        date: new Date(expense.date),
      }))
      .filter(
        (expense) =>
          expense.id &&
          expense.title &&
          Number.isFinite(expense.amount) &&
          expense.amount > 0 &&
          !Number.isNaN(expense.date.getTime())
      );
  } catch {
    return [];
  }
};

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const App = () => {
  const currentYear = new Date().getFullYear();
  const [expenses, setExpenses] = useState(loadExpenses);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          expenses.map((expense) => ({
            ...expense,
            date: expense.date.toISOString(),
          }))
        )
      );
    } catch {
      // The UI still works for the current session if storage is unavailable.
    }
  }, [expenses]);

  const availableYears = useMemo(() => {
    const years = new Set([
      currentYear,
      ...expenses.map((expense) => expense.date.getFullYear()),
    ]);

    return [...years].sort((a, b) => b - a);
  }, [currentYear, expenses]);

  const visibleExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date.getFullYear() === selectedYear)
        .sort((a, b) => b.date - a.date),
    [expenses, selectedYear]
  );

  const total = visibleExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const average = visibleExpenses.length ? total / visibleExpenses.length : 0;
  const largest = visibleExpenses.reduce(
    (highest, expense) => Math.max(highest, expense.amount),
    0
  );

  const submitExpenseHandler = (submittedExpense) => {
    const expense = {
      ...submittedExpense,
      id: makeId(),
    };

    setExpenses((previousExpenses) => [expense, ...previousExpenses]);
    setSelectedYear(expense.date.getFullYear());
    setIsOpen(false);
  };

  const deleteExpenseHandler = (expenseId) => {
    setExpenses((previousExpenses) =>
      previousExpenses.filter((expense) => expense.id !== expenseId)
    );
  };

  return (
    <main className="app-shell">
      <Header total={total} count={visibleExpenses.length} year={selectedYear} />

      <section className="section-block" aria-labelledby="overview-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">spending snapshot</p>
            <h2 id="overview-title">Overview</h2>
          </div>

          <label className="year-filter">
            <span>Year</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {availableYears.map((year) => (
                <option value={year} key={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </article>
          <article className="summary-card">
            <span>Transactions</span>
            <strong>{visibleExpenses.length}</strong>
          </article>
          <article className="summary-card">
            <span>Average</span>
            <strong>${average.toFixed(2)}</strong>
          </article>
          <article className="summary-card">
            <span>Largest</span>
            <strong>${largest.toFixed(2)}</strong>
          </article>
        </div>

        <ExpensesChart expenses={visibleExpenses} />
      </section>

      {isOpen && (
        <section className="section-block composer" aria-labelledby="new-expense-title">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">quick capture</p>
              <h2 id="new-expense-title">New expense</h2>
            </div>
          </div>
          <NewExpense
            onSubmitExpense={submitExpenseHandler}
            onCancel={() => setIsOpen(false)}
          />
        </section>
      )}

      <section className="section-block" aria-labelledby="transactions-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">{selectedYear}</p>
            <h2 id="transactions-title">Transactions</h2>
          </div>
          <span className="transaction-count">
            {visibleExpenses.length} {visibleExpenses.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {visibleExpenses.length > 0 ? (
          <Transactions
            items={visibleExpenses}
            onDeleteExpense={deleteExpenseHandler}
          />
        ) : (
          <NoTransactions onAddExpense={() => setIsOpen(true)} />
        )}
      </section>

      <p className="privacy-note">
        local only · no account · no backend · your data stays in this browser
      </p>

      <AddExpenseFAB
        isOpen={isOpen}
        onClickFAB={() => setIsOpen((open) => !open)}
      />
    </main>
  );
};

export default App;
