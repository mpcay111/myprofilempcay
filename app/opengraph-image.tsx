import { ImageResponse } from 'next/og';
import { getContent } from '@/lib/content/source';
import { yearsOfExperience } from '@/lib/career';
import { orFallback } from '@/lib/placeholder';

/**
 * The link preview card.
 *
 * A portfolio gets shared into LinkedIn messages and email far more often than
 * it gets found by search, so this image is doing more work than the meta
 * description is. It deliberately mirrors the page: warm paper ground, cool
 * ink, one teal rule, figures in the same spec-block arrangement.
 *
 * Colours are hard-coded hex here rather than pulled from CSS custom
 * properties — this renders in Satori, outside the browser, where the
 * stylesheet does not exist. They are the sRGB equivalents of the light-mode
 * tokens in globals.css; if you change those, change these.
 */

/**
 * Edge runtime is required here, not preferred.
 *
 * On the Node runtime this route would be prerendered once at build, which is
 * what an image with static inputs deserves. But @vercel/og's Node build
 * resolves its own assets through fileURLToPath, and that throws "Invalid URL"
 * when the project path contains a space — which this one does
 * ("My Projects"). The build fails outright on Windows.
 *
 * Edge sidesteps the asset resolution entirely. The cost is that the card is
 * rendered on request rather than at build; it is cached downstream by every
 * platform that unfurls links, so this is close to free in practice.
 *
 * If this project ever moves to a path without spaces, drop this line and the
 * card goes back to being generated once.
 */
export const runtime = 'edge';

// Static, because Next reads this at module scope and the content it would
// otherwise describe is only known per-request. The image itself carries the
// real name and role.
export const alt = 'Portfolio — e-commerce operations and the systems behind it';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PAPER = '#FAF8F5';
const INK = '#181F24';
const MUTED = '#565F66';
const SUBTLE = '#636C73';
const TEAL = '#0D6D63';
const HAIRLINE = '#E4DFD8';

export default async function OpengraphImage() {
  const { identity, projects, experience, careerStartYear, careerStartMonth } =
    await getContent();

  // Must use the same month-aware derivation the hero does, or the card
  // advertises a different number of years than the page it links to.
  const years = yearsOfExperience(careerStartYear, careerStartMonth);

  const stats = [
    { value: `${years}+`, label: 'Years in e-commerce' },
    { value: String(projects.length), label: 'Systems built' },
    { value: String(experience.length), label: 'Companies' },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: PAPER,
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Register line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 3, background: TEAL }} />
          <div
            style={{
              fontSize: 20,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SUBTLE,
            }}
          >
            {orFallback(identity.location, 'Portfolio')}
          </div>
        </div>

        {/* Name + role */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontSize: 84,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: INK,
              }}
            >
              {orFallback(identity.name, 'Portfolio')}
            </div>
            {identity.credentials && (
              <div
                style={{
                  fontSize: 26,
                  letterSpacing: '0.1em',
                  color: TEAL,
                }}
              >
                {identity.credentials}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 34,
              color: MUTED,
              letterSpacing: '-0.01em',
            }}
          >
            {orFallback(identity.role, 'Operations')}
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 22,
              color: SUBTLE,
              letterSpacing: '0.02em',
            }}
          >
            {identity.disciplines.join('   ·   ')}
          </div>
        </div>

        {/* Spec block */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', height: 1, background: HAIRLINE }} />
          <div style={{ display: 'flex', marginTop: 28, gap: 72 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 44, fontWeight: 600, color: INK, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 17,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: SUBTLE,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
