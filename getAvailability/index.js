const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

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
        const availableTA = result.Item ? result.Item.availableTA : 22; // Default to 22 if no result

        console.log('Result:', JSON.stringify(result));
        console.log('Available TA:', availableTA);

        return {
            statusCode: 200,
            body: JSON.stringify({ availableTA }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not retrieve data' }),
        };
    }
};
