import "@fontsource-variable/geist/wght.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

function routerBasename(): string | undefined {
  const baseUrl = import.meta.env.BASE_URL;
  if (!baseUrl || baseUrl === "/") return undefined;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
