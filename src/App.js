import { useEffect, useMemo, useState } from "react";

import AddExpenseFAB from "./components/AddExpenseFAB";
import DataTools from "./components/DataTools";
import ExpensesChart from "./components/ExpensesChart";
import Header from "./components/Header";
import NewExpense from "./components/NewExpense";
import NoTransactions from "./components/NoTransactions";
import Transactions from "./components/Transactions";
import {
  getAvailableYears,
  getExpensesForYear,
  summarizeExpenses,
} from "./domain/expenses";
import {
  loadExpenses,
  mergeExpenses,
  saveExpenses,
} from "./persistence/expenses";

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
    saveExpenses(expenses);
  }, [expenses]);

  const availableYears = useMemo(
    () => getAvailableYears(expenses, currentYear),
    [currentYear, expenses]
  );

  const visibleExpenses = useMemo(
    () => getExpensesForYear(expenses, selectedYear),
    [expenses, selectedYear]
  );

  const summary = useMemo(
    () => summarizeExpenses(visibleExpenses),
    [visibleExpenses]
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

  const importExpensesHandler = (importedExpenses) => {
    setExpenses((previousExpenses) =>
      mergeExpenses(previousExpenses, importedExpenses)
    );

    if (importedExpenses.length > 0) {
      const newestImportedYear = Math.max(
        ...importedExpenses.map((expense) => expense.date.getFullYear())
      );
      setSelectedYear(newestImportedYear);
    }
  };

  return (
    <main className="app-shell">
      <Header total={summary.total} count={summary.count} year={selectedYear} />

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
            <strong>${summary.total.toFixed(2)}</strong>
          </article>
          <article className="summary-card">
            <span>Transactions</span>
            <strong>{summary.count}</strong>
          </article>
          <article className="summary-card">
            <span>Average</span>
            <strong>${summary.average.toFixed(2)}</strong>
          </article>
          <article className="summary-card">
            <span>Largest</span>
            <strong>${summary.largest.toFixed(2)}</strong>
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
            {summary.count} {summary.count === 1 ? "entry" : "entries"}
          </span>
        </div>

        {summary.count > 0 ? (
          <Transactions
            items={visibleExpenses}
            onDeleteExpense={deleteExpenseHandler}
          />
        ) : (
          <NoTransactions onAddExpense={() => setIsOpen(true)} />
        )}
      </section>

      <DataTools expenses={expenses} onImportExpenses={importExpensesHandler} />

      <p className="privacy-note">
        local only · no account · no backend · backups never leave your device
      </p>

      <AddExpenseFAB
        isOpen={isOpen}
        onClickFAB={() => setIsOpen((open) => !open)}
      />
    </main>
  );
};

export default App;
