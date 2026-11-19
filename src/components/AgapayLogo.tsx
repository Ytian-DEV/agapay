interface AgapayLogoProps {
  size?: 'sm' | 'auth' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 44, height: 39 },
  auth: { width: 112, height: 98 },
  md: { width: 140, height: 122 },
  lg: { width: 220, height: 192 },
};

/**
 * Official Agapay hands-cradling-mountains emblem composed from the Figma SVG layers.
 */
export function AgapayLogo({ size = 'md', className = '' }: AgapayLogoProps) {
  const dims = SIZE_MAP[size];

  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: dims.width, height: dims.height }}
      aria-label="Agapay logo"
      role="img"
    >
      {/* Mountain layers inside circular clip */}
      <div
        className="absolute inset-[10%_21.67%_14%_21.67%]"
        style={{
          WebkitMaskImage: 'url("/assets/logo/mountain-mask.svg")',
          maskImage: 'url("/assets/logo/mountain-mask.svg")',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      >
        <img
          src="/assets/logo/mountain-layers.svg"
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Outer circular ring */}
      <img
        src="/assets/logo/circle-ring.svg"
        alt=""
        className="absolute inset-[10%_25%_18%_25%] h-[72%] w-[50%] object-contain"
        draggable={false}
      />

      {/* Left cradling hand */}
      <img
        src="/assets/logo/hand-left.svg"
        alt=""
        className="absolute inset-[32%_53.3%_10%_16.7%] h-[58%] w-[30%] object-contain"
        draggable={false}
      />

      {/* Right cradling hand */}
      <img
        src="/assets/logo/hand-right.svg"
        alt=""
        className="absolute inset-[32%_16.7%_10%_53.3%] h-[58%] w-[30%] object-contain"
        draggable={false}
      />
    </div>
  );
}
