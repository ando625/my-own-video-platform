const YOUTUBE_WATCH_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);
const YOUTUBE_SHORT_HOST = "youtu.be";
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export class InvalidYoutubeUrlError extends Error {
  constructor() {
    super("YouTubeの動画URLの形式が正しくありません。");
    this.name = "InvalidYoutubeUrlError";
  }
}

function parseUrl(value: string): URL {
  try {
    return new URL(value.trim());
  } catch {
    throw new InvalidYoutubeUrlError();
  }
}

/** youtube.com/watch?v=ID と youtu.be/ID から動画IDを取り出す。 */
export function parseYoutubeVideoId(value: string): string {
  const url = parseUrl(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new InvalidYoutubeUrlError();
  }

  let videoId: string | null = null;
  if (YOUTUBE_WATCH_HOSTS.has(url.hostname) && url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else if (url.hostname === YOUTUBE_SHORT_HOST) {
    videoId = url.pathname.slice(1);
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    throw new InvalidYoutubeUrlError();
  }
  return videoId;
}
