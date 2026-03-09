import './NutritionRing.css'

/**
 * Apple Watch-style concentric ring chart.
 * Props:
 *   protein  - percentage (0-100)
 *   fat      - percentage (0-100)
 *   carbs    - percentage (0-100)
 *   values   - { protein_g, fat_g, carbs_g, calories }
 */
export default function NutritionRing({ protein = 0, fat = 0, carbs = 0, values = {} }) {
    const rings = [
        { label: 'Protein', pct: protein, color: '#4682B4', value: values.protein_g, unit: 'g' },
        { label: 'Fat', pct: fat, color: '#F39C12', value: values.fat_g, unit: 'g' },
        { label: 'Carbs', pct: carbs, color: '#2ECC71', value: values.carbs_g, unit: 'g' },
    ]

    const size = 200
    const strokeWidth = 14
    const gap = 6

    return (
        <div className="nutrition-ring">
            <svg
                className="nutrition-ring__svg"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
            >
                {rings.map((ring, i) => {
                    const radius = (size / 2) - strokeWidth - (strokeWidth + gap) * i
                    const circumference = 2 * Math.PI * radius
                    const offset = circumference - (ring.pct / 100) * circumference

                    return (
                        <g key={ring.label}>
                            {/* Background track */}
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke="var(--color-surface-alt)"
                                strokeWidth={strokeWidth}
                            />
                            {/* Filled arc */}
                            <circle
                                className="nutrition-ring__arc"
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={ring.color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                style={{ '--delay': `${i * 0.15}s` }}
                            />
                        </g>
                    )
                })}
                {/* Center text */}
                <text
                    x={size / 2}
                    y={size / 2 - 8}
                    textAnchor="middle"
                    className="nutrition-ring__calories-value"
                >
                    {values.calories || 0}
                </text>
                <text
                    x={size / 2}
                    y={size / 2 + 12}
                    textAnchor="middle"
                    className="nutrition-ring__calories-label"
                >
                    kcal / day
                </text>
            </svg>

            <div className="nutrition-ring__legend">
                {rings.map((ring) => (
                    <div key={ring.label} className="nutrition-ring__legend-item">
                        <span
                            className="nutrition-ring__legend-dot"
                            style={{ background: ring.color }}
                        />
                        <span className="nutrition-ring__legend-label">{ring.label}</span>
                        <span className="nutrition-ring__legend-value">
                            {ring.value ? `${ring.value}${ring.unit}` : '—'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
