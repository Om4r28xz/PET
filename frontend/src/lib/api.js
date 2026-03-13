/**
 * API configuration for different environments.
 * In development, Vite proxy handles routing.
 * In production, these point to the deployed service URLs.
 */

export const API = {
    nutrition: import.meta.env.VITE_NUTRITION_API_URL || '',
    medical: import.meta.env.VITE_MEDICAL_API_URL || '',
}
