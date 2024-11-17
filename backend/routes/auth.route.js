import { Router } from 'express';

const router = Router();

router.get('/signup', async (req, res) => {});
router.get('/login', async (req, res) => {});
router.get('/logout', async (req, res) => {});

export { router as authRoutes };
