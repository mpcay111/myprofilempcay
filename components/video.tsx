'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Section } from '@/components/section';
import { Reveal } from '@/components/reveal';
import { Copy } from '@/components/placeholder-text';
import { parseVideoUrl, type ParsedVideo } from '@/lib/video';
import type { VideoItem } from '@/lib/content/schema';

/**
 * The video section.
 *
 * Players load on click, not on page load. An eager YouTube iframe pulls in
 * roughly a megabyte of player script per video and phones home before the
 * visitor has expressed any interest; three videos would triple that. The
 * facade costs one thumbnail (YouTube) or nothing (Vimeo), and the click that
 * replaces it with the real player is also the click that starts playback, so
 * nothing feels slower.
 *
 * This is a client component for that one piece of state. It receives only the
 * video list — titles, captions, and public URLs — so nothing sensitive rides
 * along in the RSC payload.
 *
 * Every embed URL comes from lib/video.ts, which rebuilds it from the video id
 * against a fixed template. The pasted URL itself is never rendered. An entry
 * whose URL does not parse is skipped here and flagged in the admin instead of
 * rendering a broken frame.
 */

function VideoPlayer({ video, parsed }: { video: VideoItem; parsed: ParsedVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure>
      <div className="relative aspect-video overflow-hidden border border-border bg-surface">
        {playing ? (
          <iframe
            src={parsed.embedUrl}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${video.title}`}
            className="group absolute inset-0 flex h-full w-full items-center justify-center"
          >
            {parsed.thumbnailUrl && (
              /* A plain <img>, not next/image: routing YouTube's thumbnail
                 through the image optimiser would spend this site's quota to
                 re-serve a file YouTube's CDN already serves well. Lazy, since
                 the section is typically below the fold. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={parsed.thumbnailUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Scrim so the play control reads against any thumbnail. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-background/20 transition-colors group-hover:bg-background/10 group-focus-visible:bg-background/10"
            />

            <span
              aria-hidden="true"
              className="relative flex h-16 w-16 items-center justify-center border border-border-strong bg-background/90 transition-colors group-hover:border-accent group-hover:text-accent group-focus-visible:border-accent group-focus-visible:text-accent"
            >
              <Play className="ml-0.5 h-6 w-6" strokeWidth={1.5} />
            </span>
          </button>
        )}
      </div>

      <figcaption className="mt-4">
        <p className="text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.01em] text-foreground">
          {video.title}
        </p>
        {video.caption && (
          <p className="mt-1.5 max-w-prose text-[0.9375rem] leading-[1.55] text-muted">
            <Copy>{video.caption}</Copy>
          </p>
        )}
        <p className="label mt-3">
          <a
            href={parsed.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Watch on {parsed.provider === 'youtube' ? 'YouTube' : 'Vimeo'} ↗
          </a>
        </p>
      </figcaption>
    </figure>
  );
}

export function Video({ videos, index }: { videos: VideoItem[]; index: string }) {
  const playable = videos
    .map((video) => ({ video, parsed: parseVideoUrl(video.url) }))
    .filter((entry): entry is { video: VideoItem; parsed: ParsedVideo } => entry.parsed !== null);

  // page.tsx already drops the section when the list is empty; this covers the
  // remaining case where entries exist but none has a usable URL.
  if (playable.length === 0) return null;

  return (
    <Section
      id="video"
      index={index}
      title="Video"
      standfirst="Walkthroughs and demonstrations, hosted off-site so they stream properly on any connection."
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-x-8 md:gap-y-14">
        {playable.map(({ video, parsed }, i) => (
          <Reveal key={`${parsed.provider}-${parsed.id}`} delay={Math.min(i * 0.08, 0.24)}>
            <VideoPlayer video={video} parsed={parsed} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
