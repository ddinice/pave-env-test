import {
  ActivityIcon,
  DesignVariablesIcon,
  ModelsIcon,
  PullIcon,
  PushIcon,
} from "../../icons/icons";
import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  {
    href: "/variables",
    label: "Design Variables",
    icon: DesignVariablesIcon,
  },
  {
    href: "/pull",
    label: "Pull Variables",
    icon: PullIcon,
  },
  {
    href: "/push",
    label: "Push Variables",
    icon: PushIcon,
  },
  {
    href: "/models",
    label: "Analysis Models",
    icon: ModelsIcon,
  },
  {
    href: "/activity",
    label: "Activity",
    icon: ActivityIcon,
  },
];
