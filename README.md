# ai-perf-scan

AI-powered performance scanner for React Native and React apps.

## Installation

```bash
npm install -g ai-perf-scan
```

## Usage

```bash
# Scan current directory
ai-perf-scan

# Scan specific path
ai-perf-scan --path ./my-app

# Enable AI-powered suggestions (requires OpenAI API key)
ai-perf-scan --ai --api-key YOUR_OPENAI_API_KEY

# Show verbose output
ai-perf-scan --verbose

# Output as JSON
ai-perf-scan --json
```

## What it scans

### Dependencies
- Heavy dependencies (moment, lodash, etc.)
- Duplicate libraries (axios + node-fetch, moment + date-fns)
- Full lodash imports instead of modular imports
- High dependency count

### Assets
- Large images (>100KB warning, >500KB critical)
- Large fonts (>200KB)
- Missing WebP alternatives for large images
- Missing resolution variants (@2x, @3x)
- Total assets size

### Code
- Console statements left in code
- Inline functions in render (performance impact)
- Inline styles (should use StyleSheet)
- useEffect without dependencies
- Large files (>300 lines)
- Hardcoded URLs
- Missing React.memo on large components
- Heavy operations in render (multiple map calls)

## Options

| Option | Description |
|--------|-------------|
| `-p, --path <path>` | Path to scan (default: current directory) |
| `--ai` | Enable AI-powered suggestions |
| `--api-key <key>` | OpenAI API key for AI suggestions |
| `-v, --verbose` | Show detailed output |
| `--json` | Output results as JSON |

## License

MIT
