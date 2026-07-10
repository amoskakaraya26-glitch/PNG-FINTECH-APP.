import { Router } from 'express';
import { getContacts, addContact, toggleFavorite, deleteContact } from '../controllers/contacts.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.get('/', authenticate, getContacts);
router.post('/', authenticate, addContact);
router.put('/:id/favorite', authenticate, toggleFavorite);
router.delete('/:id', authenticate, deleteContact);
export default router;
