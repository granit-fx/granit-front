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

import type { SlotComponent } from '@puckeditor/core';

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

/** Mirrors the C# `ColumnsLayout` enum projected as a `Choice` (value = member name). */
export type ColumnsLayout = 'HalfHalf' | 'OneThirdTwoThirds' | 'TwoThirdsOneThird';

/** Mirrors the C# `ColumnsGap` enum projected as a `Choice`. */
export type ColumnsGap = 'Small' | 'Medium' | 'Large';

/**
 * The `columns` layout block. `leftCol`/`rightCol` are `Slot` fields: at render time Puck passes
 * each as a `SlotComponent` the block renders as `<LeftCol />`. The render-prop type
 * (`SlotComponent`) differs from the stored data type (an array of child blocks); the block only
 * ever sees the former.
 */
export interface ColumnsBlockProps {
  readonly layout?: ColumnsLayout;
  readonly gap?: ColumnsGap;
  readonly leftCol: SlotComponent;
  readonly rightCol: SlotComponent;
}

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

// ─── Primitive layout/content catalog ────────────────────────────────────────
// Each enum string union mirrors the C# enum member names (the projected Choice `value`).

export type SectionBackground = 'Primary' | 'White' | 'Gray' | 'Dark';
export type SectionPadding = 'None' | 'Small' | 'Medium' | 'Large';

export interface SectionBlockProps {
  readonly backgroundColor?: SectionBackground;
  readonly paddingY?: SectionPadding;
  readonly content: SlotComponent;
}

export type ContainerMaxWidth = 'Sm' | 'Md' | 'Lg' | 'Xl' | 'Xl2' | 'Full';

export interface ContainerBlockProps {
  readonly maxWidth?: ContainerMaxWidth;
  readonly content: SlotComponent;
}

export type CardShadow = 'None' | 'Sm' | 'Md';

export interface CardBlockProps {
  readonly shadow?: CardShadow;
  readonly content: SlotComponent;
}

export type HeadingLevel = 'H1' | 'H2' | 'H3' | 'H4';
export type HeadingSize = 'Default' | 'Lg' | 'Xl' | 'Xl2';

export interface HeadingBlockProps {
  readonly text: string;
  readonly level?: HeadingLevel;
  readonly size?: HeadingSize;
  readonly align?: BlockAlignment;
}

export type TextSize = 'Sm' | 'Base' | 'Lg';
export type TextColor = 'Muted' | 'Default' | 'Primary';

export interface TextBlockProps {
  /** Rich-text HTML produced by the editor's WYSIWYG control. */
  readonly content: string;
  readonly size?: TextSize;
  readonly color?: TextColor;
}

export type ButtonVariant = 'Primary' | 'Secondary' | 'Outline' | 'Ghost';
export type ButtonSize = 'Sm' | 'Default' | 'Lg';
export type LinkTarget = 'Self' | 'Blank';

export interface ButtonBlockProps {
  readonly label: string;
  readonly href: string;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly target?: LinkTarget;
}

export interface ButtonGroupBlockProps {
  readonly alignment?: BlockAlignment;
  readonly buttons: SlotComponent;
}

export type ImageAspectRatio = 'Auto' | 'SixteenNine' | 'FourThree' | 'OneOne';
export type ImageObjectFit = 'Cover' | 'Contain';

export interface ImageBlockProps {
  readonly imageId?: string | null;
  readonly _resolved_imageId?: ResolvedAsset;
  readonly alt?: string;
  readonly aspectRatio?: ImageAspectRatio;
  readonly objectFit?: ImageObjectFit;
}

export type IconName =
  | 'Check'
  | 'ArrowRight'
  | 'Star'
  | 'Shield'
  | 'Zap'
  | 'Users'
  | 'Settings'
  | 'Mail'
  | 'Phone'
  | 'Globe'
  | 'Lock'
  | 'Heart'
  | 'TrendingUp'
  | 'Award'
  | 'Clock'
  | 'Briefcase';
export type IconSize = 'Sm' | 'Md' | 'Lg';
export type IconColor = 'Primary' | 'Muted' | 'Success' | 'Warning';

export interface IconBlockProps {
  readonly name?: IconName;
  readonly size?: IconSize;
  readonly color?: IconColor;
}

export type AlertIntent = 'Info' | 'Success' | 'Warning' | 'Error';

export interface AlertBlockProps {
  readonly intent?: AlertIntent;
  readonly title?: string;
  readonly content: SlotComponent;
}

export type SpacerSize = 'Px16' | 'Px32' | 'Px64' | 'Px128';

export interface SpacerBlockProps {
  readonly size?: SpacerSize;
}

export type DividerMargins = 'None' | 'Sm' | 'Md' | 'Lg';

export interface DividerBlockProps {
  readonly margins?: DividerMargins;
}
