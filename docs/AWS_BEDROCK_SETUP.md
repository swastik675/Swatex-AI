# Swatex AI — AWS Bedrock Setup & Troubleshooting Guide
**AWS Builder Mini-Challenge — Hackathon 2026**
**Tagline:** Code Smarter. Debug Faster.

## 1. Supported Models
Swatex AI uses the AWS Bedrock Converse API with any of the following models:
- **Anthropic Claude 3.5 Sonnet v2** (Recommended): `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Anthropic Claude 3.5 Sonnet v1**: `anthropic.claude-3-5-sonnet-20240620-v1:0`
- **Amazon Nova Pro**: `amazon.nova-pro-v1:0`
- **Meta Llama 3.3 70B Instruct**: `meta.llama3-3-70b-instruct-v1:0`

---

## 2. Configuration Steps

### Step A: Configure Environment Variables
Copy `.env.example` to `.env` in the root of the repository:
```bash
cp .env.example .env
```
Populate the AWS credentials:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Optional if using temporary STS credentials:
# AWS_SESSION_TOKEN=AQoDYXdzEJr...

# Model Selection:
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```
*Alternatively, Swatex automatically uses credentials from the standard AWS credential chain (`~/.aws/credentials` or AWS IAM roles).*

### Step B: Enable Bedrock Model Access
1. Open the **AWS Management Console** and navigate to **Amazon Bedrock**.
2. In the left navigation bar, choose **Model access**.
3. Click **Modify model access**.
4. Check the box for **Anthropic: Claude 3.5 Sonnet** (or Amazon Nova Pro).
5. Click **Next**, agree to terms, and click **Submit**.
6. Wait for the status to show **Access granted**.

### Step C: Verify IAM Permissions
Ensure your IAM user or role has the following policy action:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
```

---

## 3. Fallback & Local Demo Mode
If AWS credentials are not configured or model access has not yet been granted:
- Swatex AI **never crashes** and **never fabricates AWS responses**.
- The UI indicates `Amazon Bedrock: Unconfigured (Fallback Active)`.
- The system automatically runs in **Deterministic Local Demo Mode**.
- In Local Demo Mode, all 8 MCP tools execute against real local files, and unit tests are executed live in real-time.

---

## 4. Troubleshooting Common Errors

| Error Code | Root Cause | Solution |
|------------|------------|----------|
| `UnrecognizedClientException` | The AWS Access Key ID or Secret is invalid or expired. | Verify credentials with `aws sts get-caller-identity`. |
| `AccessDeniedException` | IAM user lacks `bedrock:InvokeModel` permissions. | Attach Bedrock permissions policy to your IAM principal. |
| `ResourceNotFoundException` | Model ID not found in the selected region. | Ensure model access is enabled in the specific `AWS_REGION`. |
| `ThrottlingException` | Exceeded Bedrock tokens-per-minute or requests-per-minute limit. | Swatex bounds turns and retries; check AWS Service Quotas. |
