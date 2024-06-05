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
    return new Promise((resolve) => setTimeout(() => resolve(`LLM1 response to: ${message}`), 22000));
};

const F2 = async(message) => {
    return new Promise((resolve) => setTimeout(() => resolve(`LLM2 response to: ${message}`), 72000));
};

const dummyResponse = "This is a pre-generated dummy message.";

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('sendMessage', async(message) => {
        console.log(`Received message: ${message}`);


        const f1Promise = F1(message);
        const f2Promise = F2(message);


        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, TIMEOUT));


        await timeoutPromise;

        let response;
        const f1Response = await Promise.race([f1Promise, timeoutPromise.catch(() => null)]);
        const f2Response = await Promise.race([f2Promise, timeoutPromise.catch(() => null)]);

        if (f1Response) {
            response = f1Response;
        } else if (f2Response) {
            response = f2Response;
        } else {
            response = dummyResponse;
        }


        socket.emit('receiveMessage', response);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});