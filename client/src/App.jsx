import React, { useState, useEffect, useCallback, useRef } from 'react';
import D3Graph from './components/view/D3Graph.jsx';
import Layout from './components/layouts/Layout.jsx';
import InteractivePanel from './components/panels/InteractivePanel.jsx';
import ConnectionEditor from './components/panels/ConnectionEditor.jsx';
import CodePanel from './components/panels/CodePanel.jsx';
import ConfigEditor from './components/panels/ConfigEditor.jsx';
import GoogleLoginButton from './components/auth/GoogleLoginButton.jsx';
import UserMenu from './components/auth/UserMenu.jsx';
import SyncStatus from './components/auth/SyncStatus.jsx';
import ConflictDialog from './components/auth/ConflictDialog.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { useCloudSync } from './hooks/useCloudSync.jsx';
import styles from './App.module.css';
import './App.css';
import { calculateSectorAngles } from './utils/layout-helper.js';
import { read } from './graph-document';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const STORAGE_KEY = 'graphYaml';

function App() {
  const [yamlText, setYamlText] = useState('');
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [yamlError, setYamlError] = useState(null);
  const [conflict, setConflict] = useState(null);
  const postLoginDone = useRef(false);

  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const { syncStatus, fetchGraph, saveGraph, markSyncReady } = useCloudSync(user, yamlText);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached && cached.trim().length > 0) {
        setYamlText(cached);
        return;
      }
    } catch (_e) {
      // fall through
    }

    fetch('/graph.yml')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then(text => {
        setYamlText(text);
        try { localStorage.setItem(STORAGE_KEY, text); } catch (_e) { /* ignore */ }
      })
      .catch(err => {
        console.error("Failed to load initial graph.yml:", err);
        setYamlError(`Failed to load graph.yml: ${err.message}.`);
      });
  }, []);

  const handlePostLogin = useCallback(async () => {
    if (postLoginDone.current) return;
    postLoginDone.current = true;

    const cloudGraph = await fetchGraph();
    const localGraph = localStorage.getItem(STORAGE_KEY);
    const hasLocal = localGraph && localGraph.trim().length > 0;
    const hasCloud = cloudGraph && cloudGraph.trim().length > 0;

    if (hasCloud && hasLocal && cloudGraph !== localGraph) {
      setConflict({ local: localGraph, cloud: cloudGraph });
    } else if (hasCloud) {
      setYamlText(cloudGraph);
      try { localStorage.setItem(STORAGE_KEY, cloudGraph); } catch (_e) { /* ignore */ }
      markSyncReady();
    } else if (hasLocal) {
      await saveGraph(localGraph);
      markSyncReady();
    } else {
      markSyncReady();
    }
  }, [fetchGraph, saveGraph, markSyncReady]);

  useEffect(() => {
    if (user && !authLoading) {
      handlePostLogin().catch(console.error);
    }
  }, [user, authLoading, handlePostLogin]);

  const handleKeepLocal = useCallback(async () => {
    if (conflict) {
      await saveGraph(conflict.local);
      setYamlText(conflict.local);
    }
    setConflict(null);
    markSyncReady();
  }, [conflict, saveGraph, markSyncReady]);

  const handleKeepCloud = useCallback(() => {
    if (conflict) {
      setYamlText(conflict.cloud);
      try { localStorage.setItem(STORAGE_KEY, conflict.cloud); } catch (_e) { /* ignore */ }
    }
    setConflict(null);
    markSyncReady();
  }, [conflict, markSyncReady]);

  useEffect(() => {
    if (!yamlText) return;
    try {
      const data = read(yamlText);
      setGraphData(calculateSectorAngles(data));
      setYamlError(null);
    } catch (e) {
      setYamlError(e.message);
      setGraphData(null);
    }
  }, [yamlText]);

  useEffect(() => {
    if (!yamlText || yamlText.trim().length === 0) return;
    try { localStorage.setItem(STORAGE_KEY, yamlText); } catch (_e) { /* ignore */ }
  }, [yamlText]);

  const choosePanel = () => {
    if (selectedPanel === 'code') {
      return <CodePanel value={yamlText} onChange={setYamlText} error={yamlError} />;
    } else if (selectedPanel === 'interactive') {
      return <InteractivePanel yamlText={yamlText} setYamlText={setYamlText} />;
    } else if (selectedPanel === 'connection') {
      return <ConnectionEditor yamlText={yamlText} setYamlText={setYamlText} />;
    } else if (selectedPanel === 'config') {
      return <ConfigEditor yamlText={yamlText} setYamlText={setYamlText} />;
    }
    return null;
  };

  return (
    <div className={styles.app}>
      <Layout
        setSelectedPanel={setSelectedPanel}
        selectedPanel={selectedPanel}
        left={choosePanel()}
        right={<D3Graph graphData={graphData} />}
        authSlot={
          authLoading ? null : user ? (
            <>
              <SyncStatus status={syncStatus} />
              <UserMenu />
            </>
          ) : (
            <div style={{ padding: '12px 8px' }}>
              <GoogleLoginButton
                clientId={GOOGLE_CLIENT_ID}
                onCredential={loginWithGoogle}
              />
            </div>
          )
        }
      />
      {conflict && (
        <ConflictDialog
          onKeepLocal={handleKeepLocal}
          onKeepCloud={handleKeepCloud}
        />
      )}
    </div>
  );
}

export default App;
