
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface VisualizerProps {
  nodes: Array<{ id: string; group: number }>;
  links: Array<{ source: string; target: string }>;
}

export const Visualizer: React.FC<VisualizerProps> = ({ nodes, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth || 400;
    const height = 400;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .style('background', '#18181b'); // Dark background for contrast
    
    svg.selectAll("*").remove();

    // Clone data to avoid mutations by D3 simulation
    const nodesCopy = nodes.map(d => ({ ...d }));
    const linksCopy = links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodesCopy as any)
      .force("link", d3.forceLink(linksCopy).id((d: any) => d.id).distance(70))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(linksCopy)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = svg.append("g")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .selectAll("circle")
      .data(nodesCopy)
      .join("circle")
      .attr("r", 7)
      .attr("fill", (d: any) => {
        const colors = ['#577E89', '#E1A36F', '#6F9F9C', '#DEC484', '#8DA399'];
        return colors[d.group % colors.length];
      })
      .call(drag(simulation) as any);

    node.append("title").text((d: any) => d.id);

    const labels = svg.append("g")
      .selectAll("text")
      .data(nodesCopy)
      .join("text")
      .text((d: any) => d.id)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#a1a1aa")
      .attr("dx", 10)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as any).x)
        .attr("y1", (d: any) => (d.source as any).y)
        .attr("x2", (d: any) => (d.target as any).x)
        .attr("y2", (d: any) => (d.target as any).y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(sim: any) {
      function dragstarted(event: any) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event: any) {
        if (!event.active) sim.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Fixed: return a function that returns void for React cleanup
    return () => { simulation.stop(); };
  }, [nodes, links]);

  return (
    <div className="w-full h-[400px] relative">
      <div className="absolute top-4 left-4 z-10">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">技術關聯圖譜</span>
      </div>
      <svg ref={svgRef} className="w-full h-full block"></svg>
    </div>
  );
};
