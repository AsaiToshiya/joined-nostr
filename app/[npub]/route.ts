import { SimplePool, nip19, Event, Kind } from "nostr-tools";
import { NextRequest } from "next/server";

const relays = [
  "wss://nos.lol",
  "wss://nostr-pub.wellorder.net",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.mom",
  "wss://nostr.oxtr.dev",
  "wss://relay.damus.io",
  "wss://relay.nostr.bg",
];

const fetchOldestPost = async (
  relays: string[],
  author: string,
  until: number
) => {
  const pool = new SimplePool();
  const posts = (
    await pool.list(relays, [
      {
        authors: [author],
        kinds: [Kind.Text],
        until,
      },
    ])
  ).sort((a, b) => a.created_at - b.created_at);
  pool.close(relays);
  const olderPost = posts[0];
  const oldestPost: Event<Kind.Text> =
    olderPost &&
    (await fetchOldestPost(relays, author, olderPost.created_at - 1));
  return oldestPost || olderPost;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { npub: string } }
) {
  const npub = params.npub;
  const hex = nip19.decode(npub).data as string;
  const oldestPost = await fetchOldestPost(
    relays,
    hex,
    Math.floor(Date.now() / 1000)
  );
  const locale = request.nextUrl.searchParams.get("l");
  const offset = parseInt(request.nextUrl.searchParams.get("t")!);
  const offsetSeconds = (offset ? offset : 0) * 60 * 60;
  const responseBody = locale
    ? new Date((oldestPost.created_at + offsetSeconds) * 1000).toLocaleString(
        locale
      )
    : oldestPost.created_at.toString();
  return new Response(responseBody);
}
