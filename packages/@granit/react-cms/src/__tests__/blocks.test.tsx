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
    const { container } = render(<CtaBlock title="Sign up" />);
    expect(container.querySelector('[data-block="cta"]')).not.toBeNull();
  });

  it('renders optional description and button', () => {
    const { container } = render(
      <CtaBlock title="Sign up" description="Join us" buttonLabel="Go" buttonHref="/go" />
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

  it('renders optional subline, image and CTA', () => {
    const { container } = render(
      <HeroBlock
        headline="Welcome"
        subline="Subtitle"
        _resolved_imageId={{ url: 'https://img.example.com/hero.png', width: 1200, height: 600 }}
        ctaLabel="Get started"
        ctaHref="/start"
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('a')).not.toBeNull();
  });
});

describe('FeaturesBlock', () => {
  it('renders with empty features list', () => {
    const { container } = render(<FeaturesBlock features={[]} />);
    expect(container.querySelector('[data-block="features"]')).not.toBeNull();
  });

  it('renders features with optional body', () => {
    const { container } = render(
      <FeaturesBlock
        title="Features"
        features={[{ heading: 'Fast', body: 'Very fast' }, { heading: 'Secure' }]}
      />
    );
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });
});

describe('StatsBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<StatsBlock stats={[{ label: 'Users', value: '1000' }]} />);
    expect(container.querySelector('[data-block="stats"]')).not.toBeNull();
  });

  it('renders optional title', () => {
    const { container } = render(
      <StatsBlock title="Our Numbers" stats={[{ label: 'Users', value: '1000' }]} />
    );
    expect(container.querySelector('h2')).not.toBeNull();
  });
});

describe('TrustBannerBlock', () => {
  it('renders with empty logos list', () => {
    const { container } = render(<TrustBannerBlock logos={[]} />);
    expect(container.querySelector('[data-block="trust-banner"]')).not.toBeNull();
  });

  it('renders optional title and resolved logo images', () => {
    const { container } = render(
      <TrustBannerBlock
        title="Trusted by"
        logos={[
          {
            imageId: 'id-1',
            alt: 'ACME',
            _resolved_imageId: { url: 'https://cdn.example.com/acme.png' },
          },
          { imageId: null },
        ]}
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
  });
});

describe('TimelineBlock', () => {
  it('renders with empty items', () => {
    const { container } = render(<TimelineBlock items={[]} />);
    expect(container.querySelector('[data-block="timeline"]')).not.toBeNull();
  });

  it('renders items with optional date and body', () => {
    const { container } = render(
      <TimelineBlock
        title="History"
        items={[{ heading: 'Founded', date: '2020', body: 'We started' }, { heading: 'Launched' }]}
      />
    );
    expect(container.querySelector('time')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });
});

describe('TestimonialsBlock', () => {
  it('renders with empty testimonials', () => {
    const { container } = render(<TestimonialsBlock testimonials={[]} />);
    expect(container.querySelector('[data-block="testimonials"]')).not.toBeNull();
  });

  it('renders testimonials with optional author and role', () => {
    const { container } = render(
      <TestimonialsBlock
        title="What they say"
        testimonials={[{ quote: 'Great!', author: 'Jane', role: 'CEO' }, { quote: 'Awesome!' }]}
      />
    );
    expect(container.querySelector('h2')).not.toBeNull();
  });
});

describe('LogosBlock', () => {
  it('renders with empty logos', () => {
    const { container } = render(<LogosBlock logos={[]} />);
    expect(container.querySelector('[data-block="logos"]')).not.toBeNull();
  });

  it('renders optional title and resolved images', () => {
    const { container } = render(
      <LogosBlock
        title="Partners"
        logos={[
          {
            imageId: 'id-1',
            alt: 'Partner',
            _resolved_imageId: { url: 'https://cdn.example.com/p.png' },
          },
        ]}
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
  });
});

describe('StepsBlock', () => {
  it('renders with empty steps', () => {
    const { container } = render(<StepsBlock steps={[]} />);
    expect(container.querySelector('[data-block="steps"]')).not.toBeNull();
  });

  it('renders steps with optional body', () => {
    const { container } = render(
      <StepsBlock
        title="How it works"
        steps={[{ heading: 'Step 1', body: 'Do this' }, { heading: 'Step 2' }]}
      />
    );
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });
});

describe('ImageTextBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<ImageTextBlock title="About" />);
    expect(container.querySelector('[data-block="image-text"]')).not.toBeNull();
  });

  it('renders optional body and resolved image', () => {
    const { container } = render(
      <ImageTextBlock
        title="About"
        body="Our story"
        imageId="id-1"
        _resolved_imageId={{ url: 'https://cdn.example.com/about.png' }}
        imagePosition="right"
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
  });
});

describe('VideoBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<VideoBlock videoUrl="https://youtube.com/watch?v=123" />);
    expect(container.querySelector('[data-block="video"]')).not.toBeNull();
  });

  it('renders optional title and thumbnail as video poster', () => {
    const { container } = render(
      <VideoBlock
        title="Our Demo"
        videoUrl="https://youtube.com/watch?v=123"
        _resolved_thumbnailId={{ url: 'https://cdn.example.com/thumb.png' }}
      />
    );
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('video')).not.toBeNull();
  });
});

describe('MapBlock', () => {
  it('renders with required props only', () => {
    const { container } = render(<MapBlock />);
    expect(container.querySelector('[data-block="map"]')).not.toBeNull();
  });

  it('renders optional title, address and coordinates', () => {
    const { container } = render(
      <MapBlock title="Find us" address="1 Main St" lat={50.85} lng={4.35} />
    );
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelector('address')).not.toBeNull();
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
            description: 'Best plan',
            features: ['Feature A'],
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
