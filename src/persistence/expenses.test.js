import {
  createExportPayload,
  loadExpenses,
  mergeExpenses,
  normalizeExpenses,
  parseImportPayload,
  saveExpenses,
  STORAGE_KEY,
} from "./expenses";

describe("expense persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("normalizes valid records and drops malformed ones", () => {
    const result = normalizeExpenses([
      {
        id: "  groceries  ",
        title: "  Groceries  ",
        amount: "42.50",
        date: "2026-09-17T12:00:00.000Z",
      },
      { id: "bad", title: "Broken", amount: 0, date: "nope" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "groceries",
      title: "Groceries",
      amount: 42.5,
    });
    expect(result[0].date).toBeInstanceOf(Date);
  });

  test("round-trips expenses through localStorage", () => {
    const expenses = [
      {
        id: "1",
        title: "Coffee",
        amount: 4.25,
        date: new Date("2026-09-17T12:00:00.000Z"),
      },
    ];

    expect(saveExpenses(expenses)).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toContain("2026-09-17T12:00:00.000Z");

    const loaded = loadExpenses();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].date).toBeInstanceOf(Date);
    expect(loaded[0].amount).toBe(4.25);
  });

  test("merges imports by stable id and lets imported records win", () => {
    const current = [
      {
        id: "same",
        title: "Old title",
        amount: 10,
        date: new Date("2026-01-01T12:00:00.000Z"),
      },
    ];
    const imported = [
      {
        id: "same",
        title: "Updated title",
        amount: 12,
        date: new Date("2026-02-01T12:00:00.000Z"),
      },
      {
        id: "new",
        title: "Train",
        amount: 5,
        date: new Date("2026-03-01T12:00:00.000Z"),
      },
    ];

    const merged = mergeExpenses(current, imported);

    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe("new");
    expect(merged.find((expense) => expense.id === "same").title).toBe(
      "Updated title"
    );
  });

  test("creates and parses a versioned export payload", () => {
    const expenses = [
      {
        id: "1",
        title: "Lunch",
        amount: 8.5,
        date: new Date("2026-09-17T12:00:00.000Z"),
      },
    ];

    const payload = createExportPayload(expenses);
    const imported = parseImportPayload(JSON.stringify(payload));

    expect(payload.app).toBe("expense-tracker");
    expect(payload.version).toBe(1);
    expect(imported).toHaveLength(1);
    expect(imported[0].date).toBeInstanceOf(Date);
  });

  test("rejects backups for a different app", () => {
    expect(() =>
      parseImportPayload(
        JSON.stringify({ app: "something-else", version: 1, expenses: [] })
      )
    ).toThrow("different app");
  });

  test("rejects backups from a newer unsupported version", () => {
    expect(() =>
      parseImportPayload(
        JSON.stringify({ app: "expense-tracker", version: 99, expenses: [] })
      )
    ).toThrow("newer Expense Tracker version");
  });
});
