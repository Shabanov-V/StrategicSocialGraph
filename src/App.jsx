import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import Editor from './components/Editor';
import GraphCanvas from './components/GraphCanvas';
import Layout from './components/Layout';
import { processGraphDataForCytoscape } from './utils/graph-utils';
import styles from './App.module.css';
import './App.css';

function App() {
  const [yamlText, setYamlText] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [cytoscapeElements, setCytoscapeElements] = useState([]);
  const [yamlError, setYamlError] = useState(null);
  const STORAGE_KEY = 'graphYaml';

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached && cached.trim().length > 0) {
        setYamlText(cached);
        return;
      }
    } catch (e) {
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
        } catch (e) {
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
      setGraphData(data);
      const elements = processGraphDataForCytoscape(data);
      setCytoscapeElements(elements);
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
    } catch (e) {
      // Ignore storage errors
    }
  }, [yamlText]);

  const editorPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, position: 'relative' }}>
         <Editor value={yamlText} onChange={setYamlText} />
      </div>
      {yamlError && (
        <div className={styles.errorPanel}>
          <strong>Error parsing YAML:</strong>
          <pre style={{ margin: 0, paddingTop: '5px' }}>{yamlError}</pre>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.app}>
      <h1 className={styles.title}>Диаграмма социальных связей</h1>
      <Layout
        left={editorPanel}
        right={<GraphCanvas elements={cytoscapeElements} graphData={graphData} />}
      />
    </div>
  );
}

export default App;
