const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const errorHandler = require('./middleware/error');
const webRTCSocket = require('./lib/socket');

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
const customerCareRouter = require('./routes/customerCareRoutes');
const flagRouter = require('./routes/flagRoutes');
const communicationRouter = require('./routes/communicationRoutes');
const patientTransferEDEOURoutes = require('./routes/patientTransferEDEOURoutes');
const patientClearance = require('./routes/patientClearance');
const codes = require('./routes/codes');
const radRequest = require('./routes/radRequest');
const labRequest = require('./routes/labRequest');
const houseKeeperRequest = require('./routes/houseKeeperRequest');
const socialWorker = require('./routes/socialWorker');
const item = require('./routes/item');
const nurseTechnician = require('./routes/nurseTechnicianRequest');
const edNurse = require('./routes/edNurse');
const eouNurse = require('./routes/eouNurse');
const paramedics = require('./routes/paramedicstRoutes');
const insurance = require('./routes/insurance');
const preApproval = require('./routes/preApprovalInsurance');
const RC = require('./routes/reimbursementClaim');
const shift = require('./routes/shift');
const reports = require('./routes/reports');
const adminDashboard = require('./routes/adminDashboard');
const dcdFormRouter = require('./routes/dcdFormroutes');
const ChatModel = require('./models/chatRoom/chatRoom');
const Notification = require('./models/notification/notification');
// const webRTCSocket = require('./lib/socket');
const chatRouter = require('./routes/chatRoutes');
const anesthesiaRequestRoutes = require('./routes/anesthesiaRequestRoutes');
const consultationNotesRoutes = require('./routes/consultationNotesRoutes');
const reconciliationNotesRoutes = require('./routes/reconciliationNotesRoutes');
const senseiAssistanceReqRoutes = require('./routes/senseiAssistanceReqRoutes');
const subscriber = require('./routes/subscriber');
const codeBlue = require('./routes/codeBlue');
const notification = require('./routes/notification');
const EDR = require('./models/EDR/EDR');
const Flag = require('./models/flag/Flag');
const newCC = require('./routes/newChiefComplaint');
const EOU = require('./routes/EOU');
const bed = require('./routes/bed');
const transferOfCare = require('./routes/transferOfCare');
const CronFlag = require('./models/CronFlag');

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
app.use('/api/item', item);
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
app.use('/api/customerCare', customerCareRouter);
app.use('/api/dcdForm', dcdFormRouter);
app.use('/api/sensei', senseiRouter);
app.use('/api/chatroom', chatRouter);
app.use('/api/flag', flagRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/patientTransfer', patientTransferEDEOURoutes);
app.use('/api/patientclearance', patientClearance);
app.use('/api/codes', codes);
app.use('/api/insurance', insurance);
app.use('/api/par', preApproval);
app.use('/api/reimbursementclaim', RC);
app.use('/api/radRequest', radRequest);
app.use('/api/labRequest', labRequest);
app.use('/api/houseKeeper', houseKeeperRequest);
app.use('/api/socialWorker', socialWorker);
app.use('/api/anesthesiarequest', anesthesiaRequestRoutes);
app.use('/api/consultationNotes', consultationNotesRoutes);
app.use('/api/reconciliationNotes', reconciliationNotesRoutes);
app.use('/api/nurseTechnician', nurseTechnician);
app.use('/api/edNurse', edNurse);
app.use('/api/eouNurse', eouNurse);
app.use('/api/paramedics', paramedics);
app.use('/api/shift', shift);
app.use('/api/reports', reports);
app.use('/api/adminDashboard', adminDashboard);
app.use('/api/senseiAssistanceRequest', senseiAssistanceReqRoutes);
app.use('/api/subscriber', subscriber);
app.use('/api/codeBlue', codeBlue);
app.use('/api/notifications', notification);
app.use('/api/newCC', newCC);
app.use('/api/eou', EOU);
app.use('/api/bed', bed);
app.use('/api/transferOfCare', transferOfCare);
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

// Cron Job For Flags

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
  const time = Date.now();
  //   console.log(time);
  const flags = CronFlag.find({
    taskFlagTime: { $lte: time },
    status: { $ne: 'completed' },
  });

  console.log(flags);
});

const PORT = process.env.PORT || 8080;
const portChat = 4001;
const portWebRtc = 4002;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
const serverSocket1 = http.createServer(app);
const io1 = socketIO(serverSocket1);

const serverSocket2 = http.createServer(app);

require('./components/socket')(io1);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

global.globalVariable = { io: io1 };

serverSocket1.listen(portChat, () =>
  console.log(`Socket for chat is listening on port ${portChat}`)
);
serverSocket2.listen(portWebRtc, () => {
  webRTCSocket(serverSocket2);
  console.log(`Socket for webrtc is listening on port ${portWebRtc}`);
});

// Handling unhandled Rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection, Shutting Down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
