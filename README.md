# Expense Tracker 💸

> a tiny browser-first money log. no account, no backend, no spreadsheet pretending to be an app.

This started as a 2022 React practice project and eventually became the kind of small side quest I actually like keeping around: **add an expense, see where the money went, close the tab.**

The current version keeps everything in the browser, groups spending by year, turns each year into a monthly chart, and gives you a compact snapshot of the total, average and largest expense.

`React 18` · `localStorage` · `Material UI` · `Create React App`

## what it does

- add an expense with a title, amount and date
- persist entries in `localStorage`
- restore dates/numbers safely when the app reloads
- switch between years that actually exist in the dataset
- see total spend, transaction count, average spend and largest expense
- visualize monthly spending with a lightweight custom chart
- delete individual entries
- keep everything local to the current browser
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
    └── transaction list
    │
    ▼
serialize to localStorage
    │
    ▼
rehydrate on the next visit
```

The interesting bit is not CRUD. It is the boundary between **runtime data** and **stored data**.

Inside the app, dates are real `Date` objects and amounts are numbers. In storage, dates become ISO strings because `localStorage` only stores strings. On startup the app restores those types and ignores malformed records instead of trusting whatever happens to be in browser storage.

## project shape

```text
src/
├── App.js
├── index.css
├── index.js
└── components/
    ├── AddExpenseFAB.js
    ├── Chart.js
    ├── ChartBar.js
    ├── ExpenseItem.js
    ├── ExpensesChart.js
    ├── Header.js
    ├── NewExpense.js
    ├── NoTransactions.js
    ├── TotalAmount.js
    └── Transactions.js
```

`App.js` owns the expense collection, selected year and form visibility. The rest of the components are mostly rendering or small interaction boundaries.

That is deliberate. For a project this size, adding a state library or a pretend service layer would mostly create folders.

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

Derived values are calculated from the selected year's visible expenses rather than duplicated into state:

```text
total
average
largest expense
monthly totals
transaction count
```

That keeps one source of truth: the expense list.

## persistence

The storage key is versioned:

```text
expense-tracker.expenses.v1
```

When data is loaded, the app:

1. parses the JSON
2. checks that the root value is an array
3. converts `amount` back to a number
4. converts `date` back to a `Date`
5. drops records with missing IDs/titles, invalid dates or non-positive amounts

When data changes, it serializes dates back to ISO strings and writes the collection to `localStorage`.

If browser storage is unavailable, the UI still works for the current session; persistence simply cannot be guaranteed.

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

No charting dependency is needed for twelve bars.

## UI pass

The original project had the usual early-React styling setup: lots of small CSS files, a global `* { width: 100% }` rule, and UI state split between the app and the floating action button.

The current pass moves the visual system into a single predictable stylesheet, makes the add button controlled by the parent, gives the empty state an actual action, wires expense deletion through the list, and adds focus/reduced-motion handling.

The design is intentionally a little dark, compact and app-like rather than looking like a tutorial dashboard.

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

## limits

This is still a small local app, not personal-finance software.

- currency is currently displayed as USD
- there is no edit flow
- there are no categories or budgets
- there is no import/export
- clearing browser storage clears the data
- data does not sync across browsers/devices
- there is no authentication or backend

Those are features I would add only if the project stopped being a tiny side quest and became a real product.

## if i rebuilt it today

I would keep the same local-first feel, but probably use a smaller modern build tool, add an explicit persistence module, support import/export before adding any backend, and make currency/category preferences first-class.

I would **not** start by adding accounts, cloud sync or a server. For this app, "opens instantly and remembers what I typed" is the product.

More detail: [`docs/engineering.md`](docs/engineering.md)
