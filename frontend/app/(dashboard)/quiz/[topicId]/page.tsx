import QuizPage from "./Client";

// Shell is identical across users/params (data hydrates client-side), so cache
// the rendered output as static instead of server-rendering it per request.
export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <QuizPage />;
}
