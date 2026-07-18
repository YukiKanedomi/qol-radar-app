# QOL Radar - daily collection launcher (headless, subscription auth, no extra API billing)
# Invoked once a day by Windows Task Scheduler. Runs `claude -p` (headless) which collects
# new items, appends to data/picks.json and auto-publishes via git push.
# - Fresh process each run = fresh context (no transcript bloat)
# - --model sonnet = cheap model for this mechanical task (quality kept)
# - Scoped tool permissions only (no full bypass). File writes auto-accepted via acceptEdits.
# NOTE: keep THIS file ASCII-only. PowerShell 5.1 mis-reads BOM-less UTF-8 scripts that
#       contain Japanese, so the (Japanese) prompt lives in collect-prompt.txt and is read
#       back explicitly as UTF-8 below.
# Stop:  Unregister-ScheduledTask -TaskName 'QOLRadar-DailyCollect' -Confirm:$false
$ErrorActionPreference = 'Stop'
# Decode the headless run's UTF-8 stdout correctly (else the log shows mojibake).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$repo       = 'C:\Users\kanedomi\Desktop\Claude\qol-radar-app'
$log        = Join-Path $repo 'scripts\auto-collect.log'
$promptFile = Join-Path $repo 'scripts\collect-prompt.txt'
Set-Location $repo

$prompt = Get-Content -Raw -Encoding UTF8 $promptFile

"==== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') START ====" | Out-File -FilePath $log -Append -Encoding utf8
& claude -p $prompt --model sonnet --permission-mode acceptEdits `
  --allowedTools 'WebSearch' 'Bash(node:*)' 'Bash(git:*)' 'Bash(gh:*)' 'Read' `
  --output-format text 2>&1 | Out-File -FilePath $log -Append -Encoding utf8
"==== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') END (exit=$LASTEXITCODE) ====" | Out-File -FilePath $log -Append -Encoding utf8
