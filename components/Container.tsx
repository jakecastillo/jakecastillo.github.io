import { createElement, type ElementType, type ReactNode } from "react";

// Shared page container so outer gutters stay consistent across every act.
export default function Container({
  as = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return createElement(as, { className: `container-page ${className}` }, children);
}
