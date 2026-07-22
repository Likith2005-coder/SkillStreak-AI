import ToolPage from "./Client";

/**
 * The rendered shell for this route is identical across all users and all
 * `slug` values — the client component reads the slug via `useParams()` and
 * fetches the (server-cached) guide on the client. So we cache the shell as
 * static output instead of server-rendering it on every request; the
 * personalized/tool-specific content hydrates on the client.
 *
 * `dynamicParams` + an empty `generateStaticParams` means: nothing is prebuilt,
 * but the first hit to any slug renders the shell once and caches it (ISR).
 */
export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <ToolPage />;
}
