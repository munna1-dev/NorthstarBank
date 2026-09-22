import React from "react";
import { createRoot } from "react-dom/client";

function NorthstarReact() {
  return (
    <main>
      <h1>Northstar Bank</h1>
      <p>React layer ready.</p>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<NorthstarReact />);
