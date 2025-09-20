// src/utils/d3-helper.js
import * as d3 from 'd3';

export const processGraphDataForD3 = (data, { width, height }) => {
    const nodes = [];
    const links = [];

    // Add people nodes
    if (data.center) {
        const centerPerson = data.people.find(p => p.name === data.center) || {};
        nodes.push({ id: data.center, name: data.center, type: 'center', ...centerPerson });
    }
    data.people.forEach(person => {
        if (person.name !== data.center) {
            nodes.push({ id: person.name, type: 'person', ...person });
        }
    });

    // Add peer connections
    if (data.peer_connections) {
        data.peer_connections.forEach(conn => {
            if (conn.from && conn.to) {
                links.push({ source: conn.from, target: conn.to, ...conn });
            }
        });
    }

    return { nodes, links };
};

export const createSimulation = (nodes, links, { width, height, data }) => {
    const maxRadius = Math.min(width, height) * 1.2; // Increased from 0.4 to 1.2 (3x larger)
    const circleRadii = {
        1: maxRadius * 0.33,  // Inner circle
        2: maxRadius * 0.66,  // Middle circle
        3: maxRadius         // Outer circle
    };

    const linkForce = d3.forceLink(links).id(d => d.id).strength(d => {
        const strengthMap = { 'strong': 0.2, 'normal': 0.1, 'weak': 0.05 };
        return strengthMap[d.strength] || 0.1;
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", linkForce)
        .force("charge", d3.forceManyBody().strength(d => {
            if (d.type === 'wall') return 0;
            const importanceMap = { 'important': -15, 'normal': -10 };
            return importanceMap[d.importance] || -10;
        }))
        .force("collide", d3.forceCollide().radius(d => {
            if (d.type === 'wall') return d.radius;
            const importanceMap = { 'important': 15, 'normal': 10 };
            return importanceMap[d.importance] || 10;
        }).strength(0.7));

    // Fix the center node's position
    const centerNode = nodes.find(n => n.type === 'center');
    if (centerNode) {
        centerNode.fx = width / 2;
        centerNode.fy = height / 2;
    }

    // Custom force to keep nodes within their sectors and circles
    const sectorBoundaries = {};
    const sortedSectors = Object.entries(data.layout.sector_distribution)
        .map(([name, angle]) => ({ name, angle }))
        .sort((a, b) => a.angle - b.angle);

    for (let i = 0; i < sortedSectors.length; i++) {
        const current = sortedSectors[i];
        const next = sortedSectors[(i + 1) % sortedSectors.length];
        let endAngle = next.angle;
        if (endAngle <= current.angle) {
            endAngle += 360;
        }
        sectorBoundaries[current.name] = {
            start: current.angle,
            end: endAngle
        };
    }

    // Force to keep nodes strictly within their designated circles and sectors
    const circleAndSectorForce = () => {
        for (const node of nodes) {
            if (node.type === 'center' || !node.sector || !node.circle) continue;

            const sector = sectorBoundaries[node.sector];
            if (!sector) continue;

            // Get target radius based on circle number
            const targetRadius = circleRadii[node.circle] || circleRadii[3];
            const radiusTolerance = targetRadius * 0.03; // Reduced to 3% tolerance for tighter circle adherence

            // Calculate current position relative to center
            const dx = node.x - width / 2;
            const dy = node.y - height / 2;
            const currentRadius = Math.sqrt(dx * dx + dy * dy);
            let currentAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

            // Enforce sector boundaries
            let { start, end } = sector;
            if (end < start) end += 360;
            
            // Clamp angle to sector
            if (currentAngle < start || currentAngle > end) {
                if (Math.abs(currentAngle - start) < Math.abs(currentAngle - end)) {
                    currentAngle = start;
                } else {
                    currentAngle = end;
                }
            }

            // Clamp radius to circle with small tolerance
            const clampedRadius = Math.max(
                targetRadius - radiusTolerance,
                Math.min(targetRadius + radiusTolerance, currentRadius)
            );

            // Convert back to cartesian coordinates
            const angleRad = currentAngle * (Math.PI / 180);
            const newX = width / 2 + Math.cos(angleRad) * clampedRadius;
            const newY = height / 2 + Math.sin(angleRad) * clampedRadius;

            // Move node towards clamped position with stronger force
            node.vx = (newX - node.x) * 0.8;
            node.vy = (newY - node.y) * 0.8;
        }
    };

    // Add our custom force to the simulation
    simulation.force("circleAndSector", circleAndSectorForce);
    
    // Set initial positions
    nodes.forEach(node => {
        if (node.type !== 'center') {
            const angle = Math.random() * 2 * Math.PI;
            const radius = circleRadii[node.circle] || circleRadii[3];
            node.x = width / 2 + Math.cos(angle) * radius;
            node.y = height / 2 + Math.sin(angle) * radius;
        }
    });

    return simulation;
};

export const getD3Style = (data) => {
    const colors = data?.display?.colors || {};
    const pointStyles = data?.display?.point_styles || {};
    const lineStyles = data?.display?.line_styles || {};

    return {
        node: (node) => ({
            fill: node.type === 'wall' ? 'transparent' : (colors[node.color_group] || '#999'),
            radius: node.type === 'wall' ? node.radius : ((pointStyles[node.importance]?.size || 6) * 2),
        }),
        link: (link) => ({
            stroke: colors[link.color_group] || '#666',
            strokeWidth: lineStyles[link.strength]?.width || 2,
            strokeDasharray: lineStyles[link.strength]?.style === 'dashed' ? '5,5' : 'none',
        }),
    };
};
