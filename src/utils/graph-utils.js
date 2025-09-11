// src/utils/graph-utils.js

function calculatePosition(person, data) {
    const sectorAngle = data.layout.sector_distribution[person.sector] || 0;
    const circleRadiusMap = (data.layout.positioning_rules && data.layout.positioning_rules.circle_radius) || data.layout.circle_radius || {};
    const circleRadius = circleRadiusMap[person.circle] || 100;

    const peopleInSector = data.people.filter(p => p.sector === person.sector && p.circle === person.circle);
    const idx = peopleInSector.findIndex(p => p.name === person.name);
    const total = peopleInSector.length;

    const sectorSpread = data.layout.positioning_rules.angle_spread || 70; // Use from YAML
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

export const processGraphDataForCytoscape = (data) => {
    const circleRadiusMap = data && data.layout && data.layout.positioning_rules && data.layout.positioning_rules.circle_radius
        ? data.layout.positioning_rules.circle_radius
        : data && data.layout && data.layout.circle_radius;
    if (!data || !data.layout || !data.people || !data.layout.sector_distribution || !circleRadiusMap) {
        return [];
    }

    const elements = [];

    if (data.center) {
        elements.push({
            data: { id: data.center, name: data.center, type: 'center' },
            position: { x: 0, y: 0 }
        });
    }

    const sectorEntries = Object.entries(data.layout.sector_distribution);
    const sectorAngles = sectorEntries.map(([_, angle]) => angle);
    const maxRadius = Math.max(...Object.values(circleRadiusMap));

    if (data.display.show_sector_labels) {
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
            const labelRadius = maxRadius + 40; // Increased distance
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
    }

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

    if (data.peer_connections) {
        const visibleConnections = [
            { from: "Мария", to: "Елена" },
            { from: "Петр", to: "Сергей" }
        ];

        data.peer_connections.forEach(conn => {
            const isVisible = visibleConnections.some(vc =>
                (vc.from === conn.from && vc.to === conn.to) ||
                (vc.from === conn.to && vc.to === conn.from)
            );

            if (isVisible) {
                elements.push({
                    data: {
                        id: `${conn.from}-${conn.to}`,
                        source: conn.from,
                        target: conn.to,
                        strength: conn.strength,
                        color_group: conn.color_group
                    }
                });
            }
        });
    }

    if (data.display.show_circles) {
        Object.values(circleRadiusMap).forEach((radius, index) => {
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
    }

    return elements;
};

export const getCytoscapeStyle = (data) => {
    const colors = data?.display?.colors || {};
    const lineStyles = data?.display?.line_styles || {};
    const pointStyles = data?.display?.point_styles || {};

    return [
        {
            selector: 'node[type = "sector-label"]',
            style: {
                'background-opacity': 0, 'label': 'data(label)', 'color': '#444',
                'font-size': '24px', 'font-weight': 'bold',
                'text-margin-y': 0, 'z-index': 10, 'text-halign': 'center', 'text-valign': 'center'
            }
        },
        {
            selector: 'node[type = "center"]',
            style: {
                'background-color': '#333', 'width': 40, 'height': 40,
                'label': 'data(name)', 'color': 'white', 'text-valign': 'center',
                'font-size': '14px', 'font-weight': 'bold'
            }
        },
        {
            selector: 'node[type = "sector-guide"]',
            style: { 'width': 0.1, 'height': 0.1, 'background-color': '#bbb', 'label': '', 'events': 'no', 'opacity': 0.0 }
        },
        {
            selector: 'edge[type = "sector-line"]',
            style: { 'width': 2, 'line-color': '#bbb', 'curve-style': 'straight', 'opacity': 0.8, 'z-index': 0 }
        },
        {
            selector: 'node[type = "person"]',
            style: {
                'background-color': (ele) => colors[ele.data('color_group')] || '#999',
                'width': (ele) => (pointStyles[ele.data('importance')]?.size || 6) * 4,
                'height': (ele) => (pointStyles[ele.data('importance')]?.size || 6) * 4,
                'label': 'data(name)', 'color': '#333', 'text-valign': 'bottom',
                'text-margin-y': 8, 'font-size': '12px', 'font-weight': '500'
            }
        },
        {
            selector: 'node[type = "guide"]',
            style: { 'width': 0.1, 'height': 0.1, 'background-color': '#ddd', 'label': '', 'events': 'no', 'opacity': 0.0 }
        },
        {
            selector: 'edge[type = "guide-edge"]',
            style: { 'width': 2, 'line-color': '#ccc', 'curve-style': 'straight', 'opacity': 1.0 }
        },
        {
            selector: 'edge[source][target]', // Peer connections
            style: {
                'width': (ele) => lineStyles[ele.data('strength')]?.width || 2,
                'line-color': (ele) => colors[ele.data('color_group')] || '#666',
                'curve-style': 'straight',
                'line-style': (ele) => lineStyles[ele.data('strength')]?.style || 'solid'
            }
        }
    ];
};
