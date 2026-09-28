import React from 'react';

interface LatteArtLogoProps {
  className?: string;
  alt?: string;
}

export const LatteArtLogo: React.FC<LatteArtLogoProps> = ({
  className = 'w-9 h-9',
  alt = 'KENNY Brew Latte Art Logo',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible ${className}`}
      role="img"
      aria-label={alt}
    >
      {/* Dark Espresso Saucer */}
      <ellipse
        cx="52"
        cy="68"
        rx="41.5"
        ry="21"
        fill="#39140C"
      />
      <ellipse
        cx="52"
        cy="66"
        rx="36"
        ry="16.5"
        fill="#2E0E07"
      />

      {/* Vibrant Red-Orange Handle */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 31 16 C 14 13, 6 27, 7 39 C 8 50, 16 57, 28 57 C 32 57, 34 54, 34 50 C 34 46, 31 46, 26 46 C 19 46, 17 41, 17 36 C 17 29, 21 24, 30 25 C 33 25, 35 21, 35 18 C 35 16, 33 16, 31 16 Z"
        fill="#ED5323"
      />

      {/* Coffee Cup Body */}
      <path
        d="M 22 30 C 22 55, 36 71, 54 71 C 72 71, 84 55, 84 30 Z"
        fill="#662417"
      />

      {/* Cup Outer Rim */}
      <ellipse
        cx="53"
        cy="30"
        rx="31"
        ry="17"
        fill="#662417"
      />

      {/* Golden Crema Surface */}
      <ellipse
        cx="53"
        cy="30"
        rx="27.5"
        ry="14.5"
        fill="#EC9725"
      />

      {/* Latte Art Cream Foam Design */}
      <g fill="#FDF1EC">
        {/* Swirled Outer Leaf / Tulip Petal on the left and bottom */}
        <path
          d="M 46 25 C 38 27, 33 34, 40 39 C 48 44, 61 41, 69 34 C 64 36, 54 39, 47 36 C 41 33, 40 28, 46 25 Z"
        />

        {/* Center Latte Art Heart */}
        <path
          d="M 54 36 C 53 34, 52 29, 57 24 C 62 20, 68 23, 67 29 C 67 33, 61 36, 54 36 Z"
        />
        <path
          d="M 54 36 C 56 34, 60 30, 66 31 C 70 32, 69 38, 64 39 C 59 40, 55 38, 54 36 Z"
        />
      </g>
    </svg>
  );
};
