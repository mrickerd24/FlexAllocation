const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });

exports.handler = async (event) => {
    // Handle preflight OPTIONS request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "https://mrickerd24.github.io", // Frontend domain
                "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify({ message: "Preflight check successful" })
        };
    }

    console.log('Event:', JSON.stringify(event));

    let dates;

    // Handle both POST and GET methods
    if (event.body) {
        try {
            const requestData = JSON.parse(event.body);
            dates = requestData.dates;
        } catch (error) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "https://mrickerd24.github.io",
                    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
                },
                body: JSON.stringify({ error: 'Invalid JSON in request body' }),
            };
        }
    } else if (event.queryStringParameters && event.queryStringParameters.date) {
        // If using GET method with query parameters
        dates = [event.queryStringParameters.date];
        
        // Example: Convert MM-DD-YYYY to YYYY-MM-DD
        const [month, day, year] = dates[0].split('-');
        dates[0] = `${year}-${month}-${day}`;
    } else {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "https://mrickerd24.github.io",
                "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify({ error: 'No dates provided in request' }),
        };
    }

    if (!dates || dates.length === 0) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "https://mrickerd24.github.io",
                "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
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
            const adjustedAvailableTA = defaultAvailableTA + currentAvailableTA; // Corrected calculation

            availabilityResults[date] = adjustedAvailableTA;
        }

        console.log('Response:', JSON.stringify(availabilityResults));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "https://mrickerd24.github.io",
                "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            },
            body: JSON.stringify(availabilityResults),
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
            body: JSON.stringify({ error: 'Could not retrieve availability data' }),
        };
    }
};
