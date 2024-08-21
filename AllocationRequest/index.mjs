import pkg from 'aws-sdk';
const { DynamoDB, SES } = pkg;

const dynamoDb = new DynamoDB.DocumentClient({ region: 'ca-central-1' });
const ses = new SES({ region: 'ca-central-1' });

export const handler = async (event) => {
    let requestData;

    // Check if the body exists and parse it
    try {
        requestData = event.body ? JSON.parse(event.body) : null;
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON in request body' }),
        };
    }

    if (!requestData) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is missing' }),
        };
    }

    const { requester, task, dates, taRequested, additionalInfo } = requestData;

    if (!requester || !task || !dates || dates.length === 0 || taRequested === undefined) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields" }),
        };
    }

    try {
        // Iterate through the dates array and update the DynamoDB table for each date
        for (const date of dates) {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date },
                UpdateExpression: 'ADD availablePeople :decrement',
                ExpressionAttributeValues: { ':decrement': -taRequested },
                ReturnValues: 'UPDATED_NEW',
            };
            await dynamoDb.update(params).promise();
        }

        // Send email
        await sendEmail(requester, task, taRequested, additionalInfo);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Request processed successfully" }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to process request",
                error: error.message
            }),
        };
    }
};

async function sendEmail(requester, task, taRequested, additionalInfo) {
    const emailParams = {
        Destination: {
            ToAddresses: ['flex2024@lballocations.com'] // Replace with recipient email address
        },
        Message: {
            Body: {
                Text: {
                    Data: `New allocation request from ${requester} for task ${task}. Number of TAs requested: ${taRequested}. Additional information: ${additionalInfo || 'None'}`
                }
            },
            Subject: {
                Data: 'New Allocation Request'
            }
        },
        Source: 'noreply@lballocations.com' // Replace with sender email address
    };

    try {
        const data = await ses.sendEmail(emailParams).promise();
        console.log('Email sent:', data.MessageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
