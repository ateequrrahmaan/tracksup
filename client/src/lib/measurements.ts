export type MeasurementType = "count" | "weight" | "volume";

export interface UnitDefinition {
  name: string;
  abbreviation: string;
  type: MeasurementType;
  multiplier: number; // Conversion factor to smallest unit (Gram, ML, or Piece/Unit)
}

export const UNIT_DEFINITIONS: UnitDefinition[] = [
  // Weight Based (Smallest unit: Gram)
  { name: "Gram", abbreviation: "g", type: "weight", multiplier: 1 },
  { name: "Kilogram", abbreviation: "KG", type: "weight", multiplier: 1000 },
  { name: "Ton", abbreviation: "T", type: "weight", multiplier: 1000000 },
  { name: "Pound", abbreviation: "lb", type: "weight", multiplier: 453.592 },
  { name: "Ounce", abbreviation: "oz", type: "weight", multiplier: 28.35 },

  // Volume Based (Smallest unit: Milliliter)
  { name: "ML", abbreviation: "ml", type: "volume", multiplier: 1 },
  { name: "Liter", abbreviation: "L", type: "volume", multiplier: 1000 },
  { name: "Gallon", abbreviation: "gal", type: "volume", multiplier: 3785.41 },

  // Count Based (Smallest unit: Piece/Unit)
  { name: "Piece", abbreviation: "Piece", type: "count", multiplier: 1 },
  { name: "Pack", abbreviation: "Pack", type: "count", multiplier: 1 },
  { name: "Box", abbreviation: "Box", type: "count", multiplier: 1 },
  { name: "Bag", abbreviation: "Bag", type: "count", multiplier: 1 },
  { name: "Crate", abbreviation: "Crate", type: "count", multiplier: 1 },
  { name: "Carton", abbreviation: "Carton", type: "count", multiplier: 1 },
];

export function findUnitDefinition(unitName: string | undefined | null): UnitDefinition {
  if (!unitName) {
    return { name: "Piece", abbreviation: "Piece", type: "count", multiplier: 1 };
  }
  const normalized = unitName.trim().toLowerCase();
  const found = UNIT_DEFINITIONS.find(
    u => u.name.toLowerCase() === normalized || u.abbreviation.toLowerCase() === normalized
  );
  if (found) return found;

  // Fallback defaults
  if (normalized === "kg") {
    return { name: "Kilogram", abbreviation: "KG", type: "weight", multiplier: 1000 };
  }
  if (normalized === "l" || normalized === "liters") {
    return { name: "Liter", abbreviation: "L", type: "volume", multiplier: 1000 };
  }
  if (normalized === "g" || normalized === "grams") {
    return { name: "Gram", abbreviation: "g", type: "weight", multiplier: 1 };
  }
  if (normalized === "ml") {
    return { name: "ML", abbreviation: "ml", type: "volume", multiplier: 1 };
  }

  // Generic fallback if not matched
  return { name: unitName, abbreviation: unitName, type: "count", multiplier: 1 };
}

/**
 * Convert user-entered quantity in a specific unit to the database's smallest unit representation.
 */
export function convertToSmallestUnit(quantity: number, unitName: string | undefined | null): number {
  const def = findUnitDefinition(unitName);
  return Math.round(quantity * def.multiplier * 100000) / 100000;
}

/**
 * Convert from database smallest unit representation back to the specified display unit.
 */
export function convertFromSmallestUnit(quantitySmallest: number, unitName: string | undefined | null): number {
  const def = findUnitDefinition(unitName);
  return Math.round((quantitySmallest / def.multiplier) * 100000) / 100000;
}

/**
 * Formats smallest units value for UI display nicely using the selected baseUnit.
 */
export function formatStock(quantitySmallest: number | undefined | null, type: string = "count", baseUnit: string = "Piece"): string {
  const q = quantitySmallest ?? 0;
  
  // Normalize legacy products without specified type
  const normType = (type === "Count Based" || type === "count") 
    ? "count" 
    : (type === "Weight Based" || type === "weight") 
    ? "weight" 
    : (type === "Volume Based" || type === "volume") 
    ? "volume" 
    : "count";

  const def = findUnitDefinition(baseUnit);
  const converted = convertFromSmallestUnit(q, def.name);

  if (normType === "weight") {
    const isKg = def.abbreviation.toLowerCase() === "kg" || def.name.toLowerCase() === "kilogram";
    if (isKg) {
      return `${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} KG`;
    }
    return `${converted} ${def.abbreviation || "g"}`;
  }

  if (normType === "volume") {
    const isL = def.abbreviation.toLowerCase() === "l" || def.name.toLowerCase() === "liter";
    if (isL) {
      return `${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} L`;
    }
    return `${converted} ${def.abbreviation || "ml"}`;
  }

  // Count based
  return `${converted} ${baseUnit || "Piece"}`;
}
