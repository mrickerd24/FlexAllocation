const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });

exports.handler = async (event) => {
    // Log the event object to check incoming query parameters
    console.log('Event:', JSON.stringify(event));

    const date = event.queryStringParameters ? event.queryStringParameters.date : null;

    if (!date) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Date parameter is missing' }),
        };
    }

    const params = {
        TableName: 'Availabilitytable',
        Key: {
            date: date
        }
    };

    try {
        const result = await dynamodb.get(params).promise();
        const defaultAvailableTA = 22; // Default value

        // Convert availableTA to a number
        const currentAvailableTA = result.Item ? Number(result.Item.availableTA) : 0;

        // Calculate the available TA based on the default value and current value in the table
        const adjustedAvailableTA = defaultAvailableTA + currentAvailableTA;

        // Format the response message
        const responseMessage = `${adjustedAvailableTA} Available`;

        console.log('Result:', JSON.stringify(result));
        console.log('Available TA:', responseMessage);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: responseMessage }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not retrieve data' }),
        };
    }
};
