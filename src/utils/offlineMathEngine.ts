import * as math from 'mathjs';
import { CourseChunk } from '../types';

export interface MathCalculationResult {
  isMath: boolean;
  type: 'direct' | 'equation' | 'substitution' | 'unit_conversion' | 'pdf_formula';
  expression: string;
  steps: string[];
  result: string;
  unit?: string;
}

/**
 * Normalizes query string and French math words into mathematical format
 */
function normalizeMathQuery(query: string): string {
  let q = query.trim();

  // French word replacements
  q = q.replace(/racine\s+carr[eé]e\s+de\s+/gi, 'sqrt(');
  q = q.replace(/racine\s+carr[eé]e\s+/gi, 'sqrt(');
  q = q.replace(/racine\s+cubique\s+de\s+/gi, 'cbrt(');
  q = q.replace(/puissance\s+/gi, '^');
  q = q.replace(/au\s+carr[eé]/gi, '^2');
  q = q.replace(/au\s+cube/gi, '^3');
  q = q.replace(/fois|multipli[eé]\s+par/gi, '*');
  q = q.replace(/divis[eé]\s+par/gi, '/');
  q = q.replace(/plus/gi, '+');
  q = q.replace(/moins/gi, '-');

  return q;
}

/**
 * Detects if the query contains mathematical calculations or formulas and evaluates them
 */
export function solveOfflineMath(
  query: string,
  contextChunks?: CourseChunk[]
): MathCalculationResult | null {
  const raw = query.trim();
  const normalized = normalizeMathQuery(raw);

  // 1. Check for Unit conversions: e.g. "2500kg en tonne", "50 km/h en m/s", "100 m en cm", "12 bar en pascal"
  const unitMatch = raw.match(
    /([\d.,]+)\s*([a-zA-Z°/³²^]+)\s+(?:en|vers|to|in)\s+([a-zA-Z°/³²^]+)/i
  );
  if (unitMatch) {
    const val = parseFloat(unitMatch[1].replace(',', '.'));
    const fromUnitRaw = unitMatch[2].toLowerCase();
    const toUnitRaw = unitMatch[3].toLowerCase();

    const unitConversion = convertUnits(val, fromUnitRaw, toUnitRaw);
    if (unitConversion) {
      return unitConversion;
    }
  }

  // 2. Check for Formula with variables: e.g. "q*L^2/8 avec q=10 L=4", "U=R*I avec R=50 et I=2"
  const withVarsMatch = normalized.match(/(.+?)\s+(?:avec|pour|sachant que|où|quand)\s+(.+)/i);
  if (withVarsMatch) {
    const formulaPart = withVarsMatch[1].trim();
    const varsPart = withVarsMatch[2].trim();

    const subResult = evaluateFormulaWithVars(formulaPart, varsPart);
    if (subResult) return subResult;
  }

  // 3. Check for Equations: e.g. "2x + 5 = 15", "3x - 12 = 0", "5x = 25"
  const eqMatch = normalized.match(/([a-zA-Z0-9+\-*/^().\s]+)\s*=\s*([a-zA-Z0-9+\-*/^().\s]+)/);
  if (eqMatch && /[xXyYzZ]/.test(normalized) && !normalized.includes('==')) {
    const eqResult = solveLinearEquation(eqMatch[1].trim(), eqMatch[2].trim());
    if (eqResult) return eqResult;
  }

  // 4. Check if a formula from the PDF context chunks matches variables given in the query
  if (contextChunks && contextChunks.length > 0) {
    const pdfFormulaResult = tryMatchPdfFormulaAndCalculate(raw, contextChunks);
    if (pdfFormulaResult) return pdfFormulaResult;
  }

  // 5. Direct Calculation: e.g. "sqrt(144)", "25 * (4 + 6)^2", "cos(pi/4)", "1500 / 3.5"
  const directResult = tryDirectMathEvaluation(normalized, raw);
  if (directResult) return directResult;

  return null;
}

/**
 * Solve linear equations of form ax + b = c
 */
