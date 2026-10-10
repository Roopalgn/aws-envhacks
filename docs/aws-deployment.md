# AWS deployment walkthrough

This deploys BreatheAhead in your AWS account. It creates an S3 bucket for captured data, two Lambda functions, a public read-only API Gateway HTTP API, a private website bucket, a CloudFront distribution, IAM roles, and an EventBridge rule. The rule is **disabled by default**. The script still runs one real capture on first deployment so the hosted app has data. AWS may bill for these resources and their traffic. A budget alert helps you notice spend; it does not cap it.

The project targets `ap-south-1` (Mumbai) by default. The stack name is `breatheahead`. Deploy from a clean PowerShell session.

## 1. Check the account and cost

Use an AWS account intended for the hackathon and one you are allowed to deploy into. Check the account, selected role, billing alerts, and any AWS credits in the AWS console. Do not assume credits were applied because the event mentions them. For an organization-managed account, ask its administrator for a deployment role allowed to create this CloudFormation stack and required IAM roles, S3 buckets, Lambda functions, API Gateway, CloudFront distribution, and EventBridge rule. A developer role may not permit all these services.

Consider creating an AWS cost budget and alert in the Billing console before deploying. Alerts do not stop resources or cap spend. CloudFront is the main service to watch after testing because it persists until the stack is removed.

## 2. Install the command-line tools

Node.js and Python are already present in the current project environment. Check in PowerShell:

```powershell
node --version
npm --version
python --version
```

Install AWS CLI v2 using the official [AWS CLI for Windows instructions](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html). The per-user MSI does not require administrator access. Open a **new PowerShell window** after setup and check:

```powershell
aws --version
```

Install the current 64-bit Windows MSI for the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html). Open a new PowerShell window and check:

```powershell
sam --version
```

The project runs `sam build` for Python 3.12 without third-party Python packages. It does not use Docker, so Docker is not needed for this deployment flow. Use PowerShell, not Command Prompt.

## 3. Connect an AWS profile

Prefer your organization's AWS IAM Identity Center / SSO sign-in over long-lived access keys. Run:

```powershell
aws configure sso
```

Use the SSO portal URL and SSO region provided by your AWS administrator. **The SSO region is where Identity Center is configured; it is separate from the application region.** Select the intended AWS account and a role that can deploy this stack. When asked for a profile name, use:

```text
breathe-ahead
```

Then sign in and verify the account:

```powershell
aws sso login --profile breathe-ahead
aws sts get-caller-identity --profile breathe-ahead
```

Check the account ID and role ARN in the output. Stop if they point to the wrong account or role. The [AWS CLI SSO guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) explains the setup and permissions.

If your account does not use SSO, use only the authentication method your AWS administrator recommends. Never paste an AWS secret access key into chat, this repository, `.env`, or a command that saves it in shell history.

## 4. Open the project and run local checks

```powershell
Set-Location 'C:\Users\roopa\OneDrive\Desktop\hackathon\aws-envhacks'
npm ci
npm test
npm run build
```

These install the locked JavaScript dependencies, check the Python code, and build the static site. If `npm ci` reports a lockfile or dependency issue, stop and keep `package-lock.json` intact.

## 5. Deploy once, with the schedule off

Run this from the project root:

```powershell
.\scripts\deploy.ps1 -Profile 'breathe-ahead' -Region 'ap-south-1'
```

If PowerShell reports that script execution is disabled, run the same script in a child process with a process-only policy override:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\scripts\deploy.ps1' -Profile 'breathe-ahead' -Region 'ap-south-1'
```

The script uses this profile for AWS CLI and SAM commands. It checks the selected account, runs the Python tests, stages only the backend Python files, validates and builds the SAM template, then deploys CloudFormation with `CAPABILITY_IAM` because the stack creates Lambda execution roles. SAM's `--resolve-s3` creates or reuses its managed artifact bucket for the deployment package.

SAM creates the app resources. CloudFront may take several minutes to finish provisioning. The script invokes the capture Lambda once. That fetches NASA fire data and Open-Meteo wind data, stores raw files and the processed capture in the private data bucket, builds the frontend against the API URL, uploads it to the website bucket, invalidates the CloudFront cache, and checks the API. It prints the website URL when the checks pass.

Let the command finish. Do not start a second deployment while the first CloudFormation operation is running.

## 6. Verify the deployed app

Open the `https://…cloudfront.net` URL printed by the script. The page should show `CAPTURED DATA`, a capture timestamp, detections, and forecast controls. It should show `AWS backend verified` after the API health check passes.

You can inspect the endpoints from PowerShell; these commands are read-only:

