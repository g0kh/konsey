import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function LoginRedirectPage({ searchParams }: PageProps) {
  const next = searchParams.next;
  const query =
    typeof next === "string" && next
      ? `?next=${encodeURIComponent(next)}`
      : "";

  redirect(`/${query}`);
}
