const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../models/db');

exports.login = (req, res) => {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    db.get("SELECT * FROM users WHERE email = ? OR username = ?", [loginIdentifier, loginIdentifier], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error on the server' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'goldtech_secret_key',
            { expiresIn: 86400 } // 24 hours
        );

        res.status(200).json({
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
};

exports.me = (req, res) => {
    db.get("SELECT id, name, email, role FROM users WHERE id = ?", [req.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error on the server' });
        }
        res.status(200).json(user);
    });
};
