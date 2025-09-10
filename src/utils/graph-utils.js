// src/utils/graph-utils.js

// Colors from the original file, can be customized or moved later
const colors = {
    red: "#FF6B6B",
    blue: "#4ECDC4",
    green: "#45B7D1",
    yellow: "#96CEB4",
    purple: "#FFEAA7",
    orange: "#DDA0DD"
};

// This function calculates the (x, y) position for a person node.
// It's extracted directly from the original HTML file.
function calculatePosition(person, data) {
    const sectorAngle = data.layout.sector_distribution[person.sector] || 0;
    const circleRadius = data.layout.circle_radius[person.circle] || 100;

    const peopleInSector = data.people.filter(p => p.sector === person.sector && p.circle === person.circle);
    const idx = peopleInSector.findIndex(p => p.name === person.name);
    const total = peopleInSector.length;

    const sectorSpread = 70; // degrees
    let angleOffset = 0;
    if (total > 1) {
        angleOffset = ((idx + 1) - (total + 1) / 2) * (sectorSpread / (total));
    } else {
        angleOffset = sectorSpread / 4;
    }

    const angle = sectorAngle + angleOffset;
    const angleRad = angle * Math.PI / 180;
    const nodeRadius = circleRadius * 0.7;

    return {
        x: Math.cos(angleRad) * nodeRadius,
        y: Math.sin(angleRad) * nodeRadius
    };
}

// This function creates the full array of elements for Cytoscape.
// It's also extracted and adapted from the original HTML file.
export const processGraphDataForCytoscape = (data) => {
    if (!data || !data.layout || !data.people || !data.layout.sector_distribution || !data.layout.circle_radius) {
        return [];
    }

    const elements = [];

    // Center node
    if (data.center) {
        elements.push({
            data: { id: data.center, name: data.center, type: 'center' },
            position: { x: 0, y: 0 }
        });
    }

    // Sector lines and labels
    const sectorEntries = Object.entries(data.layout.sector_distribution);
    const sectorAngles = sectorEntries.map(([_, angle]) => angle);
    const maxRadius = Math.max(...Object.values(data.layout.circle_radius));

    sectorEntries.forEach(([sectorName, angle], idx) => {
        const angleRad = angle * Math.PI / 180;
        const x = Math.cos(angleRad) * maxRadius;
        const y = Math.sin(angleRad) * maxRadius;
        const guideNodeId = `sector-guide-${idx}`;

        elements.push({
            data: { id: guideNodeId, type: 'sector-guide' },
            position: { x: x, y: y }
        });

        if (data.center) {
            elements.push({
                data: {
                    id: `sector-line-${idx}`,
                    source: data.center,
                    target: guideNodeId,
                    type: 'sector-line'
                }
            });
        }

        let nextIdx = (idx + 1) % sectorAngles.length;
        let startAngle = angle;
        let endAngle = sectorAngles[nextIdx];
        if (endAngle <= startAngle) endAngle += 360;

        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const midAngleRad = midAngle * Math.PI / 180;
        const labelRadius = maxRadius + 30;
        const labelX = Math.cos(midAngleRad) * labelRadius;
        const labelY = Math.sin(midAngleRad) * labelRadius;

        elements.push({
            data: {
                id: `sector-label-${idx}`,
                type: 'sector-label',
                label: sectorName
            },
            position: { x: labelX, y: labelY }
        });
    });

    // Person nodes
    data.people.forEach(person => {
        const pos = calculatePosition(person, data);
        elements.push({
            data: {
                id: person.name,
                name: person.name,
                type: 'person',
                sector: person.sector,
                circle: person.circle,
                importance: person.importance,
                color_group: person.color_group
            },
            position: pos
        });
    });

    // Peer connections
    if (data.peer_connections) {
        data.peer_connections.forEach(conn => {
            elements.push({
                data: {
                    id: `${conn.from}-${conn.to}`,
                    source: conn.from,
                    target: conn.to,
                    strength: conn.strength
                }
            });
        });
    }

    // Guide circles
    Object.values(data.layout.circle_radius).forEach((radius, index) => {
        const points = 64;
        const guideNodeIds = [];
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const nodeId = `circle-${index}-pt-${i}`;
            guideNodeIds.push(nodeId);
            elements.push({
                data: { id: nodeId, type: 'guide' },
                position: { x: x, y: y }
            });
        }
        for (let i = 0; i < points; i++) {
            const source = guideNodeIds[i];
            const target = guideNodeIds[(i + 1) % points];
            elements.push({
                data: {
                    id: `circle-${index}-edge-${i}`,
                    source: source,
                    target: target,
                    type: 'guide-edge'
                }
            });
        }
    });

    return elements;
};

// This function provides the styling rules for Cytoscape.
export const getCytoscapeStyle = () => {
    return [
        {
            selector: 'node[type = "sector-label"]',
            style: {
                'background-opacity': 0, 'label': 'data(label)', 'color': '#444',
                'font-size': '16px', 'font-weight': 'bold', 'text-background-opacity': 1,
                'text-background-color': '#fff', 'text-background-shape': 'roundrectangle',
                'text-border-opacity': 0.2, 'text-border-color': '#ccc', 'text-border-width': 1,
                'text-margin-y': 0, 'z-index': 10
            }
        },
        {
            selector: 'node[type = "center"]',
            style: {
                'background-color': '#333', 'width': 30, 'height': 30,
                'label': 'data(name)', 'color': 'white', 'text-valign': 'center',
                'font-size': '12px', 'font-weight': 'bold'
            }
        },
        {
            selector: 'node[type = "sector-guide"]',
            style: { 'width': 0.1, 'height': 0.1, 'background-color': '#ddd', 'label': '', 'events': 'no', 'opacity': 0.0 }
        },
        {
            selector: 'edge[type = "sector-line"]',
            style: { 'width': 2, 'line-color': '#bbb', 'curve-style': 'straight', 'opacity': 0.8, 'z-index': 0 }
        },
        {
            selector: 'node[type = "person"]',
            style: {
                'background-color': (ele) => colors[ele.data('color_group')] || '#999',
                'width': (ele) => ele.data('importance') === 'important' ? 25 : 20,
                'height': (ele) => ele.data('importance') === 'important' ? 25 : 20,
                'label': 'data(name)', 'color': '#333', 'text-valign': 'bottom',
                'text-margin-y': 5, 'font-size': '11px'
            }
        },
        {
            selector: 'node[type = "guide"]',
            style: { 'width': 0.1, 'height': 0.1, 'background-color': '#ddd', 'label': '', 'events': 'no', 'opacity': 0.0 }
        },
        {
            selector: 'edge[type = "guide-edge"]',
            style: { 'width': 1, 'line-color': '#ddd', 'curve-style': 'straight', 'opacity': 1.0 }
        },
        {
            selector: 'edge',
            style: { 'width': 2, 'line-color': '#666', 'curve-style': 'straight' }
        }
    ];
};
