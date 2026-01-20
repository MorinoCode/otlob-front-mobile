import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.8.131:3000"; 

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

export default socket;