import React, { useState, useEffect } from "react";

const onClearLogs = async (nombre, setLogs) => {
  try {
    const response = await fetch(`/api/clear-logs?nombre=${nombre}`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to clear logs");
    }

    console.log(`Logs cleared for name: ${nombre}`);
    setLogs(""); // Actualiza el estado de logs a vacío
  } catch (err) {
    console.error("Error clearing log file:", err);
  }
};

const ComponentLogs = ({ tienda, logs: initialLogs }) => {
  const [logs, setLogs] = useState(initialLogs);

  const nombre = tienda.nombre ;

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const formattedLogs = logs.replace(/(\])\s*(?=\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z])/g, "$1\n");

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <button
          className="bg-red-500 text-white rounded-lg shadow p-2 hover:bg-red-600"
          onClick={() => onClearLogs(nombre, setLogs)}
        >
          Clear Logs
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 overflow-auto max-h-96">
        <pre className="whitespace-pre-wrap text-sm text-gray-800">{formattedLogs}</pre>
      </div>
    </div>
  );
};

export default ComponentLogs;
