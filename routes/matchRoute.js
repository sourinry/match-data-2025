const express = require('express');
const router = express.Router();
const { getAllMatches, 
    getMatch, 
    updateMatchScoreIdAndType, 
    updateisActiveFiled, 
    getAllActiveMatches,
    deleteAll,
    updateScoreTypeForNewMatches,
    updateAllScoreType,
    getAllScoreTypeBySportID
 } = require('../controller/matchController');

//get api for postman porpuse
router.get('/data', getMatch);
//ddelete api for postman
router.delete('/delete', deleteAll)



// POST APIs
//get all inactive data
router.post('/allActiveMatches', getAllActiveMatches);
//routes for update scoretype base on sportid 
router.post('/updateScoreTypeForNewMatches', updateScoreTypeForNewMatches);
//route for update All scoreType
router.post('/updateAllScoreType', updateAllScoreType);
//route for get all scoreType
router.post('/scoreTypes', getAllScoreTypeBySportID);


//get all matches
router.post('/', getAllMatches);
//update scoreType scoreId by using _id
router.post('/:id', updateMatchScoreIdAndType);
//filter isActive
router.post('/updateActiveMatches/:id', updateisActiveFiled);



//route for update bulk update of present data







module.exports = router;
