// Original club logo: a lab flask with bubbles and circuit nodes
function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="ICT Club logo">
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1fb6a6" />
          <stop offset="1" stopColor="#0e7c8a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#lg-bg)" />
      <path d="M40 22h20v6l-3 3v14l16 28c3 6-1 12-8 12H35c-7 0-11-6-8-12l16-28V31l-3-3z"
        fill="#fff" opacity="0.95" />
      <path d="M36 66h28l7 12c1 2 0 4-3 4H32c-3 0-4-2-3-4z" fill="#ffc21a" />
      <circle cx="46" cy="60" r="3" fill="#1fb6a6" />
      <circle cx="55" cy="55" r="2.2" fill="#1fb6a6" />
      <circle cx="52" cy="66" r="2" fill="#0e7c8a" />
      <circle cx="24" cy="30" r="3" fill="#ffc21a" />
      <circle cx="78" cy="38" r="3" fill="#ffc21a" />
      <path d="M24 30h10M78 38h-9" stroke="#ffc21a" strokeWidth="2" />
    </svg>
  );
}

export default Logo;
