import pkg from 'aws-sdk';
const { SES } = pkg;

const ses = new SES({ region: 'ca-central-1' }); // Set your region

export async function sendEmail(requester, task) {
    const emailParams = {
        Destination: {
            ToAddresses: ['flex2024@lballocations.com'] // Replace with recipient email address
        },
        Message: {
            Body: {
                Text: {
                    Data: `New allocation request from ${requester} for task ${task}.`
                }
            },
            Subject: {
                Data: 'New Allocation Request'
            }
        },
        Source: 'noreply@lballocations.com' // Replace with sender email address
    };

    try {
        const data = await ses.sendEmail(emailParams).promise();
        console.log('Email sent:', data.MessageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}