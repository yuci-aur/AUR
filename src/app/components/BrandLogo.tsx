import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  theme?: "light" | "dark";
  /** "default" for light backgrounds; "dark-bg" swaps in the white-wordmark variant. */
  variant?: "default" | "dark-bg";
  /** Intrinsic render width in px (height keeps the logo's aspect ratio). */
  width?: number;
  /** Rendered height in px, applied inline so no stylesheet can shrink it. */
  displayHeight?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  variant = "default",
  width = 120,
  displayHeight,
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={variant === "dark-bg" ? "/logo-dark.png" : "/logo.png"}
        alt="Asia University Rankings Logo"
        width={width}
        height={Math.round(width * (variant === "dark-bg" ? 0.3 : 0.75))}
        style={{
          objectFit: "contain",
          ...(displayHeight ? { height: displayHeight, width: "auto", maxWidth: "none" } : {}),
        }}
        priority
      />
    </div>
  );
};
