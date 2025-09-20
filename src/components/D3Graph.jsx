import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { processGraphDataForD3, createSimulation, getD3Style } from '../utils/d3-helper';

const D3Graph = ({ graphData }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedNodeInfo, setSelectedNodeInfo] = useState('Кликните на узел для получения информации');

    useEffect(() => {
        if (!graphData || !svgRef.current || !containerRef.current) return;

        const { width, height } = containerRef.current.getBoundingClientRect();
        const { nodes, links } = processGraphDataForD3(graphData, { width, height });
        const simulation = createSimulation(nodes, links, { width, height, data: graphData });
        const style = getD3Style(graphData);

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll("*").remove();

        const g = svg.append("g");

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
            .call(drag(simulation))
            .on("click", (event, d) => {
                let info = `<strong>${d.name}</strong><br>`;
                if (d.type === 'center') {
                    info += `Центральная персона`;
                } else {
                    info += `Сектор: ${d.sector}<br>`;
                    info += `Круг: ${d.circle}<br>`;
                    info += `Важность: ${d.importance}`;
                }
                setSelectedNodeInfo(info);
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
            .attr("fill", "#333");

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

        function drag(simulation) {
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            function dragended(event, _d) {
                if (!event.active) simulation.alphaTarget(0);
                // Keep node fixed at the dragged position
                // _d.fx = null;
                // _d.fy = null;
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', border: '1px solid #eee' }}>
                <p>Загрузка данных или ошибка в YAML...</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid #eee' }}>
            <svg ref={svgRef}></svg>
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

export default D3Graph;
