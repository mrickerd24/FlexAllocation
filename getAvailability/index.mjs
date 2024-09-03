import pkg from 'aws-sdk';
const { DynamoDB } = pkg;

const dynamoDb = new DynamoDB.DocumentClient({ region: 'ca-central-1' });

export const handler = async (event) => {
    // Parse request body
    let requestData;
    try {
        requestData = JSON.parse(event.body);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON format" }),
        };
    }

    // Extract fields from request data
    const { from, to } = requestData;

    // Validate required fields
    if (!from || !to) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields: 'from' and 'to'" }),
        };
    }

    console.log('Request Data:', requestData);

    try {
        // Initialize response object
        const response = {};

        // Get the availability for each date in the range
        const startDate = new Date(from);
        const endDate = new Date(to);
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = formatDate(currentDate);
            const params = {
                TableName: 'Availabilitytable',
                Key: { date: dateKey },
                ProjectionExpression: 'availablePeople',
            };

            const result = await dynamoDb.get(params).promise();
            response[dateKey] = result.Item ? result.Item.availablePeople : 22;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            statusCode: 200,
            body: JSON.stringify(response),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to process request",
                error: error.message,
            }),
        };
    }
};

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}
