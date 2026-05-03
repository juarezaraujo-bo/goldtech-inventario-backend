const express = require('express');
const router = express.Router();
const intranetController = require('../controllers/intranetController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/documents', intranetController.getDocuments);
router.get('/documents/:id', intranetController.getDocumentById);
router.post('/documents', intranetController.createDocument);
router.put('/documents/:id', intranetController.updateDocument);
router.delete('/documents/:id', intranetController.deleteDocument);

module.exports = router;
