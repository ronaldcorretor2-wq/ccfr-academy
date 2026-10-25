'use client';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = { videoId: string; lessonId: string; start: number; save: (lessonId: string, seconds: number) => Promise<void> };

export default function YouTubePlayer({ videoId, lessonId, start, save }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    let player: any;
    let timer: any;
    let dead = false;
    const persist = () => {
      try {
        const t = Math.floor(player?.getCurrentTime?.() ?? 0);
        if (t > 0) void saveRef.current(lessonId, t);
      } catch {}
    };
    const create = () => {
      if (dead || !box.current) return;
      box.current.innerHTML = '';
      const el = document.createElement('div');
      box.current.appendChild(el);
      player = new window.YT.Player(el, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { start: Math.max(0, start - 3), rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e: any) => {
            clearInterval(timer);
            if (e.data === 1) timer = setInterval(persist, 10000);
            else if (e.data === 2 || e.data === 0) persist();
          },
        },
      });
    };
    if (window.YT && window.YT.Player) {
      create();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); create(); };
      if (!document.getElementById('yt-api')) {
        const s = document.createElement('script');
        s.id = 'yt-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }
    return () => {
      dead = true;
      clearInterval(timer);
      persist();
      try { player?.destroy?.(); } catch {}
    };
  }, [videoId, lessonId, start]);

  return <div ref={box} className="video" aria-label="Vídeo da aula" />;
}
