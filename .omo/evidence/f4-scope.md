# F4 Scope Fidelity Check

## Passed

- No frontend framework migration.
- No backend/API server introduced.
- No real Gemini API key committed.
- GitHub Pages deployment path preserved.
- `gemini-3.1-flash-lite` remains the default Flash-Lite model.
- `rg -n "gemini-3-flash-preview|gemini-2\\.0-flash-exp" .` returned no matches.
- `rg -n "generateContent\\?key" js` returns only `js/api.js`.
- `index.html` no longer loads `js/program_patterns.js` by default.
- README documents no-real-key automated tests and `program_patterns.json` lazy loading.

## Notes

- `js/program_patterns.js` remains in the repo as a documented `file://` fallback.
- `node_modules/` exists locally from verification and is ignored by `.gitignore`.
