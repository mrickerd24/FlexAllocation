const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });
const ses = new AWS.SES({ region: 'ca-central-1' });

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    let requestData;
    try {
        // Directly parse the event.body if it's a string
        if (typeof event.body === 'string') {
            requestData = JSON.parse(event.body);
        } else {
            requestData = event.body;
        }
    } catch (error) {
        console.error('Error parsing event body:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid request body' })
        };
    }

    console.log('Parsed request data:', requestData); // Log parsed request data

    // Validate and destructure request data
    if (!requestData) {
        console.error('Request data is undefined');
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Request data is missing' })
        };
    }

    const { dates, name, motive, timeFrame, from, to, requester } = requestData;

    // Validate required fields
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
        console.error('Invalid or missing dates:', dates);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing or invalid dates' })
        };
    }

    // Process each date
    for (const date of dates) {
        const params = {
            TableName: 'Availabilitytable',
            Key: { date },
            UpdateExpression: 'ADD availableTA :decrement',
            ExpressionAttributeValues: { ':decrement': -1 },
            ReturnValues: 'UPDATED_NEW'
        };

        try {
            const result = await dynamodb.update(params).promise();
            console.log(`Updated availability for ${date}:`, result);
        } catch (error) {
            console.error(`Error updating availability for ${date}:`, error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Failed to update availability', error: error.message })
            };
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Time off request processed successfully' })
    };
};
