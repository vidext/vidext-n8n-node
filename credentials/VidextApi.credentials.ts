import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VidextApi implements ICredentialType {
	name = 'vidextApi';
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-display-name-miscased, n8n-nodes-base/cred-class-field-display-name-missing-api
	displayName = 'Vidext n8n API Key';
	documentationUrl = 'https://vidext.io/boost/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'Vidext endpoint URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://vidext.ai',
			placeholder: 'https://vidext.ai',
			description:
				'The URL of the Vidext endpoint (do not change unless you know what you are doing)',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'Paste your API Key here.',
			description: 'You can find your API Key in the Vidext Boost integration settings.',
			required: true,
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				"x-api-key": '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.apiUrl}}',
			url: '/api/n8n/test',
		},
	};
}
