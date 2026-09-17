# Engineering notes — Expense Tracker

This is a deliberately small React app. The useful part is not the amount of code; it is the set of choices that keep a browser-only app predictable without turning it into a miniature enterprise architecture exercise.

The app has one source of truth — the expense collection — and derives everything else from it.

## 1. Runtime shape

```text
                       browser
                          │
                          ▼
                       App.js
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
        ▼                 ▼                  ▼
  expense form      yearly summary      transaction list
        │                 │                  │
        └─────────────────┼──────────────────┘
                          │
                          ▼
                    React state
                          │
              serialize / rehydrate
                          │
                          ▼
                     localStorage
```

There is no backend, account system, API client or global state library.

That is intentional. A project this size benefits more from clear ownership than from additional layers.

## 2. State ownership

`App.js` owns four pieces of UI/application state:

```text
expenses
selectedYear
isOpen
currentYear (derived from the clock, not React state)
```

The expense array is the only durable application state.

The following values are derived on render from the selected year's expenses:

```text
total
average
largest expense
transaction count
monthly chart values
```

Keeping those values derived avoids a common class of bugs where two state variables represent the same fact but drift out of sync.

For example, there is no separate `total` state that needs to be incremented after adding an expense and decremented after deleting one. The total is always a reduction over the visible expense list.

## 3. Expense model

At runtime an expense looks like:

```js
{
  id: "8d4f...",
  title: "Groceries",
  amount: 42.5,
  date: Date
}
```

The shape is intentionally compact.

### IDs

The app prefers `crypto.randomUUID()` when the browser provides it. A timestamp/random fallback exists for older environments.

The ID exists only to give each record stable identity for React rendering and deletion. It is not intended as a security boundary or globally coordinated database key.

### money

Amounts are stored as JavaScript numbers because this is a small personal UI experiment.

For a real financial product I would not use floating-point numbers as the canonical money representation. I would normally store integer minor units instead:

```text
$42.50 -> 4250 cents
```

That removes binary floating-point ambiguity from accounting operations.

## 4. Persistence boundary

`localStorage` only stores strings, so the browser-storage representation is not identical to the runtime model.

Runtime:

```js
{
  amount: 42.5,
  date: new Date(...)
}
```

Stored JSON:

```json
{
  "amount": 42.5,
  "date": "2026-09-17T12:00:00.000Z"
}
```

On startup, `loadExpenses()` performs a small rehydration/validation pass:

1. parse the JSON
2. require an array at the root
3. convert `amount` back to `Number`
4. convert `date` back to `Date`
5. reject entries without an ID or title
6. reject invalid/non-positive amounts
7. reject invalid dates

That matters because browser storage is not trustworthy just because this app wrote it once. Users, extensions, old versions of the app or devtools can all change it.

## 5. Versioned storage key

The collection is stored under:

```text
expense-tracker.expenses.v1
```

Versioning the key is cheap and useful.

If the persisted model changes later, the app has somewhere to put a migration boundary instead of silently assuming an old JSON shape still matches new code.

A future version could do something like:

```text
read v2
  │
  ├── found -> use it
  │
  └── missing -> read v1 -> migrate -> write v2
```

The project does not currently need that machinery, but the key leaves room for it.

## 6. Storage failure behavior

Both storage reads and writes are wrapped in `try/catch`.

That handles cases such as:

- storage disabled by browser/privacy settings
- quota errors
- malformed JSON
- unusual embedded/private browsing environments

The fallback behavior is deliberately graceful:

```text
storage unavailable
        │
        ▼
app still works in memory
        │
        ▼
data may not survive refresh
```

A tiny tracker should not crash because persistence is unavailable.

## 7. Dates and local time

HTML date inputs expose calendar dates, while JavaScript `Date` represents a timestamp.

Creating a `Date` directly from a `YYYY-MM-DD` string can introduce timezone surprises because date-only strings are interpreted in ways that can shift the displayed day depending on local offset.

The form creates the selected date at local noon:

```js
new Date(`${enteredDate}T12:00:00`)
```

Noon gives plenty of distance from a midnight timezone boundary and is sufficient here because the app cares about the calendar day, not a transaction timestamp.

`todayForInput()` similarly compensates for the browser timezone before generating the `YYYY-MM-DD` maximum/default value.

If this became a multi-timezone synced product, I would model a transaction's calendar date explicitly rather than using `Date` as a stand-in for a date-only type.

