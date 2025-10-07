/**
 * Modèle Reservation (Mongoose)
 * -----------------------------
 * Réservation d'un catway par un client.
 *
 * Rappels métier (gérés dans les services) :
 * - `clientName` doit exister dans User.name
 * - Le catway doit être réservable (isReservable === true)
 * - Aucun chevauchement de dates pour un même `catwayNumber`
 *
 * @typedef {Object} ReservationDoc
 * @property {string} _id
 * @property {number} catwayNumber
 * @property {string} clientName
 * @property {string} boatName
 * @property {Date} startDate
 * @property {Date} endDate
 */

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