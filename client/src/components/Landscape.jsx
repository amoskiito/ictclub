// Original animated sunset-hills scene used as the Login background
function Landscape() {
  return (
    <svg className="landscape" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
      aria-hidden="true">
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ea6d8" />
          <stop offset="0.45" stopColor="#f6c98f" />
          <stop offset="0.7" stopColor="#f3a766" />
          <stop offset="1" stopColor="#d9824f" />
        </linearGradient>
        <radialGradient id="ls-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="0.35" stopColor="#ffd27a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ls-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f7fa0" />
          <stop offset="1" stopColor="#8d88a0" />
        </linearGradient>
        <linearGradient id="ls-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e8f52" />
          <stop offset="1" stopColor="#4d7a3c" />
        </linearGradient>
        <linearGradient id="ls-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fa044" />
          <stop offset="1" stopColor="#2f6b2c" />
        </linearGradient>
        <linearGradient id="ls-lake" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8fb3d6" />
          <stop offset="1" stopColor="#f1c28a" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#ls-sky)" />

      <circle cx="1330" cy="330" r="230" fill="url(#ls-sun)" className="sun-glow" />
      <circle cx="1330" cy="330" r="34" fill="#fff4cf" />

      <g className="cloud c-a" fill="#fff" opacity="0.8">
        <ellipse cx="260" cy="150" rx="150" ry="30" />
        <ellipse cx="340" cy="125" rx="90" ry="28" />
        <ellipse cx="190" cy="132" rx="70" ry="22" />
      </g>
      <g className="cloud c-b" fill="#ffe7c4" opacity="0.85">
        <ellipse cx="1000" cy="230" rx="170" ry="26" />
        <ellipse cx="1090" cy="208" rx="100" ry="26" />
      </g>
      <g className="cloud c-c" fill="#fff" opacity="0.7">
        <ellipse cx="620" cy="90" rx="120" ry="20" />
        <ellipse cx="690" cy="74" rx="70" ry="18" />
      </g>

      <path d="M0 520 L140 440 L300 500 L470 420 L640 510 L760 470 L760 640 L0 640Z"
        fill="url(#ls-far)" opacity="0.85" />
      <path d="M900 540 L1080 470 L1250 530 L1420 480 L1600 540 L1600 650 L900 650Z"
        fill="url(#ls-far)" opacity="0.7" />

      <path d="M0 560 C260 500 420 560 700 540 C980 520 1200 560 1600 520 L1600 900 L0 900Z"
        fill="url(#ls-mid)" />
      <path d="M980 585 C1160 565 1340 585 1600 570 L1600 640 C1360 660 1160 640 980 650Z"
        fill="url(#ls-lake)" opacity="0.9" />

      <g fill="#355f2a">
        <circle cx="1120" cy="560" r="14" /><circle cx="1160" cy="556" r="16" />
        <circle cx="1210" cy="562" r="13" /><circle cx="300" cy="590" r="18" />
        <circle cx="350" cy="594" r="14" /><circle cx="420" cy="588" r="16" />
        <circle cx="520" cy="596" r="12" />
      </g>

      <path d="M0 700 C300 640 560 720 860 690 C1160 660 1380 700 1600 660 L1600 900 L0 900Z"
        fill="url(#ls-near)" />
      <path d="M0 800 C260 760 520 830 820 800 C1100 770 1360 820 1600 790 L1600 900 L0 900Z"
        fill="#2b6128" opacity="0.9" />

      <path d="M60 880 C80 800 150 760 260 770 C370 780 420 840 400 900Z" fill="#8c8a84" />
      <path d="M120 860 C150 810 220 790 290 800" stroke="#b8b5ad" strokeWidth="6"
        fill="none" opacity="0.7" />

      <g stroke="#e9f4d6" strokeWidth="3" strokeLinecap="round">
        <circle cx="520" cy="860" r="6" fill="#fff" stroke="none" />
        <circle cx="580" cy="880" r="5" fill="#fff" stroke="none" />
        <circle cx="990" cy="870" r="6" fill="#fff" stroke="none" />
        <circle cx="1450" cy="850" r="5" fill="#fff" stroke="none" />
      </g>
    </svg>
  );
}

export default Landscape;
