'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import type { VideoItem } from '@/lib/content/schema';
import { parseVideoUrl } from '@/lib/video';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  TextArea,
  TextInput,
  moveItem,
} from '@/components/admin/ui';

/**
 * Videos — YouTube or Vimeo links, embedded on the site.
 *
 * Links rather than uploads, and the hint below says why in the owner's terms:
 * the database plan allows 5 GB of downloads a month, every play of an
 * uploaded file re-downloads it, and a video host streams at whatever quality
 * the viewer's connection can carry. This editor validates the paste with the
 * SAME parser the page uses, so "the admin accepted it" and "the page embeds
 * it" cannot disagree.
 */

const orEmpty = (v: string | null) => v ?? '';
const orNull = (v: string) => (v.trim() === '' ? null : v);

const emptyVideo = (): VideoItem => ({ title: 'New video', caption: null, url: '' });

function UrlStatus({ url }: { url: string }) {
  if (url.trim() === '') {
    return (
      <p role="alert" className="mt-3 border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted">
        Paste a YouTube or Vimeo link. Until there is one, this video stays off
        the page.
      </p>
    );
  }

  const parsed = parseVideoUrl(url);
  if (!parsed) {
    return (
      <p role="alert" className="mt-3 border-l-2 border-accent pl-3 text-[0.875rem] leading-[1.45] text-muted">
        Not a recognisable YouTube or Vimeo link, so this video will not appear.
        Copy the address straight from the browser bar or the Share button —
        for example youtube.com/watch?v=… or vimeo.com/…
      </p>
    );
  }

  return (
    <p className="mt-3 text-[0.8125rem] leading-[1.45] text-subtle">
      ✓ {parsed.provider === 'youtube' ? 'YouTube' : 'Vimeo'} — will embed video{' '}
      <span className="font-mono">{parsed.id}</span>
    </p>
  );
}

export function VideosEditor({ content, onChange }: SectionEditorProps) {
  const videos = content.videos;

  const setVideos = (next: VideoItem[]) => onChange({ ...content, videos: next });

  const patch = (index: number, changes: Partial<VideoItem>) =>
    setVideos(videos.map((v, i) => (i === index ? { ...v, ...changes } : v)));

  return (
    <div>
      <Panel title="Videos">
        <p className="py-4 text-[0.8125rem] leading-[1.45] text-subtle">
          Upload the video to YouTube or Vimeo first — an unlisted YouTube video
          is not searchable and only reachable through this site — then paste
          its link here. The site embeds the player, so the video streams from
          their servers at whatever quality the viewer&apos;s connection can
          carry, and it costs this site&apos;s storage and bandwidth nothing.
          The section hides itself from the page and the menu while this list
          is empty.
        </p>

        {videos.length === 0 && (
          <p className="py-4 text-[0.9375rem] leading-[1.5] text-muted">
            No videos yet.
          </p>
        )}

        {videos.map((video, index) => (
          <ItemCard
            key={index}
            index={index}
            title={video.title.trim() || `Video ${index + 1}`}
            onRemove={() => setVideos(videos.filter((_, i) => i !== index))}
            onMoveUp={() => setVideos(moveItem(videos, index, -1))}
            onMoveDown={() => setVideos(moveItem(videos, index, 1))}
          >
            <Field label="Title" hint="Shown under the player.">
              {(id) => (
                <TextInput
                  id={id}
                  value={video.title}
                  onChange={(v) => patch(index, { title: v })}
                  placeholder="EMS walkthrough"
                />
              )}
            </Field>

            <Field
              label="Video link"
              hint="A YouTube or Vimeo address. Only the video itself is taken from it — the page never embeds an arbitrary link."
            >
              {(id) => (
                <>
                  <TextInput
                    id={id}
                    mono
                    value={video.url}
                    onChange={(v) => patch(index, { url: v })}
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                  <UrlStatus url={video.url} />
                </>
              )}
            </Field>

            <Field
              label="Caption"
              hint="One or two lines under the title. **bold** and ==highlight== work here. Leave blank for none."
            >
              {(id) => (
                <TextArea
                  id={id}
                  rows={2}
                  value={orEmpty(video.caption)}
                  onChange={(v) => patch(index, { caption: orNull(v) })}
                />
              )}
            </Field>
          </ItemCard>
        ))}

        <SecondaryButton onClick={() => setVideos([...videos, emptyVideo()])}>
          Add video
        </SecondaryButton>
      </Panel>
    </div>
  );
}
