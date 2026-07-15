const { Router } = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');
const { registerSchema, loginSchema, refreshSchema, idParamSchema } = require('../validators/authValidators');

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.get('/users/:id', authenticate, validate(idParamSchema), authController.getUser);

module.exports = router;
