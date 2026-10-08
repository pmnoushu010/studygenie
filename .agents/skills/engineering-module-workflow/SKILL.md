---
name: engineering-module-workflow
description: Standard operating procedure and blueprint for generating, uploading, or modifying B.Tech Engineering modules (Electrical Technology, Mechanical Engineering, Physics, Maths) with authentic mathematical language, unicode notation, and roman numeral structures.
---

# Engineering Module Workflow & Mathematical Pattern

Whenever uploading, generating, or modifying any B.Tech Engineering module (e.g. Electrical Technology, Mechanical Engineering):

1. **Chapter Directory & Structure**:
   - Location: `data/<Subject Name>/<Chapter Name>/`
   - Files required:
     - `chapter.txt`: Comprehensive chapter study notes covering syllabus concepts, constructional details, operating principles, mathematical formulas, derivations, comparisons, and application notes.
     - `questions.json`: University-style question bank with Part A (3 Marks, `sa`) and Part B (12 Marks, `essay`) questions, plus summary, oneword, fill, and match sections.

2. **Strict Mathematical Language & Typography**:
   - **NEVER** use programming shorthand (e.g., avoid `10^6`, `x 10^7`, `sqrt()`, `alpha`, `*`, `U-235`, `m^2`).
   - **ALWAYS** use standard mathematical notation and unicode characters:
     - **Powers & Scientific Notation**: `25 × 10⁶ kWh`, `1.6 × 10⁻¹⁹ J`, `2 × 10⁷ m/s`, `2592 × 10³ m³`, `50 tonnes/m²`.
     - **Subscripts & Chemical/Isotope Notations**: `U²³⁸₉₂`, `Th²³²₉₀`, `U²³⁵₉₂`, `U²³⁴₉₂`, `Pu²³⁹₉₄`, `CO₂`, `D₂O`, `H₂O`.
     - **Machine Variables**: `Nₛ`, `Nᵣ`, `E₁`, `E₂`, `V₁`, `V₂`, `I₁`, `I₂`, `R₂`, `X₂`, `Zₛ`, `Xₛ`, `Rₐ`, `Iₐ`, `Kₚ`, `K_d`, `K_w`, `E₀`, `V_{oc}`, `I_{sc}`.
     - **Mathematical Operators & Radicals**: `×` (multiplication), `√` (radical/square root, e.g. `√(R₂² + X₂²)`), `∝` (proportional to), `±`, `≈`, `≤`, `≥`, `⇒`.
     - **Greek Symbols**: `α`, `β`, `γ` (rays/particles), `Φ` (flux), `ϕ` (phase angle / power factor $\cos \phi$), `θ`, `ω`, `η` (efficiency), `δ` (torque angle).
     - **Formulas & Derivations**: Express formulas cleanly, e.g. $N_s = 120f / P$, $s = (N_s - N)/N_s$, $f' = sf$, $T \propto \Phi I_2 \cos \phi_2$, $T_{max} = (K E_2^2) / (2X_2)$, $E_{ph} = 4.44 K_p K_d f \Phi T$.

3. **Roman Numerals for Classifications & Sub-points**:
   - **ALWAYS** use roman numerals `(i)`, `(ii)`, `(iii)`, `(iv)`, `(v)`, `(vi)`, `(vii)` for classifications, features, advantages, and step-by-step methods exactly as shown in source textbook/PDF slides.

4. **Complete Step-by-Step Calculation Workings**:
   - For all numerical problems, state the governing formula first, list given parameters with appropriate units, show intermediate step-by-step arithmetic substitutions, and conclude with highlighted final answers with standard engineering units (e.g., $\text{V}$, $\text{kV}$, $\text{A}$, $\text{kW}$, $\text{MW}$, $\text{Wb}$, $\text{rpm}$, $\text{Hz}$).

5. **Validation & Git Push Rule**:
   - Validate with `node -e "JSON.parse(fs.readFileSync(...))"` and `npm run build` after generating or modifying.
   - DO NOT push to Git automatically. Keep all modified or generated files local in the working tree until the user explicitly commands: "push to git".
