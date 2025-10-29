// src/utils/d3-helper.js
import * as d3 from 'd3';

export const processGraphDataForD3 = (data, { width, height }) => {
    const nodes = [];
    const links = [];

    // Create a map of sector boundaries for quick lookup
    const sectorMap = {};
    if (data.sectors) {
        data.sectors.forEach(sector => {
            sectorMap[sector.name] = {
                startAngle: sector.startAngle,
                endAngle: sector.endAngle
            };
        });
    }

    // Add people nodes
    if (data.center) {
        const centerPerson = data.people.find(p => p.name === data.center) || {};
        nodes.push({ id: data.center, name: data.center, type: 'center', ...centerPerson });
    }
    
    data.people.forEach(person => {
        if (person.name !== data.center) {
            const nodeData = { id: person.name, type: 'person', ...person };
            
            // Add sector boundary information to each node
            if (person.sector && sectorMap[person.sector]) {
                nodeData.sectorStartAngle = sectorMap[person.sector].startAngle;
                nodeData.sectorEndAngle = sectorMap[person.sector].endAngle;
            }
            
            nodes.push(nodeData);
        }
    });


    console.log("Nodes after processing people:", nodes);

    // Add peer connections
    if (data.peer_connections) {
        data.peer_connections.forEach(conn => {
            if (conn.from && conn.to) {
                // Find the actual node objects for source and target
                const sourceNode = nodes.find(n => n.name === conn.from);
                const targetNode = nodes.find(n => n.name === conn.to);
                if (sourceNode && targetNode) {
                    links.push({ source: sourceNode, target: targetNode, ...conn });
                }
            }
        });
    }
    return { nodes, links };
};

// Helper function to normalize angles to 0-360 range
const normalizeAngle = (angle) => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
};

// Helper function to check if an angle is within sector bounds
const isAngleInSector = (angle, startAngle, endAngle) => {
    angle = normalizeAngle(angle);
    startAngle = normalizeAngle(startAngle);
    endAngle = normalizeAngle(endAngle);
    
    // Handle sector that crosses 0/360 boundary
    if (startAngle > endAngle) {
        return angle >= startAngle || angle <= endAngle;
    }
    
    return angle >= startAngle && angle <= endAngle;
};

// Helper function to find nearest boundary angle
const getNearestBoundary = (currentAngle, startAngle, endAngle) => {
    currentAngle = normalizeAngle(currentAngle);
    startAngle = normalizeAngle(startAngle);
    endAngle = normalizeAngle(endAngle);
    
    // Calculate angular distances
    let distToStart = Math.abs(currentAngle - startAngle);
    let distToEnd = Math.abs(currentAngle - endAngle);
    
    // Handle wrapping around 0/360
    if (distToStart > 180) distToStart = 360 - distToStart;
    if (distToEnd > 180) distToEnd = 360 - distToEnd;
    
    return distToStart < distToEnd ? startAngle : endAngle;
};

function adjustedSigmoidTransform(x, shift = 5, scale = -1) {
    let shiftedX = (x - shift) * scale;
    return 1 / (1 + Math.exp(-shiftedX));
}

const getLinkWidth = (data, link) => {
    return data.display?.line_styles?.[link.strength]?.width || 2;
}

const calculateLinkDistance = (data, maxRadius, link) => {
    return (Math.abs(link.source.circle - link.target.circle) * 0.2 * maxRadius)  + (50 + 0.1 * maxRadius * adjustedSigmoidTransform(getLinkWidth(data, link)));
}

const calculateLinkStrength = (data, link) => {
    return getLinkWidth(data, link) * 0.1;
}