function solveLinearEquation(lhs: string, rhs: string): MathCalculationResult | null {
  try {
    const variable = (lhs.match(/[a-zA-Z]/) || rhs.match(/[a-zA-Z]/) || ['x'])[0];
    const steps: string[] = [];

    steps.push(`Équation de départ : ${lhs} = ${rhs}`);

    // Parse expression (lhs - rhs = 0)
    const combinedExpr = `(${lhs}) - (${rhs})`;
    const parsed = math.parse(combinedExpr);

    // Try evaluating at x=0 and x=1 to extract linear coefficients (a*x + b = 0 => x = -b/a)
    const b = parsed.evaluate({ [variable]: 0 });
    const aPlusB = parsed.evaluate({ [variable]: 1 });
    const a = aPlusB - b;

    if (Math.abs(a) < 1e-12) {
      return null; // Not solvable or constant
    }

    const solution = -b / a;
    const rounded = Math.round(solution * 100000) / 100000;

    steps.push(`Regroupement des termes en ${variable} : ${a}${variable} + (${b}) = 0`);
    steps.push(`Déplacement des constantes : ${a}${variable} = ${-b}`);
    steps.push(`Division par le coefficient ${a} : ${variable} = ${-b} / ${a}`);
    steps.push(`Résultat exact : ${variable} = ${rounded}`);

    return {
      isMath: true,
      type: 'equation',
      expression: `${lhs} = ${rhs}`,
      steps,
      result: `${variable} = ${rounded}`,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Evaluate formula given specified variable bindings (e.g. q*L^2/8 with q=10, L=4)
 */
function evaluateFormulaWithVars(formula: string, varsStr: string): MathCalculationResult | null {
  try {
    const scope: Record<string, number> = {};
    const steps: string[] = [];

    // Extract bindings: "q=10, L=4" or "q=10 et L=4" or "q: 10, L: 4"
    const bindings = varsStr.split(/[,;\s]+(?:et|and)?\s*/i);
    for (const b of bindings) {
      const parts = b.split(/[:=]/);
      if (parts.length === 2) {
        const varName = parts[0].trim();
        const varVal = parseFloat(parts[1].replace(',', '.').trim());
        if (varName && !isNaN(varVal)) {
          scope[varName] = varVal;
        }
      }
    }

    if (Object.keys(scope).length === 0) return null;

    steps.push(`Formule : ${formula}`);
    const varsFormatted = Object.entries(scope)
      .map(([k, v]) => `${k} = ${v}`)
      .join(', ');
    steps.push(`Valeurs des variables : ${varsFormatted}`);

    // Replace variables in string representation for step display
    let substituted = formula;
    for (const [k, v] of Object.entries(scope)) {
      substituted = substituted.replace(new RegExp(`\\b${k}\\b`, 'g'), `(${v})`);
    }
    steps.push(`Application numérique : ${substituted}`);

    const result = math.evaluate(formula, scope);
    const formattedResult = typeof result === 'number' ? Math.round(result * 10000) / 10000 : result.toString();

    steps.push(`Résultat calculé : ${formattedResult}`);

    return {
      isMath: true,
      type: 'substitution',
      expression: formula,
      steps,
      result: `${formattedResult}`,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Unit conversions (Engineering, Physics, everyday units)
 */
function convertUnits(value: number, fromUnit: string, toUnit: string): MathCalculationResult | null {
  const steps: string[] = [];
  const uFrom = fromUnit.trim().toLowerCase();
  const uTo = toUnit.trim().toLowerCase();

  const customUnits: Record<string, { base: string; factor: number; symbol: string }> = {
    // Mass
    kg: { base: 'g', factor: 1000, symbol: 'kg' },
    tonne: { base: 'g', factor: 1000000, symbol: 't' },
    t: { base: 'g', factor: 1000000, symbol: 't' },
    g: { base: 'g', factor: 1, symbol: 'g' },
    mg: { base: 'g', factor: 0.001, symbol: 'mg' },

    // Length
    km: { base: 'm', factor: 1000, symbol: 'km' },
    m: { base: 'm', factor: 1, symbol: 'm' },
    cm: { base: 'm', factor: 0.01, symbol: 'cm' },
    mm: { base: 'm', factor: 0.001, symbol: 'mm' },

    // Speed
    'km/h': { base: 'm/s', factor: 1 / 3.6, symbol: 'km/h' },
    'm/s': { base: 'm/s', factor: 1, symbol: 'm/s' },

    // Pressure
    bar: { base: 'pa', factor: 100000, symbol: 'bar' },
    pascal: { base: 'pa', factor: 1, symbol: 'Pa' },
    pa: { base: 'pa', factor: 1, symbol: 'Pa' },
    kpa: { base: 'pa', factor: 1000, symbol: 'kPa' },
    mpa: { base: 'pa', factor: 1000000, symbol: 'MPa' },
    psi: { base: 'pa', factor: 6894.76, symbol: 'psi' },

    // Volume
    l: { base: 'l', factor: 1, symbol: 'L' },
    litre: { base: 'l', factor: 1, symbol: 'L' },
    litres: { base: 'l', factor: 1, symbol: 'L' },
    ml: { base: 'l', factor: 0.001, symbol: 'mL' },
    m3: { base: 'l', factor: 1000, symbol: 'm³' },
  };

  if (customUnits[uFrom] && customUnits[uTo]) {
    const fromInfo = customUnits[uFrom];
    const toInfo = customUnits[uTo];

    if (fromInfo.base === toInfo.base) {
      const baseValue = value * fromInfo.factor;
      const converted = baseValue / toInfo.factor;
      const rounded = Math.round(converted * 100000) / 100000;

      steps.push(`Valeur d'origine : ${value} ${fromInfo.symbol}`);
      steps.push(`Conversion en unité de base (${fromInfo.base}) : ${value} × ${fromInfo.factor} = ${baseValue} ${fromInfo.base}`);
      steps.push(`Conversion vers l'unité cible (${toInfo.symbol}) : ${baseValue} / ${toInfo.factor} = ${rounded} ${toInfo.symbol}`);

      return {
        isMath: true,
        type: 'unit_conversion',
        expression: `${value} ${uFrom} en ${uTo}`,
        steps,
        result: `${rounded} ${toInfo.symbol}`,
        unit: toInfo.symbol,
      };
    }
  }

  // Fallback to mathjs unit conversion
  try {
    const mathUnit = math.unit(value, fromUnit);
    const converted = mathUnit.to(toUnit);
    steps.push(`Conversion mathématique : ${value} ${fromUnit} ➔ ${converted.toString()}`);
    return {
      isMath: true,
      type: 'unit_conversion',
      expression: `${value} ${fromUnit} en ${toUnit}`,
      steps,
      result: converted.toString(),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Match formulas found in PDF chunks and calculate when user mentions values
 */
function tryMatchPdfFormulaAndCalculate(
  rawQuery: string,
  chunks: CourseChunk[]
): MathCalculationResult | null {
  // Check if query gives assignments like "q=10, L=4" or numbers
  const numberAssignments = rawQuery.match(/([a-zA-Z])\s*=\s*([\d.,]+)/g);
  if (!numberAssignments || numberAssignments.length < 1) return null;

  for (const chunk of chunks) {
    const formulas = chunk.text.match(/([a-zA-Z]+)\s*=\s*([a-zA-Z0-9+\-*/^().\s]{4,})/g);
    if (formulas) {
      for (const formula of formulas) {
        const parts = formula.split('=');
        if (parts.length === 2) {
          const lhs = parts[0].trim();
          const rhs = parts[1].trim();

          const evaluated = evaluateFormulaWithVars(rhs, rawQuery);
          if (evaluated) {
            evaluated.steps.unshift(`📄 Formule extraite du cours (${chunk.courseTitle}, Page ${chunk.pageNumber}) : ${formula}`);
            evaluated.type = 'pdf_formula';
            evaluated.result = `${lhs} = ${evaluated.result}`;
            return evaluated;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Direct evaluation of arithmetic or scientific expressions
 */
function tryDirectMathEvaluation(expr: string, originalQuery: string): MathCalculationResult | null {
  // Only evaluate if it contains clear mathematical symbols or functions
  const hasMathSymbols = /[+\-*/^√%]/.test(expr) || /\b(sqrt|sin|cos|tan|log|ln|exp|abs|cbrt)\b/i.test(expr);
  const hasDigits = /\d/.test(expr);

  if (!hasMathSymbols || !hasDigits) return null;

  try {
    // Sanitize string
    let cleanExpr = expr
      .replace(/sqrt\(/g, 'sqrt(')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    // Close unbalanced parenthesis if needed
    const openP = (cleanExpr.match(/\(/g) || []).length;
    const closeP = (cleanExpr.match(/\)/g) || []).length;
    if (openP > closeP) {
      cleanExpr += ')'.repeat(openP - closeP);
    }

    const evaluated = math.evaluate(cleanExpr);
    if (evaluated !== undefined && typeof evaluated !== 'function') {
      const steps: string[] = [];
      steps.push(`Expression : ${cleanExpr}`);
      const rounded = typeof evaluated === 'number' ? Math.round(evaluated * 100000) / 100000 : evaluated.toString();
      steps.push(`Calcul direct : ${rounded}`);

      return {
        isMath: true,
        type: 'direct',
        expression: cleanExpr,
        steps,
        result: `${rounded}`,
      };
    }
  } catch (err) {
    return null;
  }

  return null;
}
