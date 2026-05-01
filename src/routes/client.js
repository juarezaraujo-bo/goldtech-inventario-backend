const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware } = require('../middleware/auth');

// Rotas de status sem bloqueio de token (igual ao padrão de equipment)
router.patch('/:id/status', clientController.setStatus);

router.use(authMiddleware);

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.get('/:id/stats', clientController.getInventoryStats);
router.get('/:id/agent-package', clientController.getAgentPackage);
router.post('/', clientController.create);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

module.exports = router;

