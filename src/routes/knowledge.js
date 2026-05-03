const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/articles', knowledgeController.getArticles);
router.get('/articles/:id', knowledgeController.getArticleById);
router.post('/articles', knowledgeController.createArticle);
router.put('/articles/:id', knowledgeController.updateArticle);
router.delete('/articles/:id', knowledgeController.deleteArticle);

module.exports = router;
