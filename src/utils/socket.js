import io from 'socket.io-client';

const port = 5003;
const socket = io(`http://localhost:${port}`); // Single instance of socket connection

export default socket;
