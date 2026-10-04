---
name: ca-module-workflow
description: >-
  Standard operating procedure and blueprint for generating, uploading, or modifying CA (Chartered Accountancy) modules, chapter study notes, and ICAI 4-part examination question banks.
---

# CA Module Workflow & Question Pattern

This skill guides the end-to-end creation, processing, and modification of Chartered Accountancy (CA) examination modules (e.g., CA Final Paper 2: Advanced Financial Management).

## 1. Directory Structure
All CA subjects and chapters reside in `data/`:
```text
data/
└── <Subject Name>/
    └── <Chapter Name>/
        ├── chapter.txt       # Exhaustive chapter study notes
        └── questions.json    # ICAI 4-part question bank
```

## 2. Chapter Notes (`chapter.txt`)
- Must thoroughly summarize the entire official ICAI study module.
- Must cover theoretical foundations, institutional frameworks, regulatory bodies (ICAI, SEBI, RBI, FEDAI, MCA), legal sections, mathematical models, and practical application examples.

## 3. Question Bank Schema (`questions.json`)
The file must contain:
1. `summary` (string): Executive summary of the question bank.
2. `oneword` (array): Minimum 8 Case Scenario MCQs (2 marks each, 4 options, exact `correctAnswer`, in-depth `explanation`).
3. `sa` (array): Minimum 6 Short Answer conceptual/policy questions (3–5 marks each) with structured points.
4. `essay` (array): Minimum 4 Practical Computational Problems (12–14 marks each) featuring `CAComputationTable` structured format:
   ```json
   {
     "title": "Computation Statement Title",
     "headers": [{ "label": "Header", "subheader": "Subheader" }],
     "rows": [
       {
         "particulars": "Particulars",
         "values": ["Col 1", "Col 2"],
         "isSubtotal": false,
         "isTotal": false
       }
     ],
     "notes": ["Working Notes..."]
   }
   ```
5. `fill` (array): Minimum 5 Key Blanks (`id`, `question` with `________`, `answer`).
6. `match` (array): Minimum 5 Matching Pairs (`id`, `left`, `right`).

## 4. Quality & Escaping Checks
- **LaTeX Math:** Always double-escape backslashes in JSON (e.g. `\\frac`, `\\sigma`, `\\beta`, `\\times`, `\\Delta`). Single backslashes will crash JSON parsing.
- **Validation:** Execute:
  ```bash
  node -e "JSON.parse(require('fs').readFileSync('data/<Subject>/<Chapter>/questions.json', 'utf8'))"
  ```
- **Build Verification:** Run `npm run build` to confirm zero static rendering or TypeScript errors.
- **Git Push Policy:** Only commit and push to Git when explicitly requested by the user.
