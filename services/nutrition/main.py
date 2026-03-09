"""
Nutrition Intelligence Service
FastAPI microservice for canine nutrition calculations.
Supports BARF (raw) and Kibble diet modes with puppy growth phase adjustments.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from enum import Enum
import math

app = FastAPI(
    title="Nutrition Intelligence Service",
    description="Calculates ideal meal portions for puppies based on weight, age, and activity level.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ──

class ActivityLevel(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"


class DietMode(str, Enum):
    kibble = "kibble"
    barf = "barf"


class NutritionRequest(BaseModel):
    weight_kg: float = Field(..., gt=0, le=100, description="Puppy weight in kg")
    age_months: int = Field(..., ge=1, le=200, description="Age in months")
    activity_level: ActivityLevel = ActivityLevel.moderate
    diet_mode: DietMode = DietMode.kibble


class NutritionResponse(BaseModel):
    calories: int
    protein_g: int
    fat_g: int
    carbs_g: int
    portion_g: int
    status: str
    growth_phase: str
    diet_mode: str


# ── Nutrition Logic ──

# Activity multipliers applied to Resting Energy Requirement (RER)
ACTIVITY_MULTIPLIERS = {
    ActivityLevel.low: 1.2,
    ActivityLevel.moderate: 1.6,
    ActivityLevel.high: 2.0,
}

# Growth phase multipliers (puppies need significantly more energy)
GROWTH_MULTIPLIERS = {
    "neonatal": 3.0,    # 0-2 months
    "puppy": 2.5,       # 2-6 months
    "adolescent": 2.0,  # 6-12 months
    "adult": 1.0,       # 12+ months
}

# Macronutrient ratios by diet mode (protein, fat, carbs as fractions)
MACRO_RATIOS = {
    DietMode.kibble: {"protein": 0.30, "fat": 0.18, "carbs": 0.52},
    DietMode.barf:   {"protein": 0.50, "fat": 0.30, "carbs": 0.20},
}

# Caloric density (kcal per gram of food)
CALORIC_DENSITY = {
    DietMode.kibble: 3.5,  # kcal/g typical dry kibble
    DietMode.barf: 1.8,    # kcal/g typical raw food
}


def determine_growth_phase(age_months: int) -> str:
    """Determine the growth phase based on age."""
    if age_months <= 2:
        return "neonatal"
    elif age_months <= 6:
        return "puppy"
    elif age_months <= 12:
        return "adolescent"
    else:
        return "adult"


def calculate_nutrition(req: NutritionRequest) -> NutritionResponse:
    """
    Calculate daily nutritional requirements using the MER formula.
    
    RER (Resting Energy Requirement) = 70 × (weight_kg ^ 0.75)
    MER (Maintenance Energy Requirement) = RER × activity_multiplier × growth_multiplier
    """
    # Step 1: Calculate RER
    rer = 70 * math.pow(req.weight_kg, 0.75)

    # Step 2: Determine growth phase
    growth_phase = determine_growth_phase(req.age_months)
    growth_mult = GROWTH_MULTIPLIERS[growth_phase]

    # Step 3: Apply multipliers
    activity_mult = ACTIVITY_MULTIPLIERS[req.activity_level]
    mer = rer * activity_mult * growth_mult

    # Step 4: Calculate macronutrients (4 kcal/g protein, 9 kcal/g fat, 4 kcal/g carbs)
    ratios = MACRO_RATIOS[req.diet_mode]
    protein_kcal = mer * ratios["protein"]
    fat_kcal = mer * ratios["fat"]
    carbs_kcal = mer * ratios["carbs"]

    protein_g = round(protein_kcal / 4)
    fat_g = round(fat_kcal / 9)
    carbs_g = round(carbs_kcal / 4)

    # Step 5: Calculate portion size
    density = CALORIC_DENSITY[req.diet_mode]
    portion_g = round(mer / density)

    return NutritionResponse(
        calories=round(mer),
        protein_g=protein_g,
        fat_g=fat_g,
        carbs_g=carbs_g,
        portion_g=portion_g,
        status="calculated",
        growth_phase=growth_phase,
        diet_mode=req.diet_mode.value,
    )


# ── Routes ──

@app.get("/")
async def root():
    return {"service": "nutrition-intelligence", "version": "1.0.0", "status": "healthy"}


@app.post("/api/nutrition/calculate", response_model=NutritionResponse)
async def calculate(req: NutritionRequest):
    """Calculate the ideal nutrition plan for a puppy."""
    return calculate_nutrition(req)


@app.get("/api/nutrition/health")
async def health():
    return {"status": "ok"}
