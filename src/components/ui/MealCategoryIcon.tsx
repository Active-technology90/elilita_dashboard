import {
  Coffee,
  Sun,
  Moon,
  Egg,
  UtensilsCrossed,
  Wine,
  GlassWater,
  Pizza,
  Salad,
  Cake,
  Sandwich,
  Fish,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MealIconOption {
  token: string;
  label: string;
  emoji: string;
  icon: LucideIcon;
}

export const MEAL_ICON_OPTIONS: MealIconOption[] = [
  { token: "coffee", label: "Breakfast / Coffee", emoji: "☕", icon: Coffee },
  { token: "egg", label: "Brunch / Morning", emoji: "🍳", icon: Egg },
  { token: "sun", label: "Lunch / Midday", emoji: "☀️", icon: Sun },
  { token: "moon", label: "Dinner / Evening", emoji: "🌙", icon: Moon },
  { token: "utensils", label: "General Meal / Dining", emoji: "🍽️", icon: UtensilsCrossed },
  { token: "cocktail", label: "Drinks & Bar", emoji: "🍹", icon: Wine },
  { token: "cup", label: "Beverages / Juice", emoji: "🥤", icon: GlassWater },
  { token: "pizza", label: "Fast Food / Pizza", emoji: "🍕", icon: Pizza },
  { token: "salad", label: "Salads / Healthy", emoji: "🥗", icon: Salad },
  { token: "sandwich", label: "Snacks & Sandwiches", emoji: "🥪", icon: Sandwich },
  { token: "dessert", label: "Desserts / Bakery", emoji: "🍰", icon: Cake },
  { token: "fish", label: "Fasting / የፆም", emoji: "🐟", icon: Fish },
  { token: "flame", label: "Chef Special / Hot", emoji: "🔥", icon: Flame },
];

export function getMealCategoryIconComponent(rawIcon?: string): LucideIcon {
  if (!rawIcon) return UtensilsCrossed;
  const lower = rawIcon.toLowerCase().trim();

  if (lower === "coffee" || lower.includes("cafe") || lower.includes("breakfast") || rawIcon === "☕") {
    return Coffee;
  }
  if (lower === "egg" || lower.includes("brunch") || lower.includes("egg") || rawIcon === "🍳") {
    return Egg;
  }
  if (lower === "sun" || lower.includes("lunch") || lower.includes("sunny") || rawIcon === "☀️") {
    return Sun;
  }
  if (lower === "moon" || lower.includes("dinner") || lower.includes("night") || rawIcon === "🌙") {
    return Moon;
  }
  if (lower === "cocktail" || lower === "wine" || lower.includes("bar") || rawIcon === "🍹") {
    return Wine;
  }
  if (lower === "cup" || lower.includes("drink") || lower.includes("juice") || lower.includes("water") || rawIcon === "🥤") {
    return GlassWater;
  }
  if (lower === "pizza" || lower.includes("fast") || rawIcon === "🍕") {
    return Pizza;
  }
  if (lower === "salad" || lower.includes("leaf") || lower.includes("health") || rawIcon === "🥗") {
    return Salad;
  }
  if (lower === "sandwich" || lower.includes("snack") || rawIcon === "🥪") {
    return Sandwich;
  }
  if (lower === "dessert" || lower === "cake" || lower.includes("bakery") || lower.includes("ice-cream") || rawIcon === "🍰") {
    return Cake;
  }
  if (lower === "fish" || lower.includes("fasting") || rawIcon === "🐟") {
    return Fish;
  }
  if (lower === "flame" || lower.includes("fire") || lower.includes("special") || rawIcon === "🔥") {
    return Flame;
  }

  return UtensilsCrossed;
}

interface MealCategoryIconProps {
  icon?: string;
  className?: string;
}

export default function MealCategoryIcon({
  icon,
  className = "w-4 h-4",
}: MealCategoryIconProps) {
  const IconComponent = getMealCategoryIconComponent(icon);
  return <IconComponent className={className} />;
}
