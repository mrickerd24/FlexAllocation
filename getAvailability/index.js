const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });

const DEFAULT_AVAILABLE_TA = 22; // Default number of available TAs

exports.handler = async (event) => {
    const requestData = JSON.parse(event.body);
    const { dates } = requestData;

    if (!dates || dates.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "No dates provided" }),
            headers: {
                "Access-Control-Allow-Origin": "https://mrickerd24.github.io",
                "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            }
        };
    }

    try {
        const results = {};
        for (const date of dates) {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date },
            };

            const data = await dynamoDb.get(params).promise();
            const retrievedTA = data.Item ? data.Item.availableTA : 0; // Default to 0 if no data is found
            results[date] = DEFAULT_AVAILABLE_TA + retrievedTA;
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "https://mrickerd24.github.io",
                "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify(results),
        };
    } catch (error) {
        console.error('Error fetching availability:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "https://mrickerd24.github.io",
                "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify({ error: "Could not retrieve availability data" }),
        };
    }
};
