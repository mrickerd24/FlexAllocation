import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2)); // Log the event

    let requestData;

    // Check if body exists and parse it
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

    // Validate required fields
    if (!from || !to) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields: 'from' and 'to'" }),
        };
    }

    // Validate date formats
    if (!isValidDate(from) || !isValidDate(to)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid date format. Use YYYY-MM-DD." }),
        };
    }

    // Get list of dates in the range
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
            availability[date] = 22 + availableTA; // Adjust based on your logic
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

// Function to check if a date is in valid format
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    const date = new Date(dateString);
    return dateString.match(regex) !== null && !isNaN(date.getTime());
}

// Function to get all dates in the range
function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}
