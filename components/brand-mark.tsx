export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg className={`brand-mark ${className}`.trim()} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M9 8.5h8.1c3.6 0 5.9 1.8 5.9 4.8 0 3.1-2.3 4.9-5.9 4.9h-4.2v5.3H9V8.5Zm3.9 3v3.7h3.8c1.5 0 2.4-.6 2.4-1.9 0-1.2-.9-1.8-2.4-1.8h-3.8Z" fill="var(--paper)" />
      <path d="M18.7 21.7h4.1v1.8h-4.1z" fill="var(--accent)" />
    </svg>
  );
}
