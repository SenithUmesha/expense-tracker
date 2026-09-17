import { useRef, useState } from "react";

import {
  createExportPayload,
  parseImportPayload,
} from "../persistence/expenses";

const DataTools = ({ expenses, onImportExpenses }) => {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");

  const exportHandler = () => {
    const payload = createExportPayload(expenses);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `expense-tracker-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setMessage(`Exported ${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}.`);
  };

  const importHandler = async (event) => {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    try {
      const imported = parseImportPayload(await file.text());
      onImportExpenses(imported);
      setMessage(
        `Imported ${imported.length} ${imported.length === 1 ? "expense" : "expenses"}.`
      );
    } catch (error) {
      setMessage(error.message || "Could not import that file.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section className="data-tools" aria-labelledby="data-tools-title">
      <div>
        <p className="eyebrow">your data</p>
        <h2 id="data-tools-title">Keep a copy</h2>
        <p>
          Export a portable JSON backup or import one later. Nothing is uploaded anywhere.
        </p>
      </div>

      <div className="data-tools-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={exportHandler}
          disabled={expenses.length === 0}
        >
          Export JSON
        </button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={importHandler}
        />
      </div>

      <p className="data-tools-message" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
};

export default DataTools;
