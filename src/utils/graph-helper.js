// src/utils/graph-utils.js

function hashToUnit(name) {
    let h = 2166136261 >>> 0; // FNV-1a
    for (let i = 0; i < name.length; i++) {
        h ^= name.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295; // [0,1)
}

function calculatePosition(person, data) {
    const defaultSectorAngle = data.layout.sector_distribution[person.sector] || 0;
    const circleRadiusMap = (data.layout.positioning_rules && data.layout.positioning_rules.circle_radius) || data.layout.circle_radius || {};

    const peopleInSector = data.people.filter(p => p.sector === person.sector && p.circle === person.circle);
    const idx = peopleInSector.findIndex(p => p.name === person.name);
    const total = Math.max(peopleInSector.length, 1);

    // Prefer dynamic per-sector spread/center if computed
    const dynamicSpread = data._computed?.sectorSpreads?.[person.sector];
    const dynamicCenter = data._computed?.sectorCenters?.[person.sector];
    const sectorSpreadDeg = dynamicSpread ?? (data.layout.positioning_rules.angle_spread || 70);
    const sectorCenterDeg = dynamicCenter ?? defaultSectorAngle;

    // Determine base circle radius and dynamically expand it to avoid overlaps
    const sharedRadius = data._computed?.circleRadii?.[person.sector]?.[person.circle];
    const baseCircleRadius = sharedRadius ?? (circleRadiusMap[person.circle] || 100);
    const pointStyles = (data && data.display && data.display.point_styles) || {};
    const baseSize = (pointStyles[person.importance]?.size || pointStyles["normal"]?.size || 6);
    const nodeDiameterPx = (baseSize * 4);
    const paddingFactor = 1.4;
    // Estimate how many nodes fit per row within sector spread
    const perNodeAngleDegEstimate = (nodeDiameterPx * paddingFactor) / (baseCircleRadius * 0.7) * (180 / Math.PI);
    const maxPerRow = Math.max(1, Math.floor(sectorSpreadDeg / Math.max(perNodeAngleDegEstimate, 1e-3)));
    const rows = Math.max(1, Math.ceil(total / maxPerRow));

    // Compute this node's row and column
    const rowIndex = Math.floor(idx / maxPerRow);
    const isLastRow = rowIndex === (rows - 1);
    const itemsBeforeLastRow = (rows - 1) * maxPerRow;
    const colsInRow = isLastRow ? (total - itemsBeforeLastRow) : maxPerRow;
    let colIndex = idx - rowIndex * maxPerRow; // 0..colsInRow-1 (last row may be shorter)
    // Snake ordering: reverse direction on every other row for better label spacing
    if (rowIndex % 2 === 1) {
        colIndex = (colsInRow - 1) - Math.min(colIndex, colsInRow - 1);
    }

    // Angle placement for this row
    const innerMarginDeg = 3;
    const halfSpread = Math.max(0, (sectorSpreadDeg / 2) - innerMarginDeg);
    const angleInRow = -halfSpread + (2 * halfSpread) * ((colIndex + 0.5) / colsInRow);
    const angle = sectorCenterDeg + angleInRow;
    const angleRad = angle * Math.PI / 180;
    let nodeRadius = baseCircleRadius * 0.7;

    // Radial placement for rows: spread within [0.6, 0.85] of circle radius
    if (rows > 1) {
        const minFactor = 0.6;
        const maxFactor = 0.85;
        const t = rows === 1 ? 0.5 : (rowIndex / (rows - 1));
        const factor = minFactor + (maxFactor - minFactor) * t;
        nodeRadius = baseCircleRadius * factor;
    }

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

    // Compute dynamic per-sector centers and spreads so nodes fit inside wedges
    const sectorEntries = Object.entries(data.layout.sector_distribution)
        .sort((a, b) => a[1] - b[1]);
    const sectorAngles = sectorEntries.map(([_, angle]) => angle);

    const pointStyles = (data && data.display && data.display.point_styles) || {};
    const defaultSize = (pointStyles["normal"]?.size || 6);
    const paddingFactorBetweenNodes = 1.4;
    const boundaryMarginDeg = 10; // visual margin from sector lines
    const minSectorSpreadDeg = 70;

    const peopleBySector = new Map();
    data.people.forEach(p => {
        if (!peopleBySector.has(p.sector)) peopleBySector.set(p.sector, []);
        peopleBySector.get(p.sector).push(p);
    });

    const computed = { sectorCenters: {}, sectorSpreads: {}, circleRadii: {} };

    sectorEntries.forEach(([sectorName, startAngle], idx) => {
        const nextIdx = (idx + 1) % sectorAngles.length;
        let endAngle = sectorAngles[nextIdx];
        if (endAngle <= startAngle) endAngle += 360;
        const wedgeSize = endAngle - startAngle; // full sector gap between boundary rays

        const sectorPeople = peopleBySector.get(sectorName) || [];
        const count = Math.max(sectorPeople.length, 1);

        // Estimate node diameter to space items
        let maxSize = defaultSize;
        sectorPeople.forEach(p => {
            const s = pointStyles[p.importance]?.size || defaultSize;
            if (s > maxSize) maxSize = s;
        });
        const nodeDiameterPx = maxSize * 4;

        // Use circle 1 baseline radius for spacing estimate
        const baseCircleRadius = circleRadiusMap[1] || 100;
        const nodeRadius = baseCircleRadius * 0.7;

        const perNodeAngleDeg = (nodeDiameterPx * paddingFactorBetweenNodes) / nodeRadius * (180 / Math.PI);
        const requiredSpreadDeg = Math.max(minSectorSpreadDeg, count * perNodeAngleDeg);

        const availableSpreadDeg = Math.max(0, wedgeSize - boundaryMarginDeg * 2);
        // Use as much of the wedge as possible for readability
        const finalSpreadDeg = Math.max(minSectorSpreadDeg, Math.min(availableSpreadDeg, 180));

        // Compute a shared dynamic radius so that count nodes of diameter fit into available spread
        const perNodeAvailableDeg = (finalSpreadDeg / count);
        const requiredNodeRadius = perNodeAvailableDeg > 0
            ? ((nodeDiameterPx * paddingFactorBetweenNodes) / (perNodeAvailableDeg * Math.PI / 180))
            : nodeRadius;
        const dynamicCircleRadius = Math.max(baseCircleRadius, requiredNodeRadius / 0.7);

        const centerAngle = startAngle + (wedgeSize / 2);

        computed.sectorCenters[sectorName] = centerAngle % 360;
        computed.sectorSpreads[sectorName] = finalSpreadDeg;
        if (!computed.circleRadii[sectorName]) computed.circleRadii[sectorName] = {};
        // Currently only circle 1 used, but support arbitrary circles
        computed.circleRadii[sectorName][1] = dynamicCircleRadius;
    });

    // attach computed to data for downstream usage
    data._computed = computed;

    if (data.center) {
        elements.push({
            data: { id: data.center, name: data.center, type: 'center' },
            position: { x: 0, y: 0 }
        });
    }

    // sectorEntries and sectorAngles already computed above
    // Determine visible radii for guide circles: prefer computed dynamic radii
    const dynamicRadiiMap = (() => {
        const result = { ...circleRadiusMap };
        if (data._computed && data._computed.circleRadii) {
            // For each circle index, take the max across sectors to ensure guides enclose all nodes
            const perCircle = {};
            Object.values(data._computed.circleRadii).forEach(perSector => {
                Object.entries(perSector).forEach(([circleKey, radius]) => {
                    const key = String(circleKey);
                    perCircle[key] = Math.max(perCircle[key] || 0, radius);
                });
            });
            Object.entries(perCircle).forEach(([k, v]) => { result[k] = v; });
        }
        return result;
    })();

    const maxRadius = Math.max(...Object.values(dynamicRadiiMap));

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
        const personNames = new Set(data.people.map(p => p.name).concat(data.center ? [data.center] : []));
        data.peer_connections.forEach(conn => {
            if (!conn || !conn.from || !conn.to) return;
            if (!personNames.has(conn.from) || !personNames.has(conn.to)) return;
            elements.push({
                data: {
                    id: `${conn.from}-${conn.to}`,
                    source: conn.from,
                    target: conn.to,
                    strength: conn.strength,
                    color_group: conn.color_group
                }
            });
        });
    }

    if (data.display.show_circles) {
        Object.values(dynamicRadiiMap).forEach((radius, index) => {
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
