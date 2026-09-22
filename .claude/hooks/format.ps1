# Formate avec Biome le fichier que Claude Code vient d'ecrire ou d'editer.
# Branche sur PostToolUse (Edit|Write). Recoit le JSON du hook sur stdin.
#
# Ne bloque jamais : toute anomalie sort en 0 et laisse l'edition passer.
# Sans Biome installe (avant le lot 0), le hook ne fait rien.

$ErrorActionPreference = 'SilentlyContinue'

$raw = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

try { $payload = $raw | ConvertFrom-Json } catch { exit 0 }

$target = $payload.tool_input.file_path
if ([string]::IsNullOrWhiteSpace($target)) { exit 0 }

# Seuls les formats que Biome traite.
if ($target -notmatch '\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|json|jsonc|css)$') { exit 0 }

# NE JAMAIS toucher aux skills : certaines embarquent des .mjs que le formatage
# reecrirait, ce qui ferait diverger le hash de skills-lock.json.
$normalise = $target -replace '\\', '/'
if ($normalise -match '/\.claude/skills/') { exit 0 }

$projet = $env:CLAUDE_PROJECT_DIR
if ([string]::IsNullOrWhiteSpace($projet)) { $projet = (Get-Location).Path }

$biome = Join-Path $projet 'node_modules/.bin/biome.cmd'
if (-not (Test-Path $biome)) { exit 0 }

& $biome check --write --no-errors-on-unmatched $target *> $null
exit 0
