const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'ca-central-1' });

exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const requestData = JSON.parse(event.body);
    console.log("Parsed request data:", requestData);

    const { from, to } = requestData;
    if (!from || !to) {
        console.log("Missing required fields");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields" }),
        };
    }

    try {
        const dates = getDates(new Date(from), new Date(to));
        console.log("Dates to process:", dates);
        let availability = {};

        for (const date of dates) {
            const params = {
                TableName: 'Availabilitytable',
                Key: { date },
            };
            console.log(`Fetching availability for date: ${date}`);
            const result = await dynamoDb.get(params).promise();
            
            // Log the result from DynamoDB
            console.log(`DynamoDB result for ${date}:`, result);

            // Use 0 if retrieved number is null or negative
            const retrievedNumber = result.Item && result.Item.availableTA !== undefined ? result.Item.availableTA : 0;
            const validRetrievedNumber = Math.max(retrievedNumber, 0); // Ensure it's not negative
            // Calculate available TA
            const availableTA = 22 + validRetrievedNumber;

            // Store the available TA
            availability[date] = availableTA;
        }

        console.log("Availability data:", availability);
        return {
            statusCode: 200,
            body: JSON.stringify(availability),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to process request",
                error: error.message
            }),
        };
    }
};

// Helper function to get dates between from and to
function getDates(startDate, endDate) {
    let dates = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
        dates.push(formatDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

function formatDate(date) {
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    let year = date.getFullYear();
    return `${year}-${month}-${day}`;
}
