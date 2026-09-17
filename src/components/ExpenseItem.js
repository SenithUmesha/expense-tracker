const formatDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

const ExpenseItem = ({ id, title, amount, date, onDelete }) => {
  return (
    <article className="expense-item">
      <div className="expense-item-copy">
        <h3>{title}</h3>
        <time dateTime={date.toISOString()}>{formatDate(date)}</time>
      </div>

      <div className="expense-item-actions">
        <strong>${amount.toFixed(2)}</strong>
        <button
          type="button"
          className="delete-expense"
          onClick={() => onDelete(id)}
          aria-label={`Delete ${title}`}
        >
          remove
        </button>
      </div>
    </article>
  );
};

export default ExpenseItem;
