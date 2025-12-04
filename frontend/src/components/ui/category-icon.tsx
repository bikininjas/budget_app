'use client';

import {
  Home,
  Utensils,
  Car,
  Tv,
  Heart,
  Gamepad2,
  ShoppingBag,
  PiggyBank,
  MoreHorizontal,
  Plane,
  Gift,
  GraduationCap,
  Dumbbell,
  Coffee,
  Music,
  Phone,
  Wifi,
  Zap,
  Droplets,
  Fuel,
  Train,
  CreditCard,
  Wallet,
  Euro,
  Baby,
  Dog,
  Shirt,
  Sparkles,
  Wrench,
  Building,
  Stethoscope,
  Pill,
  BookOpen,
  Laptop,
  Smartphone,
  Camera,
  Headphones,
  LucideIcon,
  FolderOpen,
} from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  tv: Tv,
  heart: Heart,
  gamepad: Gamepad2,
  'gamepad-2': Gamepad2,
  'shopping-bag': ShoppingBag,
  'piggy-bank': PiggyBank,
  ellipsis: MoreHorizontal,
  plane: Plane,
  gift: Gift,
  'graduation-cap': GraduationCap,
  dumbbell: Dumbbell,
  coffee: Coffee,
  music: Music,
  phone: Phone,
  wifi: Wifi,
  zap: Zap,
  droplets: Droplets,
  fuel: Fuel,
  train: Train,
  'credit-card': CreditCard,
  wallet: Wallet,
  euro: Euro,
  baby: Baby,
  dog: Dog,
  shirt: Shirt,
  sparkles: Sparkles,
  wrench: Wrench,
  building: Building,
  stethoscope: Stethoscope,
  pill: Pill,
  'book-open': BookOpen,
  laptop: Laptop,
  smartphone: Smartphone,
  camera: Camera,
  headphones: Headphones,
};

interface CategoryIconProps {
  icon?: string | null;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function CategoryIcon({ icon, className = '', size = 20, style }: CategoryIconProps) {
  const IconComponent = icon ? iconMap[icon.toLowerCase()] : null;
  
  if (IconComponent) {
    return <IconComponent className={className} size={size} style={style} />;
  }
  
  // Fallback to folder icon
  return <FolderOpen className={className} size={size} style={style} />;
}

// Export the list of available icons for the form
export const availableIcons = Object.keys(iconMap);
