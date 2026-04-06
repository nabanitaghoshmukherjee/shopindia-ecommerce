const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/dashboard', require('./dashboard'));
router.use('/products', require('./products'));
router.use('/orders', require('./orders'));
router.use('/customers', require('./customers'));
router.use('/inventory', require('./inventory'));
router.use('/payments', require('./payments'));
router.use('/shipping', require('./shipping'));
router.use('/coupons', require('./coupons'));
router.use('/reviews', require('./reviews'));
router.use('/reports', require('./reports'));
router.use('/settings', require('./settings'));

module.exports = router;