```powershell
$stackOutputs = aws cloudformation describe-stacks --stack-name breatheahead --region ap-south-1 --profile breathe-ahead --query 'Stacks[0].Outputs' --output json | ConvertFrom-Json
$out = @{}
foreach ($item in $stackOutputs) { $out[$item.OutputKey] = $item.OutputValue }
Invoke-RestMethod "$($out.ApiUrl)/health"
$forecast = Invoke-RestMethod "$($out.ApiUrl)/forecast"
$forecast.sources.Count
$forecast.frames.Count
$out.WebsiteUrl
```

Expected: health reports `backend: aws`, forecast has 25 hourly frames, and the website URL loads. The detection count may differ from the committed sample when NASA's feed changes. The app is still a captured-data demo; AWS health does not mean the inputs are current to this minute or that the model has been scientifically validated.

## 7. Optional: enable six-hour captures

The EventBridge trigger is intentionally **off** on first deployment. After the first capture and website work, enable recurring ingestion with:

```powershell
.\scripts\deploy.ps1 -Profile 'breathe-ahead' -Region 'ap-south-1' -EnableSchedule
```

This updates the stack, performs another one-time capture, refreshes the site, and enables the every-six-hours rule. If a provider is unavailable or wind data is incomplete, that run fails instead of writing fabricated data. Check the `CaptureFunction` log in CloudWatch if the capture timestamp does not advance.

Disable the rule by deploying again without `-EnableSchedule`:

```powershell
.\scripts\deploy.ps1 -Profile 'breathe-ahead' -Region 'ap-south-1'
```

That also runs a manual capture and redeploys the frontend. Turning off the schedule does not remove the app.

## 8. Troubleshooting

- **`aws`, `sam`, or `npm` not found:** reopen PowerShell after installing, then check `--version`.
- **No credentials or expired token:** run `aws sso login --profile breathe-ahead` again.
- **Wrong account ID:** stop, choose the intended profile, then check `get-caller-identity` again before deploying.
- **`AccessDenied` or `InsufficientCapabilities`:** ask the account administrator to grant a deployment role with the needed CloudFormation and IAM permissions. Share the denied AWS action; use the narrowest suitable role.
- **`sam validate` fails:** read the first template error. This happens before CloudFormation changes the account.
- **CloudFormation rollback:** open CloudFormation → `breatheahead` → Events and find the first `CREATE_FAILED` or `UPDATE_FAILED` event.
- **Capture fails:** inspect the `CaptureFunction` log in CloudWatch. It needs HTTPS access to NASA and Open-Meteo; the Lambda is not placed in a VPC. Providers can rate-limit requests or return incomplete winds.
- **API works but the site fails:** check the API and website URLs separately. Wait for CloudFront deployment to finish, then refresh.
- **S3 bucket name collision:** inspect CloudFormation Events and the exact bucket name before changing or deleting anything.

## 9. Shut it down when the demo is over

Save the website URL and evidence you want first. To remove the CloudFront distribution, API, Lambda functions, IAM roles, and event rule:

```powershell
aws cloudformation delete-stack --stack-name breatheahead --region ap-south-1 --profile breathe-ahead
aws cloudformation wait stack-delete-complete --stack-name breatheahead --region ap-south-1 --profile breathe-ahead
```

**The data and website buckets are marked Retain in the template. Deleting the stack leaves both buckets and contents behind**, so storage charges may continue. Before deletion, save the verified bucket names from the stack outputs. After the stack is gone, inspect the exact bucket names. Only if you no longer need their contents, empty and delete both buckets by substituting the verified names here:

```powershell
aws s3 rm 's3://<verified-data-bucket-name>' --recursive --region ap-south-1 --profile breathe-ahead
aws s3 rb 's3://<verified-data-bucket-name>' --region ap-south-1 --profile breathe-ahead
aws s3 rm 's3://<verified-website-bucket-name>' --recursive --region ap-south-1 --profile breathe-ahead
aws s3 rb 's3://<verified-website-bucket-name>' --region ap-south-1 --profile breathe-ahead
```

`rm --recursive` permanently deletes the chosen bucket's contents. Verify each bucket name first. SAM's managed artifact bucket may remain too; inspect its tags in the S3 console before removing it, since another SAM app may share it. When appropriate, sign out of SSO:

```powershell
aws sso logout
```

## What AWS does not validate

AWS hosting does not add a ground-monitoring feed, prove detections are agricultural fires, validate a historical transport event, or turn particle counts into AQI or PM2.5. Ground observations remain marked unavailable until you import timestamped measurements with traceable sources.
