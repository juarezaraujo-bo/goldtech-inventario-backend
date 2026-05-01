const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Tenta obter o token do Header ou da Query
    let token = req.headers['authorization']?.split(' ')[1] || req.headers['x-access-token'] || req.query.token;

    if (!token) {
        console.warn("AUTH: Token não fornecido");
        return res.status(401).json({ 
            success: false, 
            message: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'goldtech_secret_key');
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        console.error("AUTH: Token inválido", err.message);
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid token',
            message: 'Sessão expirada ou token inválido' 
        });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            error: 'Require Admin Role',
            message: 'Acesso restrito a administradores'
        });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };
