import type {
	IExecuteFunctions,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import { NodeApiError, NodeOperationError, NodeConnectionType } from 'n8n-workflow';

export class VidextSessionEndTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Vidext - Session End Trigger',
		icon: 'file:vidext.svg',
		group: ['trigger'],
		name: 'vidextSessionEndTrigger',
		version: 1,
		subtitle: '={{$parameter["deckId"] || "No Deck ID"}}',
		description: 'Activates when a session ends for a Deck ID configured. Automatically manages the webhook subscription with the Vidext API',
		defaults: {
			name: 'Vidext',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'vidextApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Deck ID',
				name: 'deckId',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'Deck ID',
				description: 'Deck ID of the presentation (deck) of Vidext for which session end events will be listened to',
			},
			{
				displayName: 'Internal Vidext Subscription ID',
				name: 'vidextInternalSubscriptionId',
				type: 'hidden',
				default: '',
			},
		],
	};


	methods = {
		loadOptions: {
			async getOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return [];
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				try {
					await VidextSessionEndTrigger.manageVidextWebhookSubscription(this, 'subscribe');
					this.logger.info('Vidext webhook created successfully');
					return true;
				} catch (error) {
					this.logger.error(`Error creating webhook: ${(error as Error).message}`);

					if ('response' in error) {
						this.logger.error(`API response: ${error.response?.status || 'unknown'}`);
					}
					this.logger.error(`Stack trace: ${(error as Error).stack || 'no disponible'}`);

					throw error;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				try {
					await VidextSessionEndTrigger.manageVidextWebhookSubscription(this, 'unsubscribe');
					return true;
				} catch (error) {
					this.logger.error(`Error deleting webhook: ${error.message}`);
					throw error;
				}
			},

		},
	};


	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		try {
			const req = this.getRequestObject();
			let webhookData = req.body;
			if (!Array.isArray(webhookData)) {
				webhookData = [webhookData];
			}

			const formattedData = this.helpers.returnJsonArray(webhookData);
			return {
				workflowData: [formattedData],
			};
		} catch (error) {
			this.logger.error(`Error in webhook: ${(error as Error).message}`);
			this.logger.error(`Stack trace: ${(error as Error).stack || 'unavailable'}`);

			throw error;
		}
	}

	/**
	 * Manages the subscription/cancellation of webhooks with the Vidext API
	 */
	static async manageVidextWebhookSubscription(
		functions: IHookFunctions | IExecuteFunctions,
		action: 'subscribe' | 'unsubscribe',
	): Promise<void> {
		const deckId = functions.getNodeParameter('deckId', 0) as string;
		if (!deckId) {
			throw new NodeOperationError(functions.getNode(), 'Deck ID is required for webhook management');
		}

		const credentials = await functions.getCredentials('vidextApi');
		if (!credentials) {
			throw new NodeOperationError(
				functions.getNode(),
				'Vidext API Key credentials not found',
			);
		}

		const apiUrl = (credentials.apiUrl as string) || 'https://vidext.ai';
		const apiKey = credentials.apiKey as string;
		const staticData = functions.getWorkflowStaticData('node');

		if (action === 'subscribe') {
			let n8nWebhookUrl: string | undefined;
			try {
				if ('getNodeWebhookUrl' in functions) {
					n8nWebhookUrl = (functions as IHookFunctions).getNodeWebhookUrl('default');
				} else {
					functions.logger.warn('Cannot get webhook URL from this context.');
					return;
				}
			} catch (error) {
				functions.logger.warn('Could not get webhook URL. Is the workflow active?');
				return;
			}

			if (!n8nWebhookUrl) {
				functions.logger.warn('Empty webhook URL. Is the workflow active?');
				return;
			}

			try {
				const response = await functions.helpers.httpRequestWithAuthentication.call(
					functions,
					'vidextApi',
					{
						method: 'POST',
						url: `${apiUrl}/api/n8n/hooks/subscribe`,
						body: {
							deckId,
							n8nWebhookUrl,
							type: 'sessionEnd',
						},
						headers: {
							'x-api-key': `${apiKey}`,
							'Content-Type': 'application/json',
						},
					},
				);

				if (response.subscriptionId) {
					staticData.vidextSubscriptionId = response.subscriptionId;
				}
			} catch (error) {
				if ('response' in error) {
					let errorMessage = '';
					switch (error.response?.status) {
						case 400:
							errorMessage = error.response?.data?.message || 'Invalid request parameters';
							break;
						case 401:
							errorMessage = 'Unauthorized. Check your API key';
							break;
						case 409:
							errorMessage = 'Webhook already exists for this Deck ID';
							break;
						case 422:
							errorMessage = 'Invalid webhook type or parameters';
							break;
						case 500:
							errorMessage = 'Vidext server internal error';
							break;
						default:
							errorMessage = `Vidext API error: ${error.response?.status || 'unknown'}`;
					}

					throw new NodeApiError(functions.getNode(), error, {
						message: errorMessage,
					});
				} else {
					throw new NodeApiError(functions.getNode(), error, {
						message: `Connection error: ${(error as Error).message}`,
					});
				}
			}
		} else if (action === 'unsubscribe') {
			const subscriptionId = staticData.vidextSubscriptionId as string | undefined;

			if (!subscriptionId) {
				functions.logger.warn(`No subscription ID found for cancellation.`);
			}

			try {
				await functions.helpers.httpRequestWithAuthentication.call(
					functions,
					'vidextApi',
					{
						method: 'POST',
						url: `${apiUrl}/api/n8n/hooks/unsubscribe`,
						body: {
							subscriptionId,
						},
						headers: {
							'x-api-key': `${apiKey}`,
							'Content-Type': 'application/json',
						},
					},
				);

				delete staticData.vidextSubscriptionId;
				functions.logger.info(`Vidext webhook subscription cancelled.`);
			} catch (error) {
				functions.logger.error(`Error cancelling Vidext webhook: ${(error as Error).message}`);
				delete staticData.vidextSubscriptionId;
			}
		}
	}
}
