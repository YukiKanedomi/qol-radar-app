# QOL Radar - daily collection launcher (headless, subscription auth, no extra API billing)
# Invoked once a day by Windows Task Scheduler. Runs `claude -p` (headless) which collects
# new items, appends to data/picks.json and auto-publishes via git push.
# - Fresh process each run = fresh context (no transcript bloat)
# - --model sonnet = cheap model for this mechanical task (quality kept)
# - Scoped tool permissions only (no full bypass). File writes auto-accepted via acceptEdits.
# NOTE: keep THIS file ASCII-only. PowerShell 5.1 mis-reads BOM-less UTF-8 scripts that
#       contain Japanese, so the (Japanese) prompt lives in collect-prompt.txt and the
#       weekday focus in collect-focus.txt; both are read back explicitly as UTF-8 below.
# Stop:  Unregister-ScheduledTask -TaskName 'QOLRadar-DailyCollect' -Confirm:$false
$ErrorActionPreference = 'Stop'
# Decode the headless run's UTF-8 stdout correctly (else the log shows mojibake).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$repo       = 'C:\Users\kanedomi\Desktop\Claude\qol-radar-app'
$log        = Join-Path $repo 'scripts\auto-collect.log'
$promptFile = Join-Path $repo 'scripts\collect-prompt.txt'
$focusFile  = Join-Path $repo 'scripts\collect-focus.txt'
$alerts     = 'C:\Users\kanedomi\Desktop\Claude\bridge\knowledge\job-alerts.md'
Set-Location $repo
# Long-lived token for unattended jobs (claude setup-token). Kept outside repos; set for this job process only.
$tokenFile = Join-Path $env:USERPROFILE '.claude-jobs\oauth-token.txt'
if (Test-Path $tokenFile) { $env:CLAUDE_CODE_OAUTH_TOKEN = (Get-Content $tokenFile -Raw).Trim() }

function Log($msg) { "$(Get-Date -Format 'HH:mm:ss') $msg" | Out-File -FilePath $log -Append -Encoding utf8 }

# One line to Bridge's job-alerts.md (append only, UTF-8 without BOM).
function Alert($code, $reason) {
  $line = "- $(Get-Date -Format 'yyyy-MM-dd HH:mm') | QOLRadar-DailyCollect | exit=$code | $($reason -replace '\s+', ' ')`n"
  [System.IO.File]::AppendAllText($alerts, $line, (New-Object System.Text.UTF8Encoding $false))
}

# 2026-11-07: claude prints warnings on stderr (e.g. "this sign-in ends between ...").
#   Under EAP=Stop, PS 5.1 turns stderr from `2>&1` into a terminating error and the job died
#   right after START (11/05-07). So EAP=Continue only while claude runs.
function Invoke-Collect($prompt) {
  $ErrorActionPreference = 'Continue'
  $out = $prompt | & claude -p --model sonnet --permission-mode acceptEdits `
    --allowedTools 'WebSearch' 'WebFetch' 'Bash(node:*)' 'Bash(git:*)' 'Bash(gh:*)' 'Read' `
    --output-format text 2>&1 | Out-String
  $code = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'
  $out | Out-File -FilePath $log -Append -Encoding utf8
  Log "claude exit=$code"
  return @{ code = $code; auth = ($out -match 'Failed to authenticate|OAuth session expired|not logged in|Please run /login') }
}

$exitCode = 1
"==== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') START ====" | Out-File -FilePath $log -Append -Encoding utf8
try {
  # 2026-10-15: the prompt goes in via stdin. PS 5.1 splits a native argument at a space inside
  #   embedded double quotes, which silently cut the prompt mid-instruction (ai-radar 10/12, weekend 10/02).
  $OutputEncoding = New-Object System.Text.UTF8Encoding $false
  $prompt = Get-Content -Raw -Encoding UTF8 $promptFile

  # Weekday focus (genre + angle) so the query is not the same saturated question every day.
  # collect-focus.txt: 7 non-comment lines, Sunday first.
  $focusLines = @(Get-Content -Encoding UTF8 $focusFile | Where-Object { $_.Trim() -and -not $_.StartsWith('#') })
  $focus = $focusLines[[int](Get-Date).DayOfWeek]
  Log "focus: $([int](Get-Date).DayOfWeek)"
  $prompt = $prompt.Replace('{{FOCUS}}', $focus)

  $r = Invoke-Collect $prompt
  if (-not $r.auth -and $r.code -ne 0) {
    Log "claude failed (exit=$($r.code)) -> one retry in 10 min"
    Start-Sleep -Seconds 600
    $r = Invoke-Collect $prompt
  }
  if ($r.auth) {
    $exitCode = 2
    Alert $exitCode 'claude auth failure (re-login needed)'
  } elseif ($r.code -ne 0) {
    $exitCode = $r.code
    Alert $exitCode 'claude failed twice (first run + 1 retry)'
  } else {
    $exitCode = 0
  }
} catch {
  Log "launcher error: $($_.Exception.Message)"
  $exitCode = 1
  try { Alert $exitCode "launcher error: $($_.Exception.Message)" } catch { Log "alert write failed: $($_.Exception.Message)" }
} finally {
  "==== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') END (exit=$exitCode) ====" | Out-File -FilePath $log -Append -Encoding utf8
}
exit $exitCode
