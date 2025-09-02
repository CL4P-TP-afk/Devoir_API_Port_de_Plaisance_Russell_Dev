const express = require('express');
const router = express.Router();

const service = require('../services/catways');

const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

// Toutes les routes nécessitent une connexion
router.use(checkJWT, isAdmin);

//route pour lister tout les catways
router.get('/', service.getAll);
// route pour lire les infos d'un catway 
router.get('/:id', service.getById);
//route pour ajouter un catway
router.post('/', service.add);
//route pour modifier un catway
router.put('/:id', service.update);
// route pour supprimer un catway
router.delete('/:id', service.delete);
// route pour une recherche de catway par son numéro
router.post('/search', service.searchByNumber);


module.exports = router;