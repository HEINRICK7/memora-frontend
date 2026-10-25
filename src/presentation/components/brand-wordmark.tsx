export function BrandWordmark() {
  return (
    <span className="brand-lockup">
      <svg className="brand-monogram" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="currentColor" />
        <path
          fill="#D9FD61"
          d="M14 48V16h8.2l9.8 16.2L41.8 16H50v32h-7.2V29.2L32 46.2 21.2 29.2V48H14z"
        />
      </svg>
      <span className="brand-wordmark">memora</span>
    </span>
  );
}
