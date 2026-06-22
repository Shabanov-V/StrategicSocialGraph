import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { processGraphDataForD3, createSimulation, getD3Style, constrainToSector } from '../../utils/d3-helper';
import styles from './D3Graph.module.css';

const D3Graph = ({ graphData, onAddNote, onRemoveNote }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [noteInput, setNoteInput] = useState('');

    useEffect(() => {
        setNoteInput('');
    }, [selectedNode]);

    // Notes are derived live from the document so the list refreshes after each add.
    const currentNotes = selectedNode
        ? (graphData?.people?.find(p => p.name === selectedNode.name)?.notes ?? [])
        : [];

    const handleAddNote = () => {
        const text = noteInput.trim();
        if (!text || !selectedNode || typeof onAddNote !== 'function') return;
        onAddNote(selectedNode, text);
        setNoteInput('');
    };

    useEffect(() => {
        if (!graphData || !svgRef.current || !containerRef.current) return;

        const { width, height } = containerRef.current.getBoundingClientRect();
        const centerX = width / 2;
        const centerY = height / 2;
        
        const maxRadius = height * 2;
        const circleRadii = [
            maxRadius * 0.33,  // Circle 1 max radius
            maxRadius * 0.66,  // Circle 2 max radius
            maxRadius          // Circle 3 max radius
        ];

        const { nodes, links } = processGraphDataForD3(graphData, { width, height });
        const simulation = createSimulation(nodes, links, { width, height, data: graphData, circleRadii, maxRadius });
        const style = getD3Style(graphData);

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll("*").remove();

        const g = svg.append("g");

        // Add circles for different levels
        const circles = g.append("g")
            .attr("class", "circles");
        

        circleRadii.forEach((radius, i) => {
            circles.append("circle")
                .attr("cx", width / 2)
                .attr("cy", height / 2)
                .attr("r", radius)
                .attr("fill", "none")
                .attr("stroke", "var(--medium-gray)")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .attr("class", `circle-${i + 1}`);
        });

        // Add sectors
        const sectors = g.append("g")
            .attr("class", "sectors");

        const arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(maxRadius);

        graphData.sectors.forEach(sector => {
            const startAngle = sector.startAngle * (Math.PI / 180);
            const endAngle = sector.endAngle * (Math.PI / 180);

            sectors.append("path")
                .attr("d", arcGenerator({
                    startAngle,
                    endAngle
                }))
                .attr("transform", `translate(${width/2},${height/2})`)
                .attr("fill", "var(--light-gray)")
                .attr("stroke", "none")
                .attr("opacity", 0.3);

            // Draw sector boundaries with solid lines to emphasize they're walls
            sectors.append("path")
                .attr("d", arcGenerator({
                    startAngle,
                    endAngle: startAngle
                }))
                .attr("transform", `translate(${width/2},${height/2})`)
                .attr("stroke", "var(--dark-gray)")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            const radialAngle = (sector.centerAngle - 90) * (Math.PI / 180);
            const labelRadius = maxRadius * 1.1;
            const labelX = width/2 + Math.cos(radialAngle) * labelRadius;
            const labelY = height/2 + Math.sin(radialAngle) * labelRadius;
            
            sectors.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "var(--dark-gray)")
                .attr("font-size", "14px")
                .attr("class", "sector-label")
                .text(sector.name);
                
            sectors.append("text")
                .attr("x", labelX)
                .attr("y", labelY + 20)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "var(--medium-gray)")
                .attr("font-size", "12px")
                .text(`(${sector.peopleCount})`);
        });

        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", d => style.link(d).stroke)
            .attr("stroke-width", d => style.link(d).strokeWidth)
            .attr("stroke-dasharray", d => style.link(d).strokeDasharray);

        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes.filter(n => n.type !== 'wall'))
            .enter().append("circle")
            .attr("r", d => style.node(d).radius)
            .attr("fill", d => style.node(d).fill)
            .call(drag(simulation, centerX, centerY))
            .on("click", (event, d) => {
                setSelectedNode(d);
            });

        const label = g.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes.filter(n => n.type !== 'wall'))
            .enter().append("text")
            .text(d => d.name)
            .attr('x', 12)
            .attr('y', 4)
            .attr("font-size", "12px")
            .attr("fill", "var(--very-dark-gray)");

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        function drag(simulation, centerX, centerY) {
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                // Constrain the drag position to sector and circle boundaries
                const constrained = constrainToSector(event.x, event.y, d, centerX, centerY, circleRadii);
                d.fx = constrained.x;
                d.fy = constrained.y;
            }

            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                // Release fixed position so node can be affected by forces again
                d.fx = null;
                d.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        const zoom = d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
        svg.call(zoom);

    }, [graphData]);

    if (!graphData) {
        return (
            <div className={styles.loadingContainer}>
                <p>Загрузка данных или ошибка в YAML...</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={styles.container}>
            <svg ref={svgRef}></svg>
            {selectedNode && (
                <div className={styles.infoPanel}>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setSelectedNode(null)}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                    <div className={styles.nodeName}>{selectedNode.name}</div>
                    <div className={styles.nodeMeta}>
                        {selectedNode.type === 'center' ? (
                            'Центральная персона'
                        ) : (
                            <>
                                Сектор: {selectedNode.sector}<br />
                                Круг: {selectedNode.circle}<br />
                                Важность: {selectedNode.importance}
                            </>
                        )}
                    </div>
                    <div className={styles.addRow}>
                        <input
                            className={styles.noteInput}
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                            placeholder="Добавить заметку..."
                        />
                        <button className={styles.addBtn} onClick={handleAddNote}>
                            +
                        </button>
                    </div>
                    {currentNotes.length > 0 && (
                        <ul className={styles.noteList}>
                            {currentNotes.map((n, i) => i).reverse().map((i) => (
                                <li key={i} className={styles.noteItem}>
                                    <span className={styles.noteDate}>{currentNotes[i].date}</span>
                                    <span className={styles.noteText}>{currentNotes[i].text}</span>
                                    <button
                                        className={styles.noteDel}
                                        onClick={() => onRemoveNote?.(selectedNode, i)}
                                        aria-label="Удалить заметку"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default D3Graph;