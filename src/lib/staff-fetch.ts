/** Staff API fetch — redirects to login on 401. */
export async function staffFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401 && typeof window !== "undefined") {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }

  return res;
}
