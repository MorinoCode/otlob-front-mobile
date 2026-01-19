import { io } from "socket.io-client";

// آدرس آی‌پی سیستم خودت یا آدرس سرور را اینجا بزن
const SOCKET_URL = "http://192.168.1.10:3000"; 

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

export default socket;