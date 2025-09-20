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
    const linkForce = d3.forceLink(links).id(d => d.id).strength(d => {
        const strengthMap = { 'strong': 0.2, 'normal': 0.1, 'weak': 0.05 };
        return strengthMap[d.strength] || 0.1;
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", linkForce)
        .force("charge", d3.forceManyBody().strength(d => {
            if (d.type === 'wall') return 0;
            const importanceMap = { 'important': -400, 'normal': -200 };
            return importanceMap[d.importance] || -200;
        }))
        .force("collide", d3.forceCollide().radius(d => {
            if (d.type === 'wall') return d.radius;
            const importanceMap = { 'important': 20, 'normal': 15 };
            return importanceMap[d.importance] || 15;
        }).strength(1))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Fix the center node's position
    const centerNode = nodes.find(n => n.type === 'center');
    if (centerNode) {
        centerNode.fx = width / 2;
        centerNode.fy = height / 2;
    }

    // Custom force to keep nodes within their sectors
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
        const midPointAngle = current.angle + (endAngle - current.angle) / 2;
        sectorBoundaries[current.name] = { end: midPointAngle };
    }

    for (let i = 0; i < sortedSectors.length; i++) {
        const current = sortedSectors[i];
        const prev = sortedSectors[(i - 1 + sortedSectors.length) % sortedSectors.length];
        sectorBoundaries[current.name].start = sectorBoundaries[prev.name].end;
    }

    const sectorForce = () => {
        for (const node of nodes) {
            if (node.type !== 'person') continue;

            const sector = sectorBoundaries[node.sector];
            if (!sector) continue;

            const dx = node.x - width / 2;
            const dy = node.y - height / 2;
            const radius = Math.sqrt(dx * dx + dy * dy);
            let nodeAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

            let { start, end } = sector;

            if (start > end) { // Wraps around 360
                if (nodeAngle < start && nodeAngle > end) {
                    const distToStart = Math.min(Math.abs(nodeAngle - start), Math.abs(nodeAngle - (start - 360)));
                    const distToEnd = Math.min(Math.abs(nodeAngle - end), Math.abs(nodeAngle - (end + 360)));
                    nodeAngle = distToStart < distToEnd ? start : end;
                }
            } else {
                if (nodeAngle < start || nodeAngle > end) {
                    const distToStart = Math.abs(nodeAngle - start);
                    const distToEnd = Math.abs(nodeAngle - end);
                    nodeAngle = distToStart < distToEnd ? start : end;
                }
            }

            const clampedRad = nodeAngle * (Math.PI / 180);
            node.x = width / 2 + Math.cos(clampedRad) * radius;
            node.y = height / 2 + Math.sin(clampedRad) * radius;
        }
    };

    simulation.force("sector", sectorForce);

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
