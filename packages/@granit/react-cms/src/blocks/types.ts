/**
 * Shared prop shapes for Granit CMS block components.
 * Each interface matches the field names the backend catalog defines for that block.
 * The catalog drives what the editor shows; these types drive what the component renders.
 */

export interface ResolvedAsset {
  readonly url: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly mimeType?: string | null;
}

export interface HeroBlockProps {
  readonly headline: string;
  readonly subline?: string;
  readonly imageId?: string | null;
  readonly _resolved_imageId?: ResolvedAsset;
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
}

export interface PricingBlockProps {
  readonly title: string;
  readonly plans: readonly {
    readonly name: string;
    readonly price: string;
    readonly description?: string;
    readonly features: readonly string[];
    readonly ctaLabel?: string;
    readonly ctaHref?: string;
    readonly highlighted?: boolean;
  }[];
}

export interface CtaBlockProps {
  readonly title: string;
  readonly description?: string;
  readonly buttonLabel?: string;
  readonly buttonHref?: string;
}

export interface StatsBlockProps {
  readonly title?: string;
  readonly stats: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}

export interface TrustBannerBlockProps {
  readonly title?: string;
  readonly logos: readonly {
    readonly imageId: string | null;
    readonly alt?: string;
    readonly _resolved_imageId?: ResolvedAsset;
  }[];
}

export interface TimelineBlockProps {
  readonly title?: string;
  readonly items: readonly {
    readonly heading: string;
    readonly body?: string;
    readonly date?: string;
  }[];
}

export interface FeaturesBlockProps {
  readonly title?: string;
  readonly features: readonly {
    readonly heading: string;
    readonly body?: string;
    readonly iconId?: string | null;
  }[];
}

export interface TestimonialsBlockProps {
  readonly title?: string;
  readonly testimonials: readonly {
    readonly quote: string;
    readonly author?: string;
    readonly role?: string;
    readonly avatarId?: string | null;
  }[];
}

export interface LogosBlockProps {
  readonly title?: string;
  readonly logos: readonly {
    readonly imageId: string | null;
    readonly alt?: string;
    readonly _resolved_imageId?: ResolvedAsset;
  }[];
}

export interface StepsBlockProps {
  readonly title?: string;
  readonly steps: readonly {
    readonly heading: string;
    readonly body?: string;
  }[];
}

export interface ImageTextBlockProps {
  readonly imageId?: string | null;
  readonly _resolved_imageId?: ResolvedAsset;
  readonly title: string;
  readonly body?: string;
  readonly imagePosition?: 'left' | 'right';
}

export interface VideoBlockProps {
  readonly title?: string;
  readonly videoUrl: string;
  readonly thumbnailId?: string | null;
  readonly _resolved_thumbnailId?: ResolvedAsset;
}

export interface MapBlockProps {
  readonly title?: string;
  readonly address?: string;
  readonly lat?: number;
  readonly lng?: number;
}
