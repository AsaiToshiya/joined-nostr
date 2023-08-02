import { SimplePool, nip19 } from "nostr-tools";

const relays = [
  "wss://nos.lol",
  "wss://nostr-pub.wellorder.net",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.mom",
  "wss://nostr.oxtr.dev",
  "wss://relay.damus.io",
  "wss://relay.nostr.bg",
];

const fetchOldestPost = async (relays, author, until) => {
  const pool = new SimplePool();
  const posts = (
    await pool.list(relays, [
      {
        authors: [author],
        kinds: [1],
        until,
      },
    ])
  ).sort((a, b) => a.created_at - b.created_at);
  pool.close(relays);
  const olderPost = posts[0];
  const oldestPost =
    olderPost &&
    (await fetchOldestPost(relays, author, olderPost.created_at - 1));
  return oldestPost || olderPost;
};

export async function GET(request, { params }) {
  const npub = params.npub;
  const hex = nip19.decode(npub).data;
  const oldestPost = await fetchOldestPost(
    relays,
    hex,
    Math.floor(Date.now() / 1000)
  );
  const locale = request.nextUrl.searchParams.get("l");
  return new Response(locale
      ? new Date(oldestPost.created_at * 1000).toLocaleString(locale)
      : oldestPost.created_at);
}
