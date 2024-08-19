const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });

exports.handler = async (event) => {
    // Handle preflight OPTIONS request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Replace "*" with your domain if needed
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify({ message: "Preflight check successful" })
        };
    }

    console.log('Event:', JSON.stringify(event));

    const date = event.queryStringParameters ? event.queryStringParameters.date : null;

    if (!date) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify({ error: 'Date parameter is missing' }),
        };
    }

    const params = {
        TableName: 'Availabilitytable',
        Key: { date }
    };

    try {
        const result = await dynamodb.get(params).promise();
        const defaultAvailableTA = 22;
        const currentAvailableTA = result.Item ? Number(result.Item.availableTA) : 0;
        const adjustedAvailableTA = defaultAvailableTA + currentAvailableTA;
        const responseMessage = `${adjustedAvailableTA} Available`;

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify({ message: responseMessage }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify({ error: 'Could not retrieve data' }),
        };
    }
};
