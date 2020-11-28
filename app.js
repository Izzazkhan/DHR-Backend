const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const errorHandler = require('./middleware/error');

// Router Files
const patientRouter = require('./routes/patientRoutes');
const edrRouter = require('./routes/edrRoutes');
const pharmRouter = require('./routes/pharmRoutes');
const roomRouter = require('./routes/roomsRoutes');

const app = express();

//	Handling Uncaught Exception
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception, Shutting Down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config/config.env' });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Mounting Routes
app.use('/api/dhrPatient', patientRouter);
app.use('/api/edr', edrRouter);
app.use('/api/pharm', pharmRouter);
app.use('/api/room', roomRouter);

app.use(errorHandler);

const DB = process.env.MONGO_URI;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DataBase connected Successfully'));

const PORT = process.env.PORT || 8080;
const portChat = 4001;

const server = app.listen(PORT, () =>
  console.log(
    `Server is running on PORT: ${PORT} in ${process.env.NODE_ENV} mode`
  )
);

const socketServer = http.createServer(app);
const io = socketIO(socketServer);
io.origins('*:*');

io.on('connection', (socket) => {
  console.log('chat user connected');
  socket.on('disconnect', () => {
    console.log('chat user disconnected');
  });
});

global.globalVariable = { io: io };

socketServer.listen(portChat, () =>
  console.log(`Socket for chat is listening on : ${portChat}`)
);
// Handling unhandled Rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection, Shutting Down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
