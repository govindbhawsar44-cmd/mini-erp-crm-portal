"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.loginSchema = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_js_1 = require("../utils/prisma.js");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
    }
    const secret = process.env.JWT_SECRET || 'mini_erp_super_secret_jwt_key_2026';
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    }, secret, { expiresIn: '24h' });
    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};
exports.login = login;
const getMe = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json({ user });
};
exports.getMe = getMe;
