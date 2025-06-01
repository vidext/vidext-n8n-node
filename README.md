![Vidext Logo](https://www.vidext.io/images/vidext-logo.png)

# n8n-nodes-vidext

This is the official [n8n](https://n8n.io) node for [Vidext Boost](https://vidext.io/boost). It provides n8n integration for Vidext Boost, allowing you to trigger workflows when a Vidext session ends.

## Features

### Trigger: Vidext Session End

This node allows you to trigger an n8n workflow when a session ends in Vidext Boost. The trigger provides data about the completed session, which can be used in your automation workflow.

## Prerequisites

- An active [Vidext Boost](https://vidext.io/boost) account
- An API key from your Vidext Boost account
- n8n instance (version 1.0.0 or higher)

## Installation

### In your own n8n instance

Install this node package in your n8n instance:

```bash
npm install vidext-n8n-node
```

Then add the following line to your n8n `.env` file:

```
N8N_CUSTOM_EXTENSIONS=vidext-n8n-node
```

Restart your n8n instance and the Vidext nodes will be available in your workflow editor.

## Configuration

### API Key Authentication

1. In your n8n instance, go to **Settings** > **Credentials**
2. Click on **New Credential**
3. Select **Vidext N8n API Key API**
4. Enter the following information:
   - **API URL**: The URL of your Vidext API (default: `https://vidext.ai`)
   - **API Key**: Your Vidext Boost API key
5. Click **Save**

### Setting Up a Webhook Trigger

1. Create a new workflow in n8n
2. Add a **Vidext - Session End Trigger** node as your trigger
3. Select the Vidext API credentials you created
4. Configure the **Deck ID** parameter with the ID of the Vidext deck you want to monitor
5. Save and activate the workflow

## Usage

Once configured, the webhook will be automatically registered with Vidext. When a session ends in the specified deck, Vidext will send data to n8n and trigger your workflow.

The trigger node provides session data that you can use in subsequent nodes of your workflow.

## Support

If you have any questions or issues with this node, please contact Vidext support at support@vidext.io.
