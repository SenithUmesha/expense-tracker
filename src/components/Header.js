import TotalAmount from "./TotalAmount";

const Header = ({ total, count, year }) => {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">tiny money log</p>
        <h1>Expense Tracker</h1>
        <p className="hero-copy">
          A small React side project for logging everyday spending without an
          account, backend, or spreadsheet.
        </p>
      </div>

      <div className="hero-total-card" aria-label={`${year} spending total`}>
        <span>{year} total</span>
        <TotalAmount value={total} />
        <small>
          {count} {count === 1 ? "transaction" : "transactions"}
        </small>
      </div>
    </header>
  );
};

export default Header;
