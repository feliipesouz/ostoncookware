/** A static Fibonacci construction, used as a quiet editorial signature. */
export function GeometryMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 233 144"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 22V1H22M211 1H232V22M232 122V143H211M22 143H1V122" />
      <path
        d="M0 144A144 144 0 0 1 144 0A89 89 0 0 1 233 89A55 55 0 0 1 178 144A34 34 0 0 1 144 110A21 21 0 0 1 165 89A13 13 0 0 1 178 102A8 8 0 0 1 170 110"
        opacity="0.7"
      />
    </svg>
  );
}
