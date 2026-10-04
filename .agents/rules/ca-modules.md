# CA Module Creation and Maintenance Rules

This rule defines the mandatory guidelines and question pattern for creating, uploading, and modifying all Chartered Accountancy (CA) modules (e.g., CA Final Advanced Financial Management / Paper 2).

Whenever a CA module is uploaded, processed, or modified, you MUST strictly adhere to the following standards:

---

## 1. Directory Structure and Files
Each chapter/module under `data/<Subject Name>/<Chapter Name>/` MUST contain exactly two files:
1. `chapter.txt`: Comprehensive chapter study notes covering the full syllabus, theoretical frameworks, regulatory guidelines (e.g., ICAI, SEBI, RBI, FEDAI, Companies Act), mathematical derivations, and valuation models.
2. `questions.json`: Examination-grade question bank adhering strictly to the ICAI 4-part examination pattern.

---

## 2. Four-Part Question Pattern (`questions.json`)
The JSON structure must match this exact schema:

```json
{
  "summary": "Detailed overview of the chapter question bank...",
  "oneword": [ ... ],
  "sa": [ ... ],
  "essay": [ ... ],
  "fill": [ ... ],
  "match": [ ... ]
}
```

### Part I: Case Scenario MCQs (`oneword`)
- **Quantity:** Minimum 8 questions.
- **Marks:** 2 marks each.
- **Fields:**
  - `id`: Unique string (e.g., `ch-mcq-1`).
  - `question`: Practical case-study scenario prompt.
  - `options`: Array of exactly 4 strings.
  - `correctAnswer`: Exact string matching one of the options.
  - `explanation`: Detailed explanation with working notes, formulas, and statutory references.
  - `marks`: 2.

### Part II - Section A: Conceptual & Policy Questions (`sa`)
- **Quantity:** Minimum 6 questions.
- **Marks:** 3 to 5 marks each.
- **Fields:**
  - `id`: Unique string (e.g., `ch-sa-1`).
  - `question`: Conceptual, regulatory, analytical, or policy question.
  - `answer`: Exhaustive, point-by-point ICAI-grade model answer.
  - `marks`: 3, 4, or 5.

### Part II - Section B: Practical Long Answer Computational Problems (`essay`)
- **Quantity:** Minimum 4 comprehensive problems.
- **Marks:** 12 to 14 marks each.
- **Fields:**
  - `id`: Unique string (e.g., `ch-pr-1`).
  - `question`: Comprehensive multi-part practical problem statement with all data/parameters.
  - `marks`: 12 to 14.
  - `computation`: Structured `CAComputationTable` object (mandatory for every computational problem).

#### `computation` Object Structure (`CAComputationTable`):
```json
{
  "title": "Clear descriptive title of statement / working",
  "headers": [
    { "label": "Column Title", "subheader": "Optional subheader" }
  ],
  "rows": [
    {
      "particulars": "Step description or item name",
      "values": ["Value Col 1", "Value Col 2"],
      "isSubtotal": false,
      "isTotal": false
    }
  ],
  "notes": [
    "Note 1: Working note or legal reference",
    "Note 2: Basis of calculation or rounding"
  ]
}
```

#### Visual Presentation Requirements:
- Rendered using `CAComputationTable` with warm beige `#f5ecd8` background and `#cfae77` headers.
- Single-tier or two-tier headers with subheaders.
- Explicit row flags: `isSubtotal: true` for interim subtotals and `isTotal: true` for final figures (with double underline styling).

### Key Blanks (`fill`)
- **Quantity:** Minimum 5 questions.
- **Fields:**
  - `id`: Unique string (e.g., `ch-fill-1`).
  - `question`: High-yield definition or rule with `________`.
  - `answer`: Exact term or phrase.

### Match Provisions (`match`)
- **Quantity:** Minimum 5 pairs.
- **Fields:**
  - `id`: Unique string (e.g., `ch-match-1`).
  - `left`: Concept, ratio, term, or regulatory section.
  - `right`: Definition, formula, or statutory provision.

---

## 3. Strict JSON & Mathematical Escaping Rules
- **Double Backslashes in JSON:** All LaTeX backslashes MUST be escaped with double backslashes (e.g., `\\frac`, `\\sigma`, `\\beta`, `\\times`, `\\pm`, `\\Delta`, `\\approx`, `\\sqrt`). Never write single backslashes in JSON strings as it triggers `SyntaxError: Bad escaped character in JSON` and crashes `/api/chapter-questions`.
- **Validation:** Always validate every generated `questions.json` with `node -e "JSON.parse(fs.readFileSync(...))"`.
- **Build Verification:** Always test `npm run build` to confirm zero compilation or TypeScript errors.

---

## 4. Git Push Policy
- **DO NOT PUSH TO GIT AUTOMATICALLY:** Keep newly added or modified chapters local in the working tree until the user explicitly gives the command to push (e.g., *"push to git"*).
