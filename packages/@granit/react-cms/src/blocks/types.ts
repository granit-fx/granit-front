/**
 * Shared prop shapes for Granit CMS block components.
 *
 * Each interface mirrors the backend block schema (`Granit.Cms.Blocks.Schemas`)
 * as projected into the catalog: C# property names arrive camelCased (matching
 * System.Text.Json web serialization), enums become string `Choice` values,
 * `Guid`/`Guid?` become `DocumentReference` fields, and a `List<T>` of scalars
 * is projected as a list of `{ value }` objects (not a bare array).
 *
 * The catalog drives what the editor shows AND the shape stored in the draft;
 * these types must therefore track the schemas, not an idealised shape.
 */

export interface ResolvedAsset {
  readonly url: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly mimeType?: string | null;
}

/**
 * A `DocumentReference` value inside a projected list of scalars
 * (`List<Guid>` → `[{ value }]`). After SSR document resolution each item
 * gains a `_resolved_value` sibling carrying the asset descriptor.
 */
export interface AssetRef {
  readonly value: string | null;
  readonly _resolved_value?: ResolvedAsset;
}

/** Mirrors the C# `BlockAlignment` enum projected as a `Choice`. */
export type BlockAlignment = 'Left' | 'Center' | 'Right';

/** Mirrors the C# `CtaStyle` enum projected as a `Choice`. */
export type CtaStyle = 'Primary' | 'Secondary' | 'Outline';

export interface HeroBlockProps {
  readonly headline: string;
  readonly subheadline?: string;
  readonly imageId?: string | null;
  readonly _resolved_imageId?: ResolvedAsset;
  readonly primaryCtaLabel?: string;
  readonly primaryCtaHref?: string;
  readonly secondaryCtaLabel?: string;
  readonly secondaryCtaHref?: string;
  readonly alignment?: BlockAlignment;
}

export interface CtaBlockProps {
  readonly headline: string;
  readonly body?: string;
  readonly buttonLabel?: string;
  readonly buttonHref?: string;
  readonly style?: CtaStyle;
}

export interface PricingPlan {
  readonly name: string;
  readonly price: string;
  readonly period?: string;
  readonly features: readonly { readonly value: string }[];
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
  readonly highlighted?: boolean;
}

export interface PricingBlockProps {
  readonly title?: string;
  readonly plans: readonly PricingPlan[];
}

export interface StatItem {
  readonly value: string;
  readonly label: string;
}

export interface StatsBlockProps {
  readonly title?: string;
  readonly items: readonly StatItem[];
}

export interface TrustBannerBlockProps {
  readonly heading?: string;
  readonly logoIds: readonly AssetRef[];
}

export interface TimelineEvent {
  readonly date: string;
  readonly title: string;
  readonly description?: string;
}

export interface TimelineBlockProps {
  readonly title?: string;
  readonly events: readonly TimelineEvent[];
}

export interface FeatureItem {
  readonly icon?: string;
  readonly title: string;
  readonly description?: string;
}

export interface FeaturesBlockProps {
  readonly title?: string;
  readonly items: readonly FeatureItem[];
}

export interface Testimonial {
  readonly quote: string;
  readonly author: string;
  readonly role?: string;
  readonly avatarId?: string | null;
  readonly _resolved_avatarId?: ResolvedAsset;
}

export interface TestimonialsBlockProps {
  readonly title?: string;
  readonly items: readonly Testimonial[];
}

export interface LogosBlockProps {
  readonly title?: string;
  readonly logoIds: readonly AssetRef[];
}

export interface StepItem {
  readonly number: string;
  readonly title: string;
  readonly description?: string;
}

export interface StepsBlockProps {
  readonly title?: string;
  readonly items: readonly StepItem[];
}

export interface ImageTextBlockProps {
  readonly imageId?: string | null;
  readonly _resolved_imageId?: ResolvedAsset;
  readonly heading: string;
  readonly body?: string;
  readonly imagePosition?: BlockAlignment;
}

export interface VideoBlockProps {
  readonly url: string;
  readonly caption?: string;
  readonly autoplay?: boolean;
  readonly loop?: boolean;
}

export interface MapBlockProps {
  readonly latitude?: number;
  readonly longitude?: number;
  readonly zoom?: number;
  readonly label?: string;
}
