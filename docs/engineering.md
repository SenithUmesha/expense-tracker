# Engineering notes — Expense Tracker

This is a deliberately small React app. The useful part is not the amount of code; it is the set of choices that keep a browser-only app predictable without turning it into a miniature enterprise architecture exercise.

The app has one durable source of truth — the expense collection — and derives everything else from it.

## 1. Runtime shape

```text
                           browser
                              │
                              ▼
                           App.js
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
      domain/expenses.js             persistence/expenses.js
              │                               │
     pure derived values               serialized boundary
              │                               │
   ┌──────────┼──────────┐             ┌──────┴──────┐
   ▼          ▼          ▼             ▼             ▼
summary   year filter   chart      localStorage   JSON backup
   │          │          │
   └──────────┴──────────┘
              │
              ▼
        presentation UI
```

There is no backend, account system, API client or global state library. That is intentional. A project this size benefits more from clear ownership than from additional layers.

## 2. State ownership

`App.js` owns only interactive/application state:

```text
expenses
selectedYear
isOpen
```

`currentYear` comes from the clock and is not stored in React state.

The expense array is the only durable application state. The following values are derived rather than stored:

```text
available years
visible expenses
total
average
largest expense
transaction count
monthly chart values
```

There is no separate total/average/chart state to synchronize after add, delete or import operations.

## 3. Expense model

At runtime:

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

The app prefers `crypto.randomUUID()` with a timestamp/random fallback for environments that do not provide it.

The ID gives the record stable identity for rendering, deletion and import merging. It is not a security boundary.

### money

Amounts are JavaScript numbers because this is a small side project. A serious financial product should normally use integer minor units instead:

```text
$42.50 -> 4250 cents
```

That avoids floating-point ambiguity in accounting operations.

## 4. Domain derivation boundary

`src/domain/expenses.js` owns calculations that are deterministic functions of the expense collection.

It exposes:

```text
getAvailableYears
getExpensesForYear
summarizeExpenses
getMonthlyExpenseTotals
```

This is deliberately not a repository/service/domain-object hierarchy. It is one small pure module because the useful boundary is simply:

```text
stateful orchestration != derived money math
```

`App.js` asks the domain module for visible records and summary data. `ExpensesChart` asks it for twelve monthly totals.

That gives the calculations a test seam without introducing Redux, context or another state container.

## 5. Derived summary semantics

For a selected year:

```text
expenses for year
      │
      ├── total   = sum(amount)
      ├── count   = number of records
      ├── average = total / count
      └── largest = max(amount)
```

An empty year produces zeros rather than `NaN`/`-Infinity` values.

`getExpensesForYear()` returns a new collection sorted newest-first. It does not sort the source array in place, so presentation ordering cannot mutate application state as a side effect.

## 6. The persistence boundary

`src/persistence/expenses.js` owns the serialized representation. `App.js` does not know the storage key or how dates are encoded.

Runtime:

```js
{
  amount: 42.5,
  date: new Date(...)
}
```

Stored/exported JSON:

```json
{
  "amount": 42.5,
  "date": "2026-09-17T12:00:00.000Z"
}
```

The persistence module provides:

```text
normalizeExpenses
loadExpenses
saveExpenses
mergeExpenses
createExportPayload
parseImportPayload
```

Browser storage and imported files are both external input from the application's point of view, so they pass through the same normalization rules.

## 7. Normalization

Every persisted/imported record is checked before the UI receives it.

The module:

1. requires an object
2. normalizes `id` and `title` to trimmed strings
3. converts `amount` with `Number(...)`
4. restores `date` as a `Date`
5. rejects missing IDs/titles
6. rejects non-finite or non-positive amounts
7. rejects invalid dates

This keeps malformed browser data from leaking directly into rendering and calculations.

## 8. Versioned browser storage

The storage key is:

```text
expense-tracker.expenses.v1
```

Versioning the key leaves a migration seam if the persisted model changes later:

```text
read v2
  │
  ├── found -> normalize -> use
  │
  └── missing -> read v1 -> migrate -> write v2
```

The current model does not need a migration yet, but the persistence layer already has somewhere to put one.

## 9. Storage failure behavior

Reads and writes are wrapped so storage failure does not make the UI unusable.

Possible failures include malformed JSON, quota errors, privacy restrictions and unusual embedded/private browsing environments.

Fallback behavior:

```text
storage unavailable
        │
        ▼
app still works in memory
        │
        ▼
data may not survive refresh
```

That trade-off is better than crashing a tiny tracker because persistence is unavailable.

## 10. Portable backups

Export creates a small envelope rather than dumping an undocumented array:

```json
{
  "app": "expense-tracker",
  "version": 1,
  "exportedAt": "2026-09-17T12:00:00.000Z",
  "expenses": []
}
```

The envelope provides format ownership, compatibility and provenance. The import parser also accepts the earlier raw-array shape for backwards compatibility.

The browser reads import files with `File.text()`. No upload occurs.

## 11. Import validation

`parseImportPayload()` rejects files when:

```text
JSON is invalid
root has no expense collection
app field belongs to a different app
backup version is newer than supported
all candidate records are invalid
```

Partially valid collections are normalized: valid records survive, malformed records are dropped.

## 12. Merge semantics

Import is a merge, not a blind replace.

```text
current expenses
      +
imported expenses
      │
      ▼
Map keyed by expense.id
      │
      ▼
imported record replaces duplicate id
      │
      ▼
sort by date descending
```

Using stable IDs means re-importing the same backup does not endlessly duplicate the same records.

The trade-off is that a duplicate ID in an imported file is treated as the same logical expense. There is no conflict UI because this app has no edit/sync model that would justify one.

## 13. Dates and local time

HTML date inputs represent calendar dates while JavaScript `Date` represents timestamps.

