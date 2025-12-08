import HomePage from "../page";

/**
 * Alias route so /dashboard renders the same dashboard as the root (/).
 * This keeps Next.js' generated types happy while you only maintain one UI.
 */
export default function DashboardAlias() {
  return <HomePage />;
}
