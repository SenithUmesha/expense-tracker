import ExpenseItem from "./ExpenseItem";

const Transactions = ({ items, onDeleteExpense }) => {
  return (
    <div className="transaction-list">
      {items.map((expense) => (
        <ExpenseItem
          key={expense.id}
          id={expense.id}
          title={expense.title}
          amount={expense.amount}
          date={expense.date}
          onDelete={onDeleteExpense}
        />
      ))}
    </div>
  );
};

export default Transactions;
