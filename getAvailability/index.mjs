import AWS from 'aws-sdk';
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });

export const handler = async (event) => {
    let requestData;

    // Check if event.body is present
    try {
        if (event.body) {
            requestData = JSON.parse(event.body);
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing request body" }),
            };
        }
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON format" }),
        };
    }

    const { from, to } = requestData;

    // Check if required fields are present
    if (!from || !to) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields" }),
        };
    }

    const dates = getDatesInRange(from, to);
    const availability = {};

    // Fetch availability for each date
    for (const date of dates) {
        try {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date },
            };
            const result = await dynamoDb.get(params).promise();
            const availableTA = result.Item ? result.Item.availableTA : 0;
            availability[date] = 22 + availableTA; // Default to 22 + fetched value
        } catch (error) {
            console.error(`Error fetching data for ${date}:`, error);
            availability[date] = 22; // Default if there's an error
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify(availability),
    };
};

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}
