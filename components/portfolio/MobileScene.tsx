/** Lightweight, server-rendered illustration for touch devices and GPU fallback. */
export function MobileScene() {
  return (
    <svg
      className="mobile-system"
      viewBox="0 0 440 340"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="mobile-plate"
          x1="80"
          y1="20"
          x2="320"
          y2="115"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#405a39" />
          <stop offset="1" stopColor="#112a22" />
        </linearGradient>
        <radialGradient id="mobile-glow">
          <stop stopColor="#c6ed91" stopOpacity=".25" />
          <stop offset="1" stopColor="#c6ed91" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="220" cy="230" rx="210" ry="110" fill="url(#mobile-glow)" />
      <g stroke="#b8d69a" strokeOpacity=".28">
        <ellipse cx="220" cy="244" rx="183" ry="64" />
        <ellipse cx="220" cy="244" rx="147" ry="49" strokeDasharray="3 9" />
        <path d="M32 244h35m306 0h35M220 172v15m0 114v15" />
      </g>
      <g
        className="mobile-core"
        transform="translate(220 226)"
        stroke="#d4ed9d"
        opacity=".5"
      >
        <circle r="37" />
        <ellipse rx="58" ry="20" transform="rotate(-28)" />
        <ellipse rx="58" ry="20" transform="rotate(28)" />
        <path d="m0-28 25 14v28L0 28l-25-14v-28Z" fill="#243d29" />
        <path d="m0-28 0 56m-25-42 50 28m0-28-50 28" />
        <circle r="7" fill="#d4ed9d" stroke="none" />
      </g>
      {[3, 2, 1, 0].map((layer) => (
        <g
          key={layer}
          data-mobile-layer={layer}
          transform={`translate(0 ${36 + layer * 40})`}
        >
          <path
            d="m64 62 154-50 158 50v9l-158 52L64 71Z"
            fill="#11221a"
            stroke="#9ab77f"
            strokeOpacity=".65"
          />
          <path
            d="m64 62 154-50 158 50-158 52Z"
            fill="url(#mobile-plate)"
            stroke="#c8dfab"
            strokeOpacity=".8"
          />
          <path
            d="m83 62 135-43 138 43-138 45Z"
            stroke="#a1c284"
            strokeOpacity=".3"
          />
          <g
            transform="matrix(.9 .29 -.9 .29 218 23)"
            stroke="#cce9ac"
            strokeWidth="2"
          >
            {layer === 0 ? (
              <>
                <rect
                  x="12"
                  y="12"
                  width="112"
                  height="85"
                  rx="4"
                  fill="#56713f"
                />
                <path d="M22 29h92M22 40h36v45H22Zm48 0h44v20H70Zm0 32h44m-44 12h34" />
              </>
            ) : layer === 1 ? (
              <>
                <circle cx="42" cy="35" r="12" />
                <circle cx="94" cy="35" r="12" />
                <path d="M19 83V68c0-19 46-19 46 0v15m7 0V68c0-19 46-19 46 0v15" />
              </>
            ) : layer === 2 ? (
              <>
                <rect x="47" y="36" width="42" height="33" rx="3" />
                <path d="M47 52H16V19m73 33h31v34M68 36V12m0 57v29" />
                <circle cx="16" cy="14" r="5" />
                <circle cx="120" cy="91" r="5" />
              </>
            ) : (
              <>
                <path d="m68 10 36 16v29c0 24-36 44-36 44S32 79 32 55V26Z" />
                <path d="m49 54 13 13 27-30" strokeWidth="5" />
              </>
            )}
          </g>
          <circle cx="64" cy="62" r="2.5" fill="#d3eea8" />
          <circle cx="376" cy="62" r="2.5" fill="#d3eea8" />
        </g>
      ))}
    </svg>
  );
}
