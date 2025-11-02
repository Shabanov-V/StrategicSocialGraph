import React, { useState } from 'react';
import styles from './Layout.module.css';
import Sidebar from './Sidebar';

const Layout = ({ left, right, setSelectedPanel, selectedPanel }) => {
  const isSidebarOpen = selectedPanel !== null;
  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} selectedPanel={selectedPanel} setSelectedPanel={setSelectedPanel} />
      <div className={`${styles.leftPanel} ${isSidebarOpen ? '' : styles.hidden}`}>
        {left}
      </div>
      <div className={styles.rightPanel}>
        {right}
      </div>
    </div>
  );
};

export default Layout;
