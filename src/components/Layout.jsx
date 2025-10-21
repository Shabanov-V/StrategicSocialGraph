import React, { useState } from 'react';
import styles from './Layout.module.css';
import Sidebar from './Sidebar';

const Layout = ({ left, right }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`${styles.leftPanel} ${!isSidebarOpen ? styles.hidden : ''}`}>
        {left}
      </div>
      <div className={styles.rightPanel}>
        {right}
      </div>
    </div>
  );
};

export default Layout;
