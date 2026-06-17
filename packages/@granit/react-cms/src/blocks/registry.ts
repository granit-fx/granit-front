import { ColumnsBlock } from './columns-block';
import { CtaBlock } from './cta-block';
import { FeaturesBlock } from './features-block';
import { HeroBlock } from './hero-block';
import { ImageTextBlock } from './image-text-block';
import { LogosBlock } from './logos-block';
import { MapBlock } from './map-block';
import { PricingBlock } from './pricing-block';
import { StatsBlock } from './stats-block';
import { StepsBlock } from './steps-block';
import { TestimonialsBlock } from './testimonials-block';
import { TimelineBlock } from './timeline-block';
import { TrustBannerBlock } from './trust-banner-block';
import { VideoBlock } from './video-block';

import type { ComponentType } from 'react';

/**
 * Maps the backend block catalog `name` to its React component.
 * Keep in sync with the blocks registered in `Granit.Cms.Blocks`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_COMPONENTS: Record<string, ComponentType<any>> = {
  columns: ColumnsBlock,
  hero: HeroBlock,
  pricing: PricingBlock,
  cta: CtaBlock,
  stats: StatsBlock,
  'trust-banner': TrustBannerBlock,
  timeline: TimelineBlock,
  features: FeaturesBlock,
  testimonials: TestimonialsBlock,
  logos: LogosBlock,
  steps: StepsBlock,
  'image-text': ImageTextBlock,
  video: VideoBlock,
  map: MapBlock,
};
