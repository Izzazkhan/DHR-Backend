const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');

// Router Files
const patientRouter = require('./routes/patientRoutes');
const edrRouter = require('./routes/edrRoutes');
const pharmRouter = require('./routes/pharmRoutes');
const room = require('./routes/room');
const productionArea = require('./routes/productionArea');
const authRouter = require('./routes/authRoutes');
const staffRouter = require('./routes/staffRoutes');
const senseiRouter = require('./routes/senseiRoutes');
const careStreamRouter = require('./routes/careStreamRoutes');
const labServiceRouter = require('./routes/labServiceRoutes');
const radServiceRouter = require('./routes/radServiceRoutes');
const chiefComplaintRouter = require('./routes/chiefComplaintRoutes');
const cutomerCareRouter = require('./routes/customerCareRoutes');
const dcdFormRouter = require('./routes/dcdFormroutes');

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
app.use(cookieParser());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Mounting Routes
app.use('/api/dhrPatient', patientRouter);
app.use('/api/edr', edrRouter);
app.use('/api/pharm', pharmRouter);
app.use('/api/room', room);
app.use('/api/productionArea', productionArea);
app.use('/api/auth', authRouter);
app.use('/api/staff', staffRouter);
app.use('/api/careStream', careStreamRouter);
app.use('/api/labService', labServiceRouter);
app.use('/api/radService', radServiceRouter);
app.use('/api/chiefComplaint', chiefComplaintRouter);
app.use('/api/customerCare', cutomerCareRouter);
app.use('/api/dcdForm', dcdFormRouter);
app.use('/api/sensei', senseiRouter)
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
