param(
    [string]$Region = 'ap-south-1',
    [string]$StackName = 'breatheahead',
    [string]$Profile = ''
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if ($Profile) { $env:AWS_PROFILE = $Profile }
foreach ($tool in @('aws', 'npm.cmd')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Missing required tool: $tool" }
}
function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
}
Invoke-Checked 'aws' @('sts', 'get-caller-identity', '--region', $Region)
Invoke-Checked 'npm.cmd' @('test')
$outputsText = & aws cloudformation describe-stacks --stack-name $StackName --region $Region --query 'Stacks[0].Outputs' --output json
if ($LASTEXITCODE -ne 0) { throw 'Unable to read stack outputs' }
$outputs = @{}
($outputsText | ConvertFrom-Json) | ForEach-Object { $outputs[$_.OutputKey] = $_.OutputValue }
foreach ($key in @('ApiUrl', 'WebsiteBucketName', 'DistributionId', 'WebsiteUrl')) {
    if (-not $outputs[$key]) { throw "Missing stack output: $key" }
}
$priorApi = $env:VITE_API_URL
try {
    $env:VITE_API_URL = $outputs['ApiUrl']
    Invoke-Checked 'npm.cmd' @('run', 'build')
} finally { $env:VITE_API_URL = $priorApi }
Invoke-Checked 'aws' @('s3', 'sync', 'dist/', "s3://$($outputs['WebsiteBucketName'])/", '--region', $Region, '--cache-control', 'public,max-age=300')
Invoke-Checked 'aws' @('cloudfront', 'create-invalidation', '--distribution-id', $outputs['DistributionId'], '--paths', '/*')
Write-Host "Frontend published: $($outputs['WebsiteUrl'])"
Write-Host 'CloudFront cache invalidation can take several minutes. The capture and stack configuration were not changed.'