export const createSimulation = (nodes, links, { width, height, data, maxRadius, circleRadii }) => {

    const centerX = width / 2;
    const centerY = height / 2;

    // Create the simulation with basic forces
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody()
            .strength(-600)
            .distanceMax(maxRadius * 0.07))
        .force("collide", d3.forceCollide().radius(10))
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(link => calculateLinkDistance(data, maxRadius, link))
            .strength(link => calculateLinkStrength(data, link)));

    // Fix the center node
    const centerNode = nodes.find(n => n.type === 'center');
    if (centerNode) {
        centerNode.fx = centerX;
        centerNode.fy = centerY;
    }

    // Add sector boundary constraint force (soft corrective - nudges nodes back inside bounds)
    // Using a soft correction avoids hard snapping which causes nodes to "stick" and only slide along boundaries.
    simulation.force("sectorBoundary", (alpha) => {
        nodes.forEach(node => {
            // Skip center node
            if (node.type === 'center') {
                return;
            }

            // Calculate current angle and distance from center
            const dx = node.x - centerX;
            const dy = node.y - centerY;
            let distance = Math.sqrt(dx * dx + dy * dy);
            const currentAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
            const adjustedAngle = (currentAngle + 90) % 360;

            let needsCorrection = false;
            let correctedDistance = distance;

            // Determine allowed radial range
            if (node.circle !== undefined) {
                const minRadius = node.circle === 1 ? 0 : circleRadii[node.circle - 2];
                const maxRadius = circleRadii[node.circle - 1];

                if (distance < minRadius) {
                    correctedDistance = minRadius;
                    needsCorrection = true;
                } else if (distance > maxRadius) {
                    correctedDistance = maxRadius;
                    needsCorrection = true;
                }
            }

            // Check sector angular boundaries
            let finalAngle = adjustedAngle;
            if (node.sectorStartAngle !== undefined && node.sectorEndAngle !== undefined) {
                if (!isAngleInSector(adjustedAngle, node.sectorStartAngle, node.sectorEndAngle)) {
                    finalAngle = getNearestBoundary(
                        adjustedAngle,
                        node.sectorStartAngle,
                        node.sectorEndAngle
                    );
                    needsCorrection = true;
                }
            }

            // Apply a soft correction (impulse) towards the allowed position instead of hard snapping
            if (needsCorrection) {
                const boundaryAngle = ((finalAngle - 90) * Math.PI) / 180;
                const targetX = centerX + Math.cos(boundaryAngle) * correctedDistance;
                const targetY = centerY + Math.sin(boundaryAngle) * correctedDistance;

                // Correction strength (tweakable). Scale with alpha so corrections reduce as simulation cools.
                const k = 0.2;
                const strength = k * Math.max(alpha, 0.01);

                // Apply corrective impulse to velocities (soft move toward allowed region)
                node.vx += (targetX - node.x) * strength;
                node.vy += (targetY - node.y) * strength;

                // Mild damping to prevent oscillation and reduce sticking along boundary
                node.vx *= 0.92;
                node.vy *= 0.92;
            }
        });
    });

    // Set initial positions based on calculated sector angles
    nodes.forEach(node => {
        if (node.type !== 'center') {
            // Calculate the middle of the circle range for initial positioning
            const minRadius = node.circle === 1 ? 0 : circleRadii[node.circle - 2];
            const maxRadius = circleRadii[node.circle - 1];
            const radius = (minRadius + maxRadius) / 2; // Place in the middle of the range
            
            // Convert sectorAngle from degrees to radians and adjust for SVG coordinate system
            const angle = ((node.sectorAngle - 90) * Math.PI) / 180;
            node.x = centerX + Math.cos(angle) * radius;
            node.y = centerY + Math.sin(angle) * radius;
        }
    });

    return simulation;
};

// Export helper function to constrain position during drag
export const constrainToSector = (x, y, node, centerX, centerY, circleRadii) => {
    if (node.type === 'center') {
        return { x: centerX, y: centerY };
    }

    // Calculate angle and distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    // Constrain distance to circle boundaries
    if (node.circle !== undefined && circleRadii) {
        const minRadius = node.circle === 1 ? 0 : circleRadii[node.circle - 2];
        const maxRadius = circleRadii[node.circle - 1];
        
        // Clamp distance to circle range
        distance = Math.max(minRadius, Math.min(maxRadius, distance));
    }
    
    const currentAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    const adjustedAngle = (currentAngle + 90) % 360;

    // Constrain angle to sector boundaries
    let finalAngle = adjustedAngle;
    if (node.sectorStartAngle !== undefined && node.sectorEndAngle !== undefined) {
        if (!isAngleInSector(adjustedAngle, node.sectorStartAngle, node.sectorEndAngle)) {
            finalAngle = getNearestBoundary(
                adjustedAngle, 
                node.sectorStartAngle, 
                node.sectorEndAngle
            );
        }
    }
    
    // Convert back to x,y with constrained distance and angle
    const boundaryAngle = ((finalAngle - 90) * Math.PI) / 180;
    
    return {
        x: centerX + Math.cos(boundaryAngle) * distance,
        y: centerY + Math.sin(boundaryAngle) * distance
    };
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