const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const TIMEOUT = 10000;

app.use(express.static(path.join(__dirname, 'public')));

const F1 = async(message) => {
    return new Promise((resolve) => setTimeout(() => resolve(`LLM1 response to: ${message}`), 10000));
};

const F2 = async(message) => {
    return new Promise((resolve) => setTimeout(() => resolve(`LLM2 response to: ${message}`), 10001));
};

const dummyResponse = "This is a pre-generated dummy message.";

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('sendMessage', async(message) => {
        console.log(`Received message: ${message}`);

        const f1Promise = F1(message);
        const f2Promise = F2(message);

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUT));

        let response;
        try {
            const f1Response = await Promise.race([f1Promise, timeoutPromise]);
            response = f1Response;
        } catch (error) {
            if (error.message === 'Timeout') {
                try {
                    const f2Response = await Promise.race([f2Promise, timeoutPromise]);
                    response = f2Response;
                } catch (error) {
                    if (error.message === 'Timeout') {
                        response = dummyResponse;
                    } else {
                        console.error('Error in F2:', error);
                        response = dummyResponse;
                    }
                }
            } else {
                console.error('Error in F1:', error);
                response = dummyResponse;
            }
        }

        if (socket.connected) {
            socket.emit('receiveMessage', response);
        } else {
            console.log('User disconnected before response could be sent');
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});