The form creates the selected date at local noon:

```js
new Date(`${enteredDate}T12:00:00`)
```

Using noon avoids the common UTC-midnight shift when the app later formats the date locally.

`todayForInput()` similarly compensates for the browser timezone before producing `YYYY-MM-DD`.

If this became a synced multi-timezone product, a date-only domain type would be cleaner than using `Date` as a stand-in.

## 14. Year filtering

The year selector is derived from:

```text
current year
+
all years found in expenses
```

A `Set` removes duplicates and the result is sorted descending.

Creating an expense switches the selected year to that expense's year. Import switches to the newest year present in the imported records so newly imported data is immediately discoverable.

## 15. Monthly chart

The chart intentionally avoids a charting dependency.

```text
selected year's expenses
        │
        ▼
getMonthlyExpenseTotals()
        │
        ▼
12 month buckets
        │
        ▼
find max month
        │
        ▼
bar height = value / max × 100
```

For twelve bars, that is enough.

The visual chart now also receives an explicit accessible description generated from the non-zero monthly values, for example:

```text
Monthly expense chart. Jan $42.50, Mar $18.00.
```

That does not make it a full accessible data-visualization system, but it means screen-reader users are not asked to infer spending from CSS bar height alone.

## 16. Form validation

The browser provides first-line validation through:

```text
required
min="0.01"
step="0.01"
max=<today>
maxLength="80"
```

The submit handler checks title, amount and date again before creating the record.

Because there is no server, validation here is about data quality and UX rather than authorization.

## 17. Component boundaries

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
├── DataTools
└── AddExpenseFAB

domain/
├── expenses.js
└── expenses.test.js

persistence/
├── expenses.js
└── expenses.test.js
```

`App` owns orchestration. Presentation components receive data and emit events. `domain` owns pure derived calculations. `DataTools` owns browser file interaction, while `persistence` owns the stored/backup representation and validation rules.

That separation is enough for the current scale.

## 18. Add/delete/import data flow

### add

```text
NewExpense
    │ validated fields
    ▼
App
    │ assign stable id
    ▼
expenses state
    │
    ├── domain derivation reruns
    └── saveExpenses()
```

### delete

```text
ExpenseItem
    │ id
    ▼
Transactions
    │
    ▼
App.filter(...)
    │
    ├── domain derivation reruns
    └── saveExpenses()
```

### import

```text
JSON file
   │
   ▼
DataTools
   │ parseImportPayload
   ▼
normalized imported expenses
   │
   ▼
App
   │ mergeExpenses
   ▼
expenses state
   │
   ├── domain derivation reruns
   └── saveExpenses()
```

All three mutation paths converge on the same expense collection.

## 19. Accessibility decisions

The UI includes several small defaults that matter:

- semantic sections/headings
- labelled form controls
- buttons for actions
- visible keyboard focus states
- `aria-live` status feedback for import/export
- a real empty-state action
- reduced-motion handling
- accessible hidden file input
- descriptive delete labels
- a chart-level textual description of non-zero monthly values

This is not a formal accessibility audit, but the interaction model is keyboard-friendly instead of mouse-only tutorial UI.

## 20. Tests

The tests focus on the two boundaries where regressions would be easy to miss.

### domain tests

`src/domain/expenses.test.js` covers:

```text
unique/sorted year derivation
year filtering
newest-first ordering
non-mutating sorting
summary math
empty summary behavior
12-month aggregation
```

### persistence tests

`src/persistence/expenses.test.js` covers:

```text
normalization
malformed-record rejection
localStorage round-trip
date restoration
stable-ID merge behavior
versioned export/import
foreign-app rejection
future-version rejection
```

This is intentionally not snapshot-heavy UI testing. The highest-value rules are pure enough to test directly.

## 21. CI

`.github/workflows/ci.yml` runs on pushes to `main` and pull requests using Node 20.

```text
npm ci
  │
  ▼
npm run test:ci
  │
  ▼
npm run build
```

A change therefore has to satisfy both the domain/persistence tests and a production Create React App build.

The workflow uses read-only repository permissions and the npm cache from `actions/setup-node`.

## 22. Repository cleanup

The original app accumulated per-component CSS files and an old empty-state SVG even after the visual system moved into `src/index.css`.

Those dead assets and the unused `TotalAmount` component have been removed. The repository now reflects the code that actually runs instead of carrying a second abandoned styling system beside it.

The remaining Material UI dependency is real: the floating add button still uses its `Fab`, `Zoom` and icon components.

## 23. Privacy and durability

The privacy model is mostly a consequence of not having a backend:

```text
no account
no analytics
no API
no remote database
no automatic sync
```

Expense data stays in browser storage. Export improves durability without changing that privacy model because the backup file is produced locally.

That gives the user an explicit ownership story:

```text
local live copy
     +
optional portable backup
```

The user, not a server account, controls transfer between browsers/devices.

## 24. Current limits

The app intentionally does not solve:

- automatic multi-device sync
- authentication
- budgets
- categories
- recurring expenses
- editing
- multi-currency accounting
- encrypted storage/backups
- attachments
- serious financial reporting

It also stores money as floating-point numbers and still uses Create React App / Material UI v4-era dependencies because the point of the project is the product/data-flow cleanup, not pretending a 2022 practice app started life on today's stack.

## 25. What I would change next

If the project grew another step, the useful order would be:

```text
1. explicit currency preference
2. edit flow
3. categories
4. migration-aware persistence v2
5. broader interaction tests only where behavior justifies them
6. only then consider whether sync/accounts are actually needed
```

I would still avoid Redux, dependency injection, a server or a database abstraction until the product actually creates the coordination problems those tools solve.

The engineering lesson here is proportionality: **the architecture should be slightly ahead of the complexity, not several projects ahead of it.**
