import { Fab, Zoom } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";

const AddExpenseFAB = ({ isOpen, onClickFAB }) => {
  return (
    <Zoom in timeout={{ enter: 350, exit: 200 }}>
      <Fab
        className={`expense-fab ${isOpen ? "expense-fab-open" : ""}`}
        size="large"
        onClick={onClickFAB}
        aria-label={isOpen ? "Close expense form" : "Add expense"}
        aria-expanded={isOpen}
      >
        <AddIcon className="expense-fab-icon" fontSize="large" />
      </Fab>
    </Zoom>
  );
};

export default AddExpenseFAB;
