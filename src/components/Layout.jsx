import React from 'react';
import Toolbar from './Toolbar';
import styles from './Layout.module.css';

const Layout = ({ left, right, isEditorVisible, onToggleEditor }) => {
  return (
    <div className={styles.layout}>
      <Toolbar onToggleEditor={onToggleEditor} />
      <div className={`${styles.leftPanel} ${isEditorVisible ? '' : styles.leftPanelHidden}`}>
        {left}
      </div>
      <div className={`${styles.rightPanel} ${isEditorVisible ? '' : styles.rightPanelExpanded}`}>
        {right}
      </div>
    </div>
  );
};

export default Layout;
