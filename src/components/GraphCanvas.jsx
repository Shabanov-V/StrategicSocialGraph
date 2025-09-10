import React, { useState, useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { getCytoscapeStyle } from '../utils/graph-utils';

const GraphCanvas = ({ elements }) => {
  const [selectedNodeInfo, setSelectedNodeInfo] = useState('Кликните на узел для получения информации');
  const cyRef = useRef(null);

  const setupEventListeners = (cy) => {
    cy.on('tap', 'node[type="person"], node[type="center"]', (evt) => {
      const node = evt.target;
      const nodeData = node.data();
      let info = `<strong>${nodeData.name}</strong><br>`;

      if (nodeData.type === 'center') {
          info += `Центральная персона`;
      } else {
          info += `Сектор: ${nodeData.sector}<br>`;
          info += `Круг: ${nodeData.circle}<br>`;
          info += `Важность: ${nodeData.importance}`;
      }
      setSelectedNodeInfo(info);
    });
  };

  useEffect(() => {
    const cy = cyRef.current;
    if (cy) {
      // Fit the graph to the viewport with padding
      cy.fit(null, 30);
    }
  }, [elements]); // Re-fit when elements change

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #eee' }}>
      <CytoscapeComponent
        elements={CytoscapeComponent.normalizeElements(elements)}
        stylesheet={getCytoscapeStyle()}
        style={{ width: '100%', height: '100%' }}
        cy={(cy) => {
          cyRef.current = cy;
          setupEventListeners(cy);
        }}
        layout={{ name: 'preset' }}
        autoungrabify={true}
        zoomingEnabled={true}
        userZoomingEnabled={true}
        panningEnabled={true}
        userPanningEnabled={true}
        minZoom={0.5}
        maxZoom={2}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '20px',
          transform: 'translateX(-50%)',
          padding: '10px',
          border: '1px solid #ccc',
          background: 'rgba(249, 249, 249, 0.9)',
          zIndex: 10,
          minWidth: '250px',
          maxWidth: '400px',
          textAlign: 'center',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
        dangerouslySetInnerHTML={{ __html: selectedNodeInfo }}
      >
      </div>
    </div>
  );
};

export default GraphCanvas;
