import { Router, Request, Response } from 'express';
import { SavisService } from '../../integrations/savis/service';

const router = Router();
const savisService = new SavisService();

// Initiate KYC
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await savisService.initiateVerification(phone, name);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Verify callback
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { sessionId, result } = req.body;
    const verification = await savisService.verifyCallback(sessionId, result);
    res.json({ success: true, verification });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;