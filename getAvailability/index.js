const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const date = event.queryStringParameters.date;

    const params = {
        TableName: 'Availabilitytable',
        Key: {
            date: date
        }
    };

    try {
        const result = await dynamodb.get(params).promise();
        const availableTA = result.Item ? result.Item.availableTA : 22; // Default to 22 if no result

        console.log('Result:', result);
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
