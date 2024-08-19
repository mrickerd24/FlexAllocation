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

    const { requester, task, dates } = requestData;

    if (!requester || !task || !dates || !Array.isArray(dates) || dates.length === 0) {
        console.error('Missing required fields:', { requester, task, dates });
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing or invalid required fields" }),
        };
    }

    try {
        for (const date of dates) {
            // Step 1: Get the current value of availablePeople
            const getParams = {
                TableName: 'Availabilitytable',
                Key: { date },
            };

            const result = await dynamoDb.get(getParams).promise();
            let availablePeople = 22; // Default value

            if (result.Item && result.Item.availablePeople !== undefined) {
                availablePeople = result.Item.availablePeople;
                console.log(`Date ${date} exists with availablePeople: ${availablePeople}`);
            } else {
                console.log(`Date ${date} does not exist. Initializing with default value: ${availablePeople}`);
            }

            // Step 2: Prevent decrementing if availablePeople is less than or equal to zero
            if (availablePeople <= 0) {
                console.log(`No available people left for ${date}. Skipping update.`);
                continue; // Skip to the next date
            }

            // Step 3: Update the value of availablePeople
            const updateParams = {
                TableName: 'Availabilitytable',
                Key: { date },
                UpdateExpression: 'SET availablePeople = :newValue',
                ExpressionAttributeValues: { ':newValue': availablePeople - 1 },
                ReturnValues: 'UPDATED_NEW',
            };

            const updateResult = await dynamoDb.update(updateParams).promise();
            console.log(`Update result for ${date}:`, updateResult);
        }

        await sendEmail(requester, task);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Request processed successfully" }),
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to process request",
                error: error.message
            }),
        };
    }
};

async function sendEmail(requester, task) {
    const emailParams = {
        Destination: {
            ToAddresses: ['flex2024@lballocations.com']
        },
        Message: {
            Body: {
                Text: {
                    Data: `New allocation request from ${requester} for task ${task}.`
                }
            },
            Subject: {
                Data: 'New Allocation Request'
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
