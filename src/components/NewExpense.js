import { useState } from "react";

const todayForInput = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - offset).toISOString().split("T")[0];
};

const NewExpense = ({ onSubmitExpense, onCancel }) => {
  const [enteredTitle, setEnteredTitle] = useState("");
  const [enteredAmount, setEnteredAmount] = useState("");
  const [enteredDate, setEnteredDate] = useState(todayForInput);

  const submitHandler = (event) => {
    event.preventDefault();

    const title = enteredTitle.trim();
    const amount = Number(enteredAmount);

    if (!title || !Number.isFinite(amount) || amount <= 0 || !enteredDate) {
      return;
    }

    onSubmitExpense({
      title,
      amount,
      // Noon avoids the common UTC-midnight date shift when rendering locally.
      date: new Date(`${enteredDate}T12:00:00`),
    });

    setEnteredTitle("");
    setEnteredAmount("");
    setEnteredDate(todayForInput());
  };

  return (
    <form className="expense-form" onSubmit={submitHandler}>
      <label>
        <span>What was it?</span>
        <input
          onChange={(event) => setEnteredTitle(event.target.value)}
          type="text"
          placeholder="Coffee, groceries, train…"
          value={enteredTitle}
          maxLength="80"
          autoFocus
          required
        />
      </label>

      <label>
        <span>Amount</span>
        <div className="amount-input">
          <span aria-hidden="true">$</span>
          <input
            onChange={(event) => setEnteredAmount(event.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            value={enteredAmount}
            required
          />
        </div>
      </label>

      <label>
        <span>Date</span>
        <input
          onChange={(event) => setEnteredDate(event.target.value)}
          type="date"
          max={todayForInput()}
          value={enteredDate}
          required
        />
      </label>

      <div className="form-actions">
        <button className="button button-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button-primary" type="submit">
          Add expense
        </button>
      </div>
    </form>
  );
};

export default NewExpense;
