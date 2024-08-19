import pkg from 'aws-sdk';
const { DynamoDB, SES } = pkg;

const dynamoDb = new DynamoDB.DocumentClient({ region: 'ca-central-1' });
const ses = new SES({ region: 'ca-central-1' });

export const handler = async (event) => {
    const requestData = JSON.parse(event.body);
    const { requester, task, dates, additionalInfo, taRequested } = requestData;

    // Validate required fields
    if (!requester || !task || !dates || !Array.isArray(dates) || dates.length === 0 || !additionalInfo || taRequested === undefined) {
        console.error('Missing or invalid required fields:', { requester, task, dates, additionalInfo, taRequested });
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing or invalid required fields" }),
        };
    }

    try {
        // Iterate through the dates array and update the DynamoDB table for each date
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

        // Send email
        await sendEmail(requester, task, dates, additionalInfo, taRequested);

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

async function sendEmail(requester, task, dates, additionalInfo, taRequested) {
    const emailParams = {
        Destination: {
            ToAddresses: ['flex2024@lballocations.com'] // Replace with recipient email address
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
