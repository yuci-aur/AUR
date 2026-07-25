import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  theme?: "light" | "dark";
  width?: number;
  height?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", theme = "dark", width = 120, height = 90 }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image 
        src="/logo.png" 
        alt="Asia University Rankings Logo" 
        width={width} 
        height={height} 
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  );
};
