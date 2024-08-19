import pkg from 'aws-sdk';
const { DynamoDB, SES } = pkg;

const dynamoDb = new DynamoDB.DocumentClient({ region: 'ca-central-1' });
const ses = new SES({ region: 'ca-central-1' });

export const handler = async (event) => {
    // Handle preflight OPTIONS request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Replace "*" with your domain if needed
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify({ message: "Preflight check successful" })
        };
    }

    const requestData = JSON.parse(event.body);
    const { requester, task, dates, additionalInfo, taRequested } = requestData;

    if (!requester || !task || !dates || !Array.isArray(dates) || dates.length === 0 || !additionalInfo || taRequested === undefined) {
        console.error('Missing or invalid required fields:', { requester, task, dates, additionalInfo, taRequested });
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify({ message: "Missing or invalid required fields" }),
        };
    }

    try {
        for (const date of dates) {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date },
                UpdateExpression: 'ADD availablePeople :decrement',
                ExpressionAttributeValues: { ':decrement': -1 },
                ReturnValues: 'UPDATED_NEW',
            };
            await dynamoDb.update(params).promise();
        }

        await sendEmail(requester, task, dates, additionalInfo, taRequested);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify({ message: "Request processed successfully" }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: JSON.stringify({
                message: "Failed to process request",
                error: error.message
            }),
        };
    }
};

async function sendEmail(requester, task, dates, additionalInfo, taRequested) {
    const emailParams = {
        Destination: {
            ToAddresses: ['flex2024@lballocations.com']
        },
        Message: {
            Body: {
                Text: {
                    Data: `Subject: Allocation request\n\n` +
                          `Requester: ${requester}\n` +
                          `Dates: ${dates.join(', ')}\n` +
                          `Task: ${task}\n` +
                          `Additional Information: ${additionalInfo}\n` +
                          `Number of TA's Requested: ${taRequested}`
                }
            },
            Subject: {
                Data: 'Allocation request'
            }
        },
        Source: 'noreply@lballocations.com'
    };

    try {
        const data = await ses.sendEmail(emailParams).promise();
        console.log('Email sent:', data.MessageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
