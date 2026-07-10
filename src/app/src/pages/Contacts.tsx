import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactsAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Contacts.css';

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const load = () => contactsAPI.getAll().then(r => setContacts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.phone) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      await contactsAPI.add(form);
      toast.success('Contact added!');
      setForm({ name: '', phone: '' });
      setShowAdd(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add contact');
    } finally { setLoading(false); }
  };

  const handleFav = async (id: string) => {
    await contactsAPI.toggleFavorite(id).catch(() => {});
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this contact?')) return;
    await contactsAPI.delete(id).then(() => { toast.success('Deleted'); load(); }).catch(() => {});
  };

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const favorites = filtered.filter(c => c.is_favorite);
  const others = filtered.filter(c => !c.is_favorite);

  return (
    <div className="contacts">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="page-title">Contacts</span>
        <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>+</button>
      </div>

      <div className="contacts-content">
        <input
          className="search-input"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {showAdd && (
          <div className="add-contact-form">
            <h3>Add Contact</h3>
            <div className="form-group">
              <label>Name</label>
              <input placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input placeholder="70000000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} type="tel" />
            </div>
            <button className="btn-primary" onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="contacts-section">
            <div className="section-title">⭐ Favorites</div>
            {favorites.map(c => (
              <ContactCard key={c.id} contact={c} onFav={handleFav} onDelete={handleDelete} onSend={() => navigate(`/transfers?phone=${c.phone}`)} />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div className="contacts-section">
            <div className="section-title">All Contacts</div>
            {others.map(c => (
              <ContactCard key={c.id} contact={c} onFav={handleFav} onDelete={handleDelete} onSend={() => navigate(`/transfers?phone=${c.phone}`)} />
            ))}
          </div>
        )}

        {contacts.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <p>No contacts yet. Add your first contact!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ContactCard = ({ contact, onFav, onDelete, onSend }: any) => (
  <div className="contact-card">
    <div className="contact-avatar">{contact.name[0]?.toUpperCase()}</div>
    <div className="contact-info">
      <div className="contact-name">{contact.name}</div>
      <div className="contact-phone">{contact.phone}</div>
    </div>
    <div className="contact-actions">
      <button className="icon-btn" onClick={() => onSend()} title="Send money">💸</button>
      <button className="icon-btn" onClick={() => onFav(contact.id)} title="Favorite">
        {contact.is_favorite ? '⭐' : '☆'}
      </button>
      <button className="icon-btn danger" onClick={() => onDelete(contact.id)} title="Delete">🗑️</button>
    </div>
  </div>
);

export default Contacts;
