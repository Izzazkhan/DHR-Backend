const mongoose = require('mongoose');
const PASchema = new mongoose.Schema({
	  paId: { type: String },
    paName:{ type: String },
    rooms:[{
       roomId:{
         type:mongoose.Schema.ObjectId,
         ref:"room"
        },
       availability:{type:Boolean},
       status:{type:String},
       updateRecord: [
        {
          updatedAt: {
            type: Date,
          },
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'Staff',
          },
          reason: {
            type: String,
          },
        },
      ],
    }],
    availability:{type:Boolean},
    disabled:{type:Boolean},
    status:{type:String},
    updateRecord: [
        {
          updatedAt: {
            type: Date,
          },
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'Staff',
          },
          reason: {
            type: String,
          },
        },
      ],
},
  {
    timestamps: true,
  }
  );
module.exports = mongoose.model('productionArea', PASchema);
