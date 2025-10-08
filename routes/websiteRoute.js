const express = require('express');
const router = express.Router();
const {
    createWebsite,
    getAllWebsite,
    updateWebsiteById,
    deleteWebsiteById
}=require('../controller/websiteController');


//create all routes
//create website
router.post('/create', createWebsite);

//get all website
router.post('/', getAllWebsite);

//update website
router.put('/:id', updateWebsiteById);

//delete website
router.delete('/:id', deleteWebsiteById);


module.exports = router;