## 8. Year filtering

The year selector is derived from:

```text
current year
+
all years that exist in the expense collection
```

A `Set` removes duplicates and the list is sorted descending.

This avoids hard-coding year options and lets old data remain navigable as time passes.

When a new expense is created, the selected year moves to the year of that expense so the newly added item is immediately visible.

## 9. Monthly chart

The chart deliberately avoids a charting dependency.

The flow is:

```text
selected year's expenses
        │
        ▼
12 month buckets
        │
        ▼
sum each month's amounts
        │
        ▼
find largest monthly total
        │
        ▼
bar height = value / max × 100
```

For twelve vertical bars, a dedicated chart library would add substantially more code than capability.

The trade-off is that this component is intentionally simple. It does not provide axes, hover exploration, zooming, accessibility table fallbacks or large analytical datasets.

## 10. Form validation

The browser provides first-line validation through HTML attributes:

```text
required
min="0.01"
step="0.01"
max=<today>
maxLength="80"
```

The submit handler then performs its own checks before creating the record:

```text
title is not blank
amount is finite
amount > 0
date exists
```

Client-side validation here is a usability/data-quality boundary, not a security boundary. There is no server to protect.

## 11. Component boundaries

The components are split around small responsibilities rather than around an abstract architecture template.

```text
App
├── Header
├── ExpensesChart
│   └── Chart
│       └── ChartBar
├── NewExpense
├── Transactions
│   └── ExpenseItem
├── NoTransactions
└── AddExpenseFAB
```

`App` owns application state and orchestration.

The remaining components either:

- render data
- collect one interaction
- translate props into presentation

That is enough separation for a project of this scale.

## 12. Controlled add-expense flow

The add-expense floating action button does not own whether the form is open.

Instead:

```text
App owns isOpen
   │
   ├── AddExpenseFAB reads it + toggles it
   ├── NoTransactions can open it
   ├── NewExpense can close it
   └── successful submit closes it
```

This keeps one source of truth for the composer state and allows several parts of the interface to trigger the same flow without synchronizing local component state.

## 13. Deletion

Deletion follows the data downward / events upward pattern:

```text
App.deleteExpenseHandler
        │
        ▼
Transactions(onDeleteExpense)
        │
        ▼
ExpenseItem(onDelete)
```

The actual mutation happens in `App`:

```js
previousExpenses.filter((expense) => expense.id !== expenseId)
```

The `useEffect` persistence boundary then writes the new collection to local storage.

## 14. Accessibility decisions

The current UI includes several small accessibility improvements that are easy to miss in a visual review:

- semantic headings/sections
- labels attached around form controls
- visible keyboard focus treatment in CSS
- buttons for actions instead of clickable generic elements
- an actual action in the empty state
- reduced-motion handling
- useful `aria` labels/relationships around sections and the floating action

It is not a formally audited accessible product, but those defaults are much healthier than mouse-only tutorial UI.

## 15. Privacy model

The app's privacy model is mostly a consequence of not having a backend.

```text
no account
no analytics
no API
no remote database
no sync
```

Expense records stay in the browser's storage for that origin.

That also means the durability story is intentionally limited: clearing site data removes the records and another device cannot access them.

Privacy and durability are often a trade-off. For this side project, the local-only choice is a feature rather than an incomplete backend.

## 16. Limits of the current architecture

The app is intentionally not trying to solve:

- multi-device sync
- authentication
- budgets
- categories
- recurring transactions
- editing
- multi-currency accounting
- import/export
- encrypted local storage
- transaction attachments
- financial reporting

Adding all of those would change the product shape enough that the architecture should be reconsidered rather than appended indefinitely to `App.js`.

## 17. What I would extract next

If the app grew one step beyond its current size, the first extraction I would make is persistence:

```text
src/
├── app
├── components
└── persistence/
    └── expenses.js
```

That module would own:

```text
load
validate
serialize
save
migrate
```

The UI would then stop knowing the storage key or persisted JSON representation.

The next useful feature would be import/export, because it improves data ownership without requiring accounts or a backend.

## 18. What I would not add yet

I would not add Redux, a server, a database abstraction, repositories, dependency injection or a complex folder hierarchy to this version.

Those tools solve real problems, but this project does not currently have those problems.

The useful engineering lesson here is proportionality: **the architecture should be slightly ahead of the complexity, not several projects ahead of it.**
