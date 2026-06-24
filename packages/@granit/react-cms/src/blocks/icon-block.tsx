'use client';

import { createIconSet } from '@granit/react-icons';
import {
  ArrowRight,
  Award,
  Briefcase,
  Check,
  Clock,
  Globe,
  Heart,
  Lock,
  Mail,
  Phone,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type { IconBlockProps, IconName, IconSize } from './types';

/** Curated name → lucide component map. Keep in sync with the C# `IconName` enum. */
const ICONS: Record<IconName, LucideIcon> = {
  Check,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Users,
  Settings,
  Mail,
  Phone,
  Globe,
  Lock,
  Heart,
  TrendingUp,
  Award,
  Clock,
  Briefcase,
};

const iconSet = createIconSet(ICONS, { fallback: 'Check' });

const SIZES: Record<IconSize, number> = { Sm: 16, Md: 24, Lg: 32 };

/** Renders one icon from the curated set. */
export function IconBlock({ name = 'Check', size = 'Md', color = 'Primary' }: IconBlockProps) {
  const Glyph = iconSet.resolve(name);
  return (
    <span data-block="icon" data-color={color}>
      <Glyph size={SIZES[size]} aria-hidden />
    </span>
  );
}
