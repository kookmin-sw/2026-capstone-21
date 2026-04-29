import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
