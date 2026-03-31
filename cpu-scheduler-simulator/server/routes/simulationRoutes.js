const express = require('express');
const router = express.Router();
const {
  simulate,
  compare,
  getHistory,
  saveSimulation,
  deleteSimulation,
} = require('../controllers/simulationController');

router.post('/simulate', simulate);
router.post('/compare', compare);
router.get('/history', getHistory);
router.post('/save', saveSimulation);
router.delete('/history/:id', deleteSimulation);

module.exports = router;
