import { CtaBlock } from './CtaBlock.js';
import { FeaturesBlock } from './FeaturesBlock.js';
import { HeroBlock } from './HeroBlock.js';
import { ImageTextBlock } from './ImageTextBlock.js';
import { LogosBlock } from './LogosBlock.js';
import { MapBlock } from './MapBlock.js';
import { PricingBlock } from './PricingBlock.js';
import { StatsBlock } from './StatsBlock.js';
import { StepsBlock } from './StepsBlock.js';
import { TestimonialsBlock } from './TestimonialsBlock.js';
import { TimelineBlock } from './TimelineBlock.js';
import { TrustBannerBlock } from './TrustBannerBlock.js';
import { VideoBlock } from './VideoBlock.js';

import type { ComponentType } from 'react';

/**
 * Maps the backend block catalog `name` to its React component.
 * Keep in sync with the blocks registered in `Granit.Cms.Blocks`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_COMPONENTS: Record<string, ComponentType<any>> = {
  Hero: HeroBlock,
  Pricing: PricingBlock,
  Cta: CtaBlock,
  Stats: StatsBlock,
  TrustBanner: TrustBannerBlock,
  Timeline: TimelineBlock,
  Features: FeaturesBlock,
  Testimonials: TestimonialsBlock,
  Logos: LogosBlock,
  Steps: StepsBlock,
  ImageText: ImageTextBlock,
  Video: VideoBlock,
  Map: MapBlock,
};
