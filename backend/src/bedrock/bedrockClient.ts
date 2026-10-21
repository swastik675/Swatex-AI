import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

export interface BedrockConfig {
  region: string;
  modelId: string;
  hasExplicitCredentials: boolean;
}

export interface BedrockHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  modelId: string;
  region: string;
  statusMessage: string;
  diagnostics?: string;
}

export function getBedrockConfig(): BedrockConfig {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const modelId = process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  const hasExplicitCredentials = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );

  return {
    region,
    modelId,
    hasExplicitCredentials,
  };
}

let cachedClient: BedrockRuntimeClient | null = null;

export function getBedrockClient(): BedrockRuntimeClient {
  const config = getBedrockConfig();
  if (!cachedClient) {
    cachedClient = new BedrockRuntimeClient({
      region: config.region,
    });
  }
  return cachedClient;
}

/**
 * Verifies live connection to Amazon Bedrock.
 * Never reports success without a validated response.
 */
export async function checkBedrockHealth(): Promise<BedrockHealthStatus> {
  const config = getBedrockConfig();

  // If no credentials or environment present, report immediately without fake claims
  if (!config.hasExplicitCredentials && !process.env.AWS_PROFILE) {
    return {
      isConfigured: false,
      isConnected: false,
      modelId: config.modelId,
      region: config.region,
      statusMessage: 'AWS credentials not detected in environment. Running in Local Demo Mode.',
      diagnostics: 'Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in .env to activate live Amazon Bedrock reasoning.',
    };
  }

  try {
    const client = getBedrockClient();
    // Test with a lightweight ping query
    const command = new ConverseCommand({
      modelId: config.modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Respond with "PONG".' }],
        },
      ],
      inferenceConfig: {
        maxTokens: 5,
        temperature: 0.0,
      },
    });

    const response = await client.send(command);
    const replyText = response.output?.message?.content?.[0]?.text || '';

    return {
      isConfigured: true,
      isConnected: true,
      modelId: config.modelId,
      region: config.region,
      statusMessage: `Amazon Bedrock connected successfully (${config.modelId} in ${config.region}).`,
      diagnostics: `Latency verification succeeded. Model reply: "${replyText.trim()}".`,
    };
  } catch (error: any) {
    let diagnosis = error.message;
    if (error.name === 'UnrecognizedClientException') {
      diagnosis = 'The AWS security token or access key included in the request is invalid.';
    } else if (error.name === 'AccessDeniedException') {
      diagnosis = 'Access denied: IAM user/role lacks permission for bedrock:InvokeModel on ' + config.modelId;
    } else if (error.name === 'ResourceNotFoundException') {
      diagnosis = `Model "${config.modelId}" is not found or not enabled in region "${config.region}". Check Model Access in AWS Bedrock console.`;
    } else if (error.name === 'CredentialsProviderError') {
      diagnosis = 'Could not load credentials from any AWS provider chain.';
    }

    return {
      isConfigured: true,
      isConnected: false,
      modelId: config.modelId,
      region: config.region,
      statusMessage: `Amazon Bedrock connection failed: ${error.name || 'Error'}`,
      diagnostics: diagnosis,
    };
  }
}
