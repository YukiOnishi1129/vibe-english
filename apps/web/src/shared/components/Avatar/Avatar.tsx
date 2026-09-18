import { useEffect, useState } from "react";

// Presentational: a user's picture, or their initial when there isn't one.

export type AvatarProps = {
  src: string | null;
  name: string;
  className?: string;
};

export function Avatar({ src, name, className }: AvatarProps) {
  // Provider-hosted avatars (Google's CDN) intermittently fail to load, which
  // otherwise leaves a broken-image icon sitting in the sidebar. Falling back
  // to the initial keeps the row intact.
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const initial = name.trim().charAt(0) || "?";
  const classes = ["avatar", className].filter(Boolean).join(" ");

  if (!src || failed) {
    return (
      <span className={`${classes} avatar--fallback`} aria-hidden="true">
        {initial}
      </span>
    );
  }

  return (
    <img
      className={classes}
      src={src}
      alt=""
      // The name is already shown next to it, so the image is decorative.
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
