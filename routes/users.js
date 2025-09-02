const express = require('express');
const router = express.Router();

const userService = require('../services/users');
const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

// Toutes les routes sont protégées pour les admins uniquement
router.use(checkJWT, isAdmin);

//route pour lister tous les utilisateurs
router.get('/', userService.getAll);
//route pour une recherche d'utilisateur par son nom
router.get('/search',  userService.searchByName);
//route pour lire les infos d'un utilisateur
router.get('/:id', userService.getById);
//route pour ajouter un utilisateur
router.post('/', userService.add);
//route pour modifier un utilisateur
router.put('/:id', userService.update);
//route pour supprimer un utilisateur
router.delete('/:id', userService.delete);



module.exports = router;
