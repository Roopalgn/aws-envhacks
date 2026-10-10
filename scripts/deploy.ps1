param(
    [string]$Region = 'ap-south-1',
    [string]$StackName = 'breatheahead',
    [string]$Profile = '',
    [switch]$EnableSchedule
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if ($Profile) { $env:AWS_PROFILE = $Profile }
foreach ($tool in @('aws', 'sam', 'python', 'npm.cmd')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Missing required tool: $tool" }
}
function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
}
Invoke-Checked 'aws' @('sts', 'get-caller-identity', '--region', $Region)
Invoke-Checked 'python' @('-m', 'unittest', 'discover', '-s', 'tests', '-v')
Invoke-Checked 'python' @('scripts/stage_backend.py')
Invoke-Checked 'sam' @('validate', '--template-file', 'infra/template.yaml')
Invoke-Checked 'sam' @('build', '--template-file', 'infra/template.yaml', '--build-dir', '.local/sam-build')
$scheduleValue = if ($EnableSchedule) { 'true' } else { 'false' }
Invoke-Checked 'sam' @('deploy', '--template-file', '.local/sam-build/template.yaml', '--stack-name', $StackName, '--region', $Region, '--resolve-s3', '--capabilities', 'CAPABILITY_IAM', '--parameter-overrides', "EnableSchedule=$scheduleValue", '--no-fail-on-empty-changeset')
$outputsText = & aws cloudformation describe-stacks --stack-name $StackName --region $Region --query 'Stacks[0].Outputs' --output json
if ($LASTEXITCODE -ne 0) { throw 'Unable to read stack outputs' }
$stackOutputs = @{}
($outputsText | ConvertFrom-Json) | ForEach-Object { $stackOutputs[$_.OutputKey] = $_.OutputValue }
Invoke-Checked 'aws' @('lambda', 'invoke', '--function-name', $stackOutputs['CaptureFunctionName'], '--region', $Region, '.local/capture-result.json')
$capture = Get-Content '.local/capture-result.json' -Raw | ConvertFrom-Json
if ($capture.status -ne 'published') { throw 'AWS capture failed. Inspect .local/capture-result.json and CloudWatch logs.' }
$priorApi = $env:VITE_API_URL
try {
    $env:VITE_API_URL = $stackOutputs['ApiUrl']
    Invoke-Checked 'npm.cmd' @('run', 'build')
} finally {
    $env:VITE_API_URL = $priorApi
}
Invoke-Checked 'aws' @('s3', 'sync', 'dist/', "s3://$($stackOutputs['WebsiteBucketName'])/", '--region', $Region, '--cache-control', 'public,max-age=300')
Invoke-Checked 'aws' @('cloudfront', 'create-invalidation', '--distribution-id', $stackOutputs['DistributionId'], '--paths', '/*')
$health = Invoke-RestMethod "$($stackOutputs['ApiUrl'])/health"
if ($health.backend -ne 'aws') { throw 'AWS health check failed' }
$forecast = Invoke-RestMethod "$($stackOutputs['ApiUrl'])/forecast"
if ($forecast.schemaVersion -ne 1 -or $forecast.frames.Count -ne 25) { throw 'AWS forecast contract check failed' }
Write-Host "BreatheAhead deployed: $($stackOutputs['WebsiteUrl'])"
Write-Host 'CloudFront propagation can take several minutes. Review the AWS data capture before recording the demo.'
