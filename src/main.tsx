import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";

// BlockSuite initialization
import { effects as presetsEffects } from '@blocksuite/presets/effects';
import { effects as blocksEffects } from '@blocksuite/blocks/effects';

// Register all BlockSuite custom elements
presetsEffects();
blocksEffects();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
