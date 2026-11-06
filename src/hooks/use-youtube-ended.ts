"use client";

import { type RefObject, useEffect, useRef } from "react";

const YOUTUBE_API_URL = "https://www.youtube.com/iframe_api";
const YOUTUBE_STATE_ENDED = 0;

type YouTubePlayer = { destroy: () => void };
type YouTubeApi = {
  Player: new (
    element: HTMLIFrameElement,
    options: { events: { onStateChange: (event: { data: number }) => void } },
  ) => YouTubePlayer;
};
type YouTubeWindow = Window & {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};

function loadYouTubeApi(onReady: () => void) {
  const youtubeWindow = window as unknown as YouTubeWindow;
  if (youtubeWindow.YT?.Player) {
    onReady();
    return;
  }

  const previousReady = youtubeWindow.onYouTubeIframeAPIReady;
  youtubeWindow.onYouTubeIframeAPIReady = () => {
    previousReady?.();
    onReady();
  };
  if (!document.querySelector(`script[src="${YOUTUBE_API_URL}"]`)) {
    const script = document.createElement("script");
    script.src = YOUTUBE_API_URL;
    document.head.appendChild(script);
  }
}

/** 埋め込んだYouTube動画が最後まで再生されたら、処理を呼ぶ。 */
export function useYoutubeEnded(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  onEnded: () => void,
) {
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  useEffect(() => {
    let player: YouTubePlayer | null = null;
    let cancelled = false;

    loadYouTubeApi(() => {
      const youtubeWindow = window as unknown as YouTubeWindow;
      if (cancelled || !iframeRef.current || !youtubeWindow.YT) {
        return;
      }
      player = new youtubeWindow.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event) => {
            if (event.data === YOUTUBE_STATE_ENDED) {
              onEndedRef.current();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [iframeRef]);
}
