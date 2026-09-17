export const STORAGE_KEY = "expense-tracker.expenses.v1";
export const EXPORT_VERSION = 1;

const normalizeExpense = (expense) => {
  if (!expense || typeof expense !== "object") {
    return null;
  }

  const id = String(expense.id || "").trim();
  const title = String(expense.title || "").trim();
  const amount = Number(expense.amount);
  const date = expense.date instanceof Date ? expense.date : new Date(expense.date);

  if (
    !id ||
    !title ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return { id, title, amount, date };
};

export const normalizeExpenses = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeExpense).filter(Boolean);
};

export const loadExpenses = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return normalizeExpenses(stored);
  } catch {
    return [];
  }
};

export const saveExpenses = (expenses) => {
  try {
    const serialized = normalizeExpenses(expenses).map((expense) => ({
      ...expense,
      date: expense.date.toISOString(),
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    return true;
  } catch {
    return false;
  }
};

export const createExportPayload = (expenses) => ({
  app: "expense-tracker",
  version: EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  expenses: normalizeExpenses(expenses).map((expense) => ({
    ...expense,
    date: expense.date.toISOString(),
  })),
});

export const parseImportPayload = (rawText) => {
  const parsed = JSON.parse(rawText);
  const candidate = Array.isArray(parsed) ? parsed : parsed?.expenses;
  const expenses = normalizeExpenses(candidate);

  if (!Array.isArray(candidate)) {
    throw new Error("The selected file does not contain an expense collection.");
  }

  if (candidate.length > 0 && expenses.length === 0) {
    throw new Error("No valid expenses were found in the selected file.");
  }

  return expenses;
};
