import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CtaBlock } from '../blocks/cta-block';
import { FeaturesBlock } from '../blocks/features-block';
import { HeroBlock } from '../blocks/hero-block';
import { ImageTextBlock } from '../blocks/image-text-block';
import { LogosBlock } from '../blocks/logos-block';
import { MapBlock } from '../blocks/map-block';
import { PricingBlock } from '../blocks/pricing-block';
import { StatsBlock } from '../blocks/stats-block';
import { StepsBlock } from '../blocks/steps-block';
import { TestimonialsBlock } from '../blocks/testimonials-block';
import { TimelineBlock } from '../blocks/timeline-block';
import { TrustBannerBlock } from '../blocks/trust-banner-block';
import { VideoBlock } from '../blocks/video-block';

describe('CtaBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<CtaBlock headline="Sign up" />);
    expect(container.querySelector('[data-block="cta"]')).not.toBeNull();
  });

  it('renders optional body and button', () => {
    const { container } = render(
      <CtaBlock headline="Sign up" body="Join us" buttonLabel="Go" buttonHref="/go" />
    );
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('a')).not.toBeNull();
  });
});

describe('HeroBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<HeroBlock headline="Welcome" />);
    expect(container.querySelector('[data-block="hero"]')).not.toBeNull();
  });

  it('renders optional subheadline, image and CTA', () => {
    const { container } = render(
      <HeroBlock
        headline="Welcome"
        subheadline="Subtitle"
        _resolved_imageId={{ url: 'https://img.example.com/hero.png', width: 1200, height: 600 }}
        primaryCtaLabel="Get started"
        primaryCtaHref="/start"
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('a')).not.toBeNull();
  });
});

describe('FeaturesBlock', () => {
  it('renders with empty items list', () => {
    const { container } = render(<FeaturesBlock items={[]} />);
    expect(container.querySelector('[data-block="features"]')).not.toBeNull();
  });

  it('renders features with optional description', () => {
    const { container } = render(
      <FeaturesBlock
        title="Features"
        items={[{ title: 'Fast', description: 'Very fast' }, { title: 'Secure' }]}
      />
    );
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });
});

describe('StatsBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<StatsBlock items={[{ label: 'Users', value: '1000' }]} />);
    expect(container.querySelector('[data-block="stats"]')).not.toBeNull();
  });

  it('renders optional title', () => {
    const { container } = render(
      <StatsBlock title="Our Numbers" items={[{ label: 'Users', value: '1000' }]} />
    );
    expect(container.querySelector('h2')).not.toBeNull();
  });
});

describe('TrustBannerBlock', () => {
  it('renders with empty logos list', () => {
    const { container } = render(<TrustBannerBlock logoIds={[]} />);
    expect(container.querySelector('[data-block="trust-banner"]')).not.toBeNull();
  });

  it('renders optional heading and resolved logo images', () => {
    const { container } = render(
      <TrustBannerBlock
        heading="Trusted by"
        logoIds={[
          { value: 'id-1', _resolved_value: { url: 'https://cdn.example.com/acme.png' } },
          { value: null },
        ]}
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
  });
});

describe('TimelineBlock', () => {
  it('renders with empty events', () => {
    const { container } = render(<TimelineBlock events={[]} />);
    expect(container.querySelector('[data-block="timeline"]')).not.toBeNull();
  });

  it('renders events with optional date and description', () => {
    const { container } = render(
      <TimelineBlock
        title="History"
        events={[
          { title: 'Founded', date: '2020', description: 'We started' },
          { title: 'Launched', date: '2021' },
        ]}
      />
    );
    expect(container.querySelector('time')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });
});

describe('TestimonialsBlock', () => {
  it('renders with empty items', () => {
    const { container } = render(<TestimonialsBlock items={[]} />);
    expect(container.querySelector('[data-block="testimonials"]')).not.toBeNull();
  });

  it('renders testimonials with optional author and role', () => {
    const { container } = render(
      <TestimonialsBlock
        title="What they say"
        items={[
          { quote: 'Great!', author: 'Jane', role: 'CEO' },
          { quote: 'Awesome!', author: '' },
        ]}
      />
    );
    expect(container.querySelector('h2')).not.toBeNull();
  });
});

describe('LogosBlock', () => {
  it('renders with empty logos', () => {
    const { container } = render(<LogosBlock logoIds={[]} />);
    expect(container.querySelector('[data-block="logos"]')).not.toBeNull();
  });

  it('renders optional title and resolved images', () => {
    const { container } = render(
      <LogosBlock
        title="Partners"
        logoIds={[{ value: 'id-1', _resolved_value: { url: 'https://cdn.example.com/p.png' } }]}
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
  });
});

describe('StepsBlock', () => {
  it('renders with empty steps', () => {
    const { container } = render(<StepsBlock items={[]} />);
    expect(container.querySelector('[data-block="steps"]')).not.toBeNull();
  });

  it('renders steps with optional description', () => {
    const { container } = render(
      <StepsBlock
        title="How it works"
        items={[
          { number: '1', title: 'Step 1', description: 'Do this' },
          { number: '2', title: 'Step 2' },
        ]}
      />
    );
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });
});

describe('ImageTextBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<ImageTextBlock heading="About" />);
    expect(container.querySelector('[data-block="image-text"]')).not.toBeNull();
  });

  it('renders optional body and resolved image', () => {
    const { container } = render(
      <ImageTextBlock
        heading="About"
        body="Our story"
        imageId="id-1"
        _resolved_imageId={{ url: 'https://cdn.example.com/about.png' }}
        imagePosition="Right"
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('[data-image-position="right"]')).not.toBeNull();
  });
});

