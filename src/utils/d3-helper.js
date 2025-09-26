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
    console.log(data);
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
    const maxRadius = Math.min(width, height) * 0.45;
    const circleRadii = {
        1: maxRadius * 0.4,  // Inner circle
        2: maxRadius * 0.7,  // Middle circle
        3: maxRadius        // Outer circle
    };

    // Create the simulation with basic forces
    const simulation = d3.forceSimulation(nodes)
        // .force("link", d3.forceLink(links)
        //     .id(d => d.id)
        //     .strength(0.1)
        //     .distance(50))  // Set fixed distance between linked nodes
        .force("charge", d3.forceManyBody()
            .strength(-30)
            .distanceMax(maxRadius * 10))  // Limit the maximum radius of repulsive force
        .force("collide", d3.forceCollide().radius(10));

    // Fix the center node
    const centerNode = nodes.find(n => n.type === 'center');
    if (centerNode) {
        centerNode.fx = width / 2;
        centerNode.fy = height / 2;
    }

    // Add custom positioning force using calculated sector angles
    simulation.force("position", alpha => {
        nodes.forEach(node => {
            if (node.type === 'center' || !node.sectorAngle) return;

            // Calculate current angle
            const dx = node.x - width / 2;
            const dy = node.y - height / 2;
            let currentAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

            // Convert target angle to radians (adjust for SVG coordinate system)
            const targetAngle = ((node.sectorAngle - 90) * Math.PI) / 180;
            
            node.vx += Math.cos(targetAngle) * alpha * 2;
            node.vy += Math.sin(targetAngle) * alpha * 2;
        });
    });

    // Set initial positions based on calculated sector angles
    nodes.forEach(node => {
        if (node.type !== 'center') {
            const radius = circleRadii[node.circle] || circleRadii[3];
            // Convert sectorAngle from degrees to radians and adjust for SVG coordinate system
            const angle = ((node.sectorAngle - 90) * Math.PI) / 180;
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
