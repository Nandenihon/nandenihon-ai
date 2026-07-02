/**
 * ProgressRing — SVG circular progress indicator
 * Props:
 *   percent: 0–100
 *   size: SVG diameter in px (default 120)
 *   strokeWidth: ring thickness (default 10)
 *   color: ring stroke color
 */
interface ProgressRingProps {
    percent: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    sublabel?: string;
}

export default function ProgressRing({
    percent,
    size = 120,
    strokeWidth = 10,
    color = "var(--color-primary-base)",
    label,
    sublabel,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-neutral-10)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{
                        transition: "stroke-dashoffset 0.6s ease-in-out",
                    }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-neutral-90 leading-none">
                    {label ?? `${percent}%`}
                </span>
                {sublabel && (
                    <span className="text-xs text-neutral-50 mt-0.5">{sublabel}</span>
                )}
            </div>
        </div>
    );
}
