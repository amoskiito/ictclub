const base = {
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round"
};

export const UserIcon = () => (
  <svg {...base}><circle cx="12" cy="8" r="4" fill="currentColor" stroke="none" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="currentColor" stroke="none" /></svg>
);
export const MailIcon = () => (
  <svg {...base}><rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3.5 7l8.5 6 8.5-6" /></svg>
);
export const LockIcon = () => (
  <svg {...base}><rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor" stroke="none" />
    <path d="M8 10V7a4 4 0 018 0v3" /></svg>
);
export const EyeIcon = () => (
  <svg {...base}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = () => (
  <svg {...base}><path d="M2 12s3.5-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.5 7-10 7c-2 0-3.7-.7-5.1-1.6" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2M3 3l18 18" /></svg>
);
export const ShieldIcon = () => (
  <svg {...base}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
);
