const mongoose = require('mongoose');

const reservationSchema = mongoose.Schema(
    {
        catwayNumber: {
            type: Number,
            required: true
        },

        clientName: {
            type: String,
            trim: true,
            required: true
        },

        boatName: {
            type: String,
            trim: true,
            required: true
        },

        startDate: {
            type: Date,
            required: true
        }, 

        endDate: {
            type: Date,
            required: true
        }
    }
);

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;