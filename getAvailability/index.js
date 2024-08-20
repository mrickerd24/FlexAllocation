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
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify({ message: "Preflight check successful" })
        };
    }

    console.log('Event:', JSON.stringify(event));

    let dates;

    // Check if request has a body (for POST) or uses queryStringParameters (for GET)
    if (event.body) {
        // For POST requests
        try {
            const requestData = JSON.parse(event.body);
            dates = requestData.dates;
        } catch (error) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
                },
                body: JSON.stringify({ error: 'Invalid JSON in request body' }),
            };
        }
    } else if (event.queryStringParameters && event.queryStringParameters.date) {
        // For GET requests
        dates = [event.queryStringParameters.date];
    } else {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify({ error: 'No date provided in request' }),
        };
    }

    if (!dates || dates.length === 0) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify({ error: 'Dates parameter is missing or empty' }),
        };
    }

    const defaultAvailableTA = 22;
    let availabilityResults = {};

    try {
        // Loop through each date to get availability
        for (const date of dates) {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date }
            };

            const result = await dynamodb.get(params).promise();
            const currentAvailableTA = result.Item ? Number(result.Item.availablePeople) : 0;
            const adjustedAvailableTA = defaultAvailableTA + currentAvailableTA;

            availabilityResults[date] = adjustedAvailableTA;
        }

        console.log('Response:', JSON.stringify(availabilityResults));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify(availabilityResults),
        };
    } catch (error) {
        console.error('Error fetching availability:', error);

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify({ error: 'Could not retrieve availability data' }),
        };
    }
};