describe('VideoBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<VideoBlock url="https://cdn.example.com/v.mp4" />);
    expect(container.querySelector('[data-block="video"]')).not.toBeNull();
  });

  it('renders optional caption and video element', () => {
    const { container } = render(
      <VideoBlock caption="Our Demo" url="https://cdn.example.com/v.mp4" />
    );
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('video')).not.toBeNull();
  });
});

describe('block link/media XSS hardening (VULN-100/101/204)', () => {
  const UNSAFE_HREFS = [
    'javascript:alert(document.cookie)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '/\\evil.com',
  ];

  it.each(UNSAFE_HREFS)('HeroBlock drops unsafe CTA href %s', (href) => {
    const { container } = render(
      <HeroBlock headline="Welcome" primaryCtaLabel="Go" primaryCtaHref={href} />
    );
    expect(container.querySelector('a')).toBeNull();
  });

  it('HeroBlock keeps a safe CTA href', () => {
    const { container } = render(
      <HeroBlock headline="Welcome" primaryCtaLabel="Go" primaryCtaHref="https://example.com" />
    );
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
  });

  it.each(UNSAFE_HREFS)('CtaBlock drops unsafe button href %s', (href) => {
    const { container } = render(<CtaBlock headline="T" buttonLabel="Go" buttonHref={href} />);
    expect(container.querySelector('a')).toBeNull();
  });

  it.each(UNSAFE_HREFS)('PricingBlock drops unsafe plan CTA href %s', (href) => {
    const { container } = render(
      <PricingBlock
        title="Pricing"
        plans={[{ name: 'Pro', price: '€9', features: [], ctaLabel: 'Buy', ctaHref: href }]}
      />
    );
    expect(container.querySelector('a')).toBeNull();
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', '/\\evil.com'])(
    'VideoBlock drops unsafe video src %s',
    (src) => {
      const { container } = render(<VideoBlock url={src} />);
      expect(container.querySelector('video')).toBeNull();
    }
  );

  it('VideoBlock keeps a safe https video src', () => {
    const { container } = render(<VideoBlock url="https://cdn.example.com/v.mp4" />);
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      'https://cdn.example.com/v.mp4'
    );
  });
});

describe('MapBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<MapBlock />);
    expect(container.querySelector('[data-block="map"]')).not.toBeNull();
  });

  it('renders optional label and coordinates', () => {
    const { container } = render(<MapBlock label="Find us" latitude={50.85} longitude={4.35} />);
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('figure')).not.toBeNull();
  });
});

describe('PricingBlock', () => {
  it('renders with empty plans', () => {
    const { container } = render(<PricingBlock title="Pricing" plans={[]} />);
    expect(container.querySelector('[data-block="pricing"]')).not.toBeNull();
  });

  it('renders plans with optional fields', () => {
    const { container } = render(
      <PricingBlock
        title="Pricing"
        plans={[
          {
            name: 'Pro',
            price: '€99',
            period: 'per month',
            features: [{ value: 'Feature A' }],
            ctaLabel: 'Buy',
            ctaHref: '/buy',
            highlighted: true,
          },
          {
            name: 'Free',
            price: '€0',
            features: [],
          },
        ]}
      />
    );
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('a')).not.toBeNull();
  });
});
