# Expense Tracker 💸

> a tiny browser-first money log. no account, no backend, no spreadsheet pretending to be an app.

This started as a 2022 React practice project and turned into the kind of small side quest I actually like keeping around: **add an expense, see where the money went, close the tab.**

The current version keeps everything in the browser, groups spending by year, turns each year into a monthly chart, shows a compact spending snapshot, and lets you export/import a portable JSON backup without sending anything to a server.

`React 18` · `localStorage` · `Material UI` · `Create React App`

## what it does

- add an expense with a title, amount and date
- persist entries in `localStorage`
- safely rehydrate dates and numbers after reload
- switch between years that actually exist in the dataset
- show total spend, transaction count, average spend and largest expense
- visualize monthly spending with a lightweight custom chart
- delete individual entries
- export all expenses as a versioned JSON backup
- import a backup and merge it by stable expense ID
- keep all data local to the current browser/device
- stay usable on desktop and mobile

No login. No database. No analytics. No remote sync.

## the flow

```text
new expense
    │
    ▼
validate form
    │
    ▼
React state
    │
    ├── yearly summary
    ├── monthly chart
    ├── transaction list
    └── backup/export tools
    │
    ▼
persistence boundary
    │
    ├── localStorage
    └── portable JSON file
```

The interesting part is not CRUD. It is the boundary between **runtime data** and **stored data**.

Inside the app, dates are real `Date` objects and amounts are numbers. In storage and backup files, dates are ISO strings. The persistence module restores those types, rejects malformed records, and keeps the UI from depending on the serialized shape.

## project shape

```text
src/
├── App.js
├── index.css
├── index.js
├── persistence/
│   └── expenses.js
└── components/
    ├── AddExpenseFAB.js
    ├── Chart.js
    ├── ChartBar.js
    ├── DataTools.js
    ├── ExpenseItem.js
    ├── ExpensesChart.js
    ├── Header.js
    ├── NewExpense.js
    ├── NoTransactions.js
    ├── TotalAmount.js
    └── Transactions.js
```

`App.js` owns the expense collection, selected year and form visibility. `src/persistence/expenses.js` owns validation, serialization, browser storage, import/export parsing and merge behavior. Everything else stays deliberately small and presentation-focused.

For a project this size, that is enough architecture. Redux, a backend and several layers of repositories would mostly be folders looking for a problem.

## state model

An expense is intentionally tiny:

```js
{
  id: "...",
  title: "Groceries",
  amount: 42.5,
  date: Date
}
```

The expense list is the durable source of truth. These are derived every render from the selected year's visible expenses:

```text
total
average
largest expense
monthly totals
transaction count
```

There is no duplicated `total` state to keep in sync after add/delete/import operations.

## persistence

The browser storage key is versioned:

```text
expense-tracker.expenses.v1
```

On load, the persistence boundary:

1. parses the stored JSON
2. requires an array
3. normalizes IDs/titles
4. converts `amount` to a number
5. converts `date` to a `Date`
6. rejects invalid dates, missing IDs/titles and non-positive amounts

On save, validated expenses are serialized with ISO dates and written to `localStorage`.

If browser storage is unavailable, the app still works in memory for that session.

## backups without an account

The backup format is intentionally small and explicit:

```json
{
  "app": "expense-tracker",
  "version": 1,
  "exportedAt": "2026-09-17T12:00:00.000Z",
  "expenses": []
}
```

Import accepts that format plus the old raw-array shape. It validates the file, rejects backups for a different app or a newer unsupported version, normalizes every expense, then merges records by ID.

```text
current expenses + imported expenses
              │
              ▼
          Map keyed by id
              │
              ▼
 newest/imported record wins for duplicate id
              │
              ▼
       sort by date descending
```

The file is read in the browser. Nothing is uploaded anywhere.

## chart without a chart library

The monthly chart is intentionally boring in a good way.

`ExpensesChart` reduces the selected year's entries into twelve month buckets, `Chart` finds the largest bucket, and each `ChartBar` renders its height as a percentage of that maximum.

```text
expenses
   │
   ▼
12 monthly totals
   │
   ▼
max(monthly total)
   │
   ▼
value / max × 100
   │
   ▼
CSS bar height
```

For twelve bars, a charting dependency would add more weight than value.

## UI pass

The original project had the usual early-React styling setup: lots of tiny CSS files, a global sizing rule, and UI state split between components.

The current pass moves the visual system into one predictable stylesheet, keeps the composer state in `App`, gives the empty state an actual action, wires deletion through the list, adds responsive layouts, focus states and reduced-motion handling, and gives import/export its own small local-data panel.

The design is intentionally dark, compact and app-like rather than looking like a tutorial dashboard.

## run it

```bash
git clone https://github.com/SenithUmesha/expense-tracker.git
cd expense-tracker
npm install
npm start
```

Production build:

```bash
npm run build
```

Tests:

```bash
npm test
```

## limits

This is still a small local app, not personal-finance software.

- currency is currently displayed as USD
- there is no edit flow
- there are no categories, budgets or recurring expenses
- clearing browser storage removes the live copy unless you exported a backup
- data does not sync automatically across browsers/devices
- there is no authentication or backend
- amounts use JavaScript numbers rather than integer minor units

Those are intentional boundaries, not unfinished enterprise features.

## if i rebuilt it today

I would keep the same local-first feel, probably move from Create React App to a smaller modern build tool, make currency/category preferences first-class, and model money in integer minor units if the app became anything more serious.

I would **not** start by adding accounts, cloud sync or a server. For this app, "opens instantly, remembers what I typed, and lets me take my data with me" is the product.

More detail: [`docs/engineering.md`](docs/engineering.md)
