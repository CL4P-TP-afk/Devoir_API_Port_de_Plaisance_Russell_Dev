/**
 * Modèle Catway
 * -------------
 * Un emplacement (catway) au port.
 *
 * @typedef {Object} Catway
 * @property {string} _id         - ObjectId Mongo
 * @property {number} catwayNumber - Numéro unique (>= 1)
 * @property {'long'|'short'} catwayType - Type d’emplacement
 * @property {string} [catwayState] - État libre (texte)
 * @property {boolean} isReservable - Est-ce réservable ? (def. true)
 */


const mongoose = require('mongoose');

const catwaySchema = mongoose.Schema(
    {
        catwayNumber: {
            type: Number,
            required: true,
            unique: true, //modification personnel: impossible d'avoir plusieurs catways qui porte le même nombre 
            min: [1, 'Le numéro du catway doit être un entier positif']
        },

        catwayType: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            enum: ['long', 'short'],
            message: "doit être long or short."
        }, 

        catwayState: {
            type: String,
            trim: true
        },

        isReservable: {
        type: Boolean,
        default: true
        }
    }
);

const Catway = mongoose.model('Catway', catwaySchema);
module.exports = Catway;