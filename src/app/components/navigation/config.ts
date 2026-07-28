import { 
  LayoutDashboard, 
  GraduationCap, 
  Trophy, 
  Globe, 
  BarChart3, 
  Bookmark, 
  Settings,
  BookOpen,
  Calendar,
  Award,
  BadgeCheck,
} from "lucide-react";

/**
 * Views that require an authenticated user (personal / account features).
 * Every other view — rankings, analytics, universities, saved comparison,
 * events, methodology, etc. — is open for logged-out visitors to browse.
 */
export const PROTECTED_VIEWS = new Set<string>(["profile", "settings"]);

/** True when a view can only be accessed by an authenticated user. */
export const isProtectedView = (view: string): boolean => PROTECTED_VIEWS.has(view);

/**
 * Number of universities logged-out visitors can browse before hitting the
 * "sign in to see all" wall. Applied to the rankings table and directory grid.
 */
export const PREVIEW_LIMIT = 20;

/**
 * Upper bound for the "Calculated Rank" filter slider. The dataset holds ~972
 * institutions today; this leaves generous headroom so the rank filter never
 * silently hides universities beyond an arbitrary cap.
 */
export const RANK_FILTER_MAX = 2000;

export interface NavItem {
  id: string;
  label: string;
  view: string; // matches the view in AppContent (e.g., 'home', 'rankings', 'profile', etc.)
  icon: any; // Lucide icon component
  badge?: string; // Optional indicator badge (e.g. "New", "2")
}

export const SIDEBAR_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Global Overview",
    view: "home",
    icon: LayoutDashboard,
  },
  {
    id: "universities",
    label: "Institution Directory",
    view: "universities",
    icon: GraduationCap,
  },
  {
    id: "rankings",
    label: "Prestige Rankings",
    view: "rankings",
    icon: Trophy,
    badge: "Live",
  },
  {
    id: "analytics",
    label: "Analytics",
    view: "analytics",
    icon: BarChart3,
  },
  {
    id: "saved",
    label: "Comparison Matrix",
    view: "saved", // a view for saved universities or comparing ones
    icon: Bookmark,
  },
  {
    id: "methodology",
    label: "Methodology",
    view: "methodology",
    icon: BookOpen,
  },
  {
    id: "events",
    label: "Events & Awards",
    view: "events",
    icon: Calendar,
  },
  {
    id: "faculty-awards",
    label: "Faculty & Student Awards",
    view: "faculty-awards",
    icon: Award,
  },
  {
    id: "settings",
    label: "Settings",
    view: "settings",
    icon: Settings,
  },
];

export const TOP_NAV_LINKS = [
  { label: "Home", view: "home" },
  { label: "Institution Directory", view: "universities" },
  { label: "Rankings Engine", view: "rankings" },
  // { label: "Methodology", view: "methodology" },
  { label: "Comparison Matrix", view: "saved" },
  { label: "Events & Awards", view: "events" },
  { label: "Blog", view: "blog" },
  { label: "News", view: "news" },
];
