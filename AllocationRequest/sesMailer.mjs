import pkg from 'aws-sdk';
const { DynamoDB, SES } = pkg;

const dynamoDb = new DynamoDB.DocumentClient({ region: 'ca-central-1' });
const ses = new SES({ region: 'ca-central-1' });

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing request body" }),
        };
    }

    let requestData;
    try {
        requestData = JSON.parse(event.body);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON format" }),
        };
    }

    console.log("Parsed requestData:", JSON.stringify(requestData, null, 2));

    const { requester, task, dates, additionalInfo, taRequested } = requestData;

    if (!requester || !task || !dates || !Array.isArray(dates) || dates.length === 0 || !additionalInfo || !taRequested) {
        console.error('Missing required fields:', { requester, task, dates, additionalInfo, taRequested });
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing or invalid required fields" }),
        };
    }

    try {
        // Initialize each date in the DynamoDB table with default value if it doesn't exist
        for (const date of dates) {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date },
                UpdateExpression: 'SET availablePeople = if_not_exists(availablePeople, :default)',
                ExpressionAttributeValues: { ':default': 22 },
                ReturnValues: 'UPDATED_NEW',
            };
            const result = await dynamoDb.update(params).promise();
            console.log(`Update result for ${date}:`, result);
        }

        // Process each date to decrement the available people count
        for (const date of dates) {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date },
                UpdateExpression: 'ADD availablePeople :decrement',
                ExpressionAttributeValues: { ':decrement': -1 },
                ReturnValues: 'UPDATED_NEW',
            };
            const result = await dynamoDb.update(params).promise();
            console.log(`Update result for ${date}:`, result);
        }

        // Send email
        await sendEmail(requester, task, dates);

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

async function sendEmail(requester, task, dates) {
    const emailParams = {
        Destination: {
            ToAddresses: ['flex2024@lballocations.com'], // Replace with recipient email address
        },
        Message: {
            Body: {
                Text: {
                    Data: `
                        Subject: Allocation request

                        Requester: ${requester}
                        Dates: ${dates.join(', ')}

                        Task: ${task}
                        Additional information: (Text from the form)

                        Number of TA's requested: ${dates.length}
                    `
                }
            },
            Subject: {
                Data: 'Allocation request',
            },
        },
        Source: 'noreply@lballocations.com', // Replace with sender email address
    };

    try {
        const data = await ses.sendEmail(emailParams).promise();
        console.log('Email sent:', data.MessageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
