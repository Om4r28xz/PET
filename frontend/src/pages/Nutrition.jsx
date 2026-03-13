import { useState } from 'react'
import NutritionRing from '../components/NutritionRing'
import { useToast } from '../hooks/useToast'
import { publishEvent } from '../hooks/useEvents'
import './Nutrition.css'

const ACTIVITY_LEVELS = ['low', 'moderate', 'high']
const DIET_MODES = ['kibble', 'barf']

export default function Nutrition() {
    const { addToast } = useToast()
    const [weight, setWeight] = useState(10)
    const [age, setAge] = useState(6)
    const [activity, setActivity] = useState('moderate')
    const [dietMode, setDietMode] = useState('kibble')
    const [result, setResult] = useState(null)
    const [calculating, setCalculating] = useState(false)

    async function handleCalculate() {
        setCalculating(true)
        try {
            const res = await fetch('/api/nutrition/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weight_kg: weight,
                    age_months: age,
                    activity_level: activity,
                    diet_mode: dietMode,
                }),
            })
            const data = await res.json()
            setResult(data)
            addToast('Nutrition calculated successfully!', 'success')
            // Broadcast to Event Gateway
            publishEvent('nutrition_calculated', {
                title: 'Nutrition Calculated',
                message: `${data.calories} kcal recommended (${dietMode} mode)`,
                calories: data.calories,
                diet_mode: dietMode,
            })
        } catch {
            addToast('Failed to connect to Nutrition service', 'error')
        } finally {
            setCalculating(false)
        }
    }

    const totalMacros = result
        ? result.protein_g + result.fat_g + result.carbs_g
        : 0

    return (
        <div className="nutrition animate-fade-in">
            <header className="nutrition__header">
                <h1>Nutrition Intelligence</h1>
                <p>Calculate the ideal BARF or Kibble portions for your puppy</p>
            </header>

            <div className="nutrition__layout">
                {/* Input Panel */}
                <div className="card nutrition__inputs">
                    <h3 className="section-title">Puppy Profile</h3>

                    {/* Weight Slider */}
                    <div className="nutrition__field">
                        <label className="nutrition__label" htmlFor="weight-slider">
                            Weight
                            <span className="nutrition__value-tag">{weight} kg</span>
                        </label>
                        <input
                            id="weight-slider"
                            type="range"
                            className="nutrition__slider"
                            min="1"
                            max="60"
                            step="0.5"
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value))}
                        />
                        <div className="nutrition__slider-labels">
                            <span>1 kg</span>
                            <span>60 kg</span>
                        </div>
                    </div>

                    {/* Age Input */}
                    <div className="nutrition__field">
                        <label className="nutrition__label" htmlFor="age-input">
                            Age
                            <span className="nutrition__value-tag">{age} months</span>
                        </label>
                        <input
                            id="age-input"
                            type="range"
                            className="nutrition__slider"
                            min="1"
                            max="96"
                            step="1"
                            value={age}
                            onChange={(e) => setAge(parseInt(e.target.value))}
                        />
                        <div className="nutrition__slider-labels">
                            <span>1 month</span>
                            <span>8 years</span>
                        </div>
                    </div>

                    {/* Activity Level Toggle */}
                    <div className="nutrition__field">
                        <label className="nutrition__label">Activity Level</label>
                        <div className="nutrition__toggles">
                            {ACTIVITY_LEVELS.map((level) => (
                                <button
                                    key={level}
                                    className={`nutrition__toggle ${activity === level ? 'nutrition__toggle--active' : ''}`}
                                    onClick={() => setActivity(level)}
                                >
                                    {level === 'low' && '🐾'}
                                    {level === 'moderate' && '🏃'}
                                    {level === 'high' && '⚡'}
                                    <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Diet Mode Toggle */}
                    <div className="nutrition__field">
                        <label className="nutrition__label">Diet Mode</label>
                        <div className="nutrition__diet-modes">
                            {DIET_MODES.map((mode) => (
                                <button
                                    key={mode}
                                    className={`nutrition__diet-btn ${dietMode === mode ? 'nutrition__diet-btn--active' : ''}`}
                                    onClick={() => setDietMode(mode)}
                                >
                                    <span className="nutrition__diet-icon">
                                        {mode === 'kibble' ? '🥣' : '🥩'}
                                    </span>
                                    <span className="nutrition__diet-label">
                                        {mode.toUpperCase()}
                                    </span>
                                    <span className="nutrition__diet-desc">
                                        {mode === 'kibble' ? 'Dry food' : 'Raw diet'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calculate CTA */}
                    <button
                        className="btn btn--primary btn--lg nutrition__cta"
                        onClick={handleCalculate}
                        disabled={calculating}
                    >
                        {calculating ? (
                            <>
                                <span className="nutrition__spinner" />
                                Calculating…
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Calculate Meal
                            </>
                        )}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="card nutrition__results">
                    <h3 className="section-title">Nutrition Breakdown</h3>

                    {result ? (
                        <div className="nutrition__ring-container animate-fade-in-up">
                            {result.growth_phase && (
                                <div className="nutrition__growth-badge">
                                    <span className="badge badge--info">{result.growth_phase} phase</span>
                                </div>
                            )}
                            <NutritionRing
                                protein={totalMacros ? (result.protein_g / totalMacros) * 100 : 0}
                                fat={totalMacros ? (result.fat_g / totalMacros) * 100 : 0}
                                carbs={totalMacros ? (result.carbs_g / totalMacros) * 100 : 0}
                                values={{
                                    protein_g: result.protein_g,
                                    fat_g: result.fat_g,
                                    carbs_g: result.carbs_g,
                                    calories: result.calories,
                                }}
                            />
                            {result.portion_g && (
                                <div className="nutrition__portion">
                                    <span className="nutrition__portion-label">Daily Portion</span>
                                    <span className="nutrition__portion-value">{result.portion_g}g</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="nutrition__empty">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" />
                                <line x1="10" y1="1" x2="10" y2="4" />
                                <line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                            <p className="nutrition__empty-text">Configure your puppy's profile and hit <strong>Calculate Meal</strong></p>
                            <span className="nutrition__empty-hint">Results will appear as a Nutrition Ring</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
