import { CtaBlock } from './CtaBlock';
import { FeaturesBlock } from './FeaturesBlock';
import { HeroBlock } from './HeroBlock';
import { ImageTextBlock } from './ImageTextBlock';
import { LogosBlock } from './LogosBlock';
import { MapBlock } from './MapBlock';
import { PricingBlock } from './PricingBlock';
import { StatsBlock } from './StatsBlock';
import { StepsBlock } from './StepsBlock';
import { TestimonialsBlock } from './TestimonialsBlock';
import { TimelineBlock } from './TimelineBlock';
import { TrustBannerBlock } from './TrustBannerBlock';
import { VideoBlock } from './VideoBlock';

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
