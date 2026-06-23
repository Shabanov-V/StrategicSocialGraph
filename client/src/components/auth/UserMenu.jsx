import React from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className={styles.userMenu}>
      {user.picture && (
        <img src={user.picture} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
      )}
      <button onClick={logout} className={styles.logoutButton} title="Sign out" aria-label="Sign out">
        ⏻
      </button>
    </div>
  );
}
