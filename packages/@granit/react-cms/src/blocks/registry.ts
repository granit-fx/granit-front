import { AlertBlock } from './alert-block';
import { ButtonBlock } from './button-block';
import { ButtonGroupBlock } from './button-group-block';
import { CardBlock } from './card-block';
import { ColumnsBlock } from './columns-block';
import { ContainerBlock } from './container-block';
import { CtaBlock } from './cta-block';
import { DividerBlock } from './divider-block';
import { FeaturesBlock } from './features-block';
import { HeadingBlock } from './heading-block';
import { HeroBlock } from './hero-block';
import { IconBlock } from './icon-block';
import { ImageBlock } from './image-block';
import { ImageTextBlock } from './image-text-block';
import { LogosBlock } from './logos-block';
import { MapBlock } from './map-block';
import { PricingBlock } from './pricing-block';
import { SectionBlock } from './section-block';
import { SpacerBlock } from './spacer-block';
import { StatsBlock } from './stats-block';
import { StepsBlock } from './steps-block';
import { TestimonialsBlock } from './testimonials-block';
import { TextBlock } from './text-block';
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
  // Layout
  section: SectionBlock,
  container: ContainerBlock,
  columns: ColumnsBlock,
  card: CardBlock,
  // Content
  heading: HeadingBlock,
  text: TextBlock,
  // Interaction
  button: ButtonBlock,
  'button-group': ButtonGroupBlock,
  // Media
  image: ImageBlock,
  icon: IconBlock,
  // General
  alert: AlertBlock,
  spacer: SpacerBlock,
  divider: DividerBlock,
  // Existing macro blocks
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
