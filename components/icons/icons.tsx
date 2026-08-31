import type { IconProps } from "./types";

const defaults: IconProps = {
  "aria-hidden": true,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
};

export function PullIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 20l16 0" />
      <path d="M12 14l0 -10" />
      <path d="M12 14l4 -4" />
      <path d="M12 14l-4 -4" />
    </svg>
  );
}

export function PushIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 10l0 10" />
      <path d="M12 10l4 4" />
      <path d="M12 10l-4 4" />
      <path d="M4 4l16 0" />
    </svg>
  );
}

export function DesignVariablesIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </svg>
  );
}

export function ModelsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 3v18" />
      <path d="M4 7.5l8 4.5 8-4.5" />
    </svg>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...defaults} strokeWidth="2" {...props}>
      <rect height="11" rx="2" width="14" x="5" y="11" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 3h12l4 4v14H5z" />
      <path d="M8 3v6h8V3" />
      <path d="M8 21v-7h8v7" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect height="13" rx="2" width="13" x="9" y="9" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function ChevronsUpDownIcon(props: IconProps) {
  return (
    <svg {...defaults} strokeWidth="2" {...props}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
    </svg>
  );
}

export function DashIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function RevertIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
