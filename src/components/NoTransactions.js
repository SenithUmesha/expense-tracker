import NoData from "../assets/images/empty.svg";

const NoTransactions = ({ onAddExpense }) => {
  return (
    <div className="empty-state">
      <img src={NoData} alt="" aria-hidden="true" />
      <div>
        <h3>Nothing logged for this year.</h3>
        <p>Add the first expense and the monthly chart will wake up.</p>
      </div>
      <button className="button button-primary" type="button" onClick={onAddExpense}>
        Add an expense
      </button>
    </div>
  );
};

export default NoTransactions;
