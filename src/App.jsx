import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import D3Graph from './components/D3Graph.jsx';
import Layout from './components/Layout';
import InteractivePanel from './components/InteractivePanel';
import ConnectionEditor from './components/ConnectionEditor.jsx';
import DisplayPanel from './components/DisplayPanel.jsx';
import CodePanel from './components/CodePanel';
import styles from './App.module.css';
import './App.css';
import { calculateSectorAngles } from './utils/layout-helper.js';

function App() {
  const [yamlText, setYamlText] = useState('');
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [yamlError, setYamlError] = useState(null);
  const STORAGE_KEY = 'graphYaml';

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached && cached.trim().length > 0) {
        setYamlText(cached);
        return;
      }
    } catch (_e) {
      // If localStorage is unavailable, fall back to fetch
    }

    fetch('/graph.yml')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then(text => {
        setYamlText(text);
        try {
          localStorage.setItem(STORAGE_KEY, text);
        } catch (_e) {
          // Ignore storage errors
        }
      })
      .catch(err => {
        console.error("Failed to load initial graph.yml:", err);
        setYamlError(`Failed to load graph.yml: ${err.message}.`);
      });
  }, []);

  useEffect(() => {
    if (!yamlText) return;
    try {
      const data = yaml.load(yamlText);
      setGraphData(calculateSectorAngles(data));
      setYamlError(null);
    } catch (e) {
      setYamlError(e.message);
      setGraphData(null);
    }
  }, [yamlText]);

  useEffect(() => {
    if (!yamlText || yamlText.trim().length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, yamlText);
    } catch (_e) {
      // Ignore storage errors
    }
  }, [yamlText]);

  const choosePanel = () => {
    if (selectedPanel === 'code') {
      return <CodePanel value={yamlText} onChange={setYamlText} error={yamlError} />;
    } else if (selectedPanel === 'interactive') {
      return <InteractivePanel yamlText={yamlText} setYamlText={setYamlText} />;
    } else if (selectedPanel === 'connection') {
      return <ConnectionEditor yamlText={yamlText} setYamlText={setYamlText} />;
    } else if (selectedPanel === 'display') {
      return <DisplayPanel yamlText={yamlText} setYamlText={setYamlText} />;
    }
    return null;
  }

  return (
    <div className={styles.app}>
      <Layout
        setSelectedPanel={setSelectedPanel}
        selectedPanel={selectedPanel}
        left={choosePanel()}
        right={<D3Graph graphData={graphData} />}
      />
    </div>
  );
}

export default App;
