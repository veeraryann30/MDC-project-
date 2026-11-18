import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { 
  Network, ZoomIn, ZoomOut, RotateCcw, Maximize2, 
  Info, ShieldAlert, ShieldCheck, AlertTriangle, Layers
} from 'lucide-react';

/**
 * INFRASTRUCTURE CONNECTIONS GRAPH
 * High-performance SOC graph visualization using Cytoscape.js.
 * Renders verified relational nodes: Target Domain, Resolved IP, ASN, Nameservers,
 * Hosting Providers, and shared historical infrastructure.
 */
export default function InfrastructureGraph({ elements, summary, disclaimer }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [layoutName, setLayoutName] = useState('cose');

  useEffect(() => {
    if (!containerRef.current || !elements || !elements.nodes || elements.nodes.length === 0) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements: elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        wheelSensitivity: 0.25,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'color': '#111827',
              'font-size': '10px',
              'font-family': 'Inter, system-ui, sans-serif',
              'font-weight': '600',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'text-outline-color': '#FFFFFF',
              'text-outline-width': 2,
              'width': 'data(size)',
              'height': 'data(size)',
              'border-width': 2,
              'border-color': '#E2E8F0',
              'transition-property': 'background-color, border-color, border-width, transform',
              'transition-duration': '0.2s'
            }
          },
          {
            selector: 'node[type = "target_domain"]',
            style: {
              'border-color': '#2563EB',
              'border-width': 3,
              'shape': 'hexagon',
              'text-outline-color': '#DBEAFE'
            }
          },
          {
            selector: 'node[type = "ip"]',
            style: {
              'shape': 'round-rectangle',
              'border-color': '#1D4ED8',
              'border-width': 2
            }
          },
          {
            selector: 'node[type = "asn"]',
            style: {
              'shape': 'ellipse',
              'border-color': '#7C3AED'
            }
          },
          {
            selector: 'node[type = "hosting"]',
            style: {
              'shape': 'barrel',
              'border-color': '#0284C7'
            }
          },
          {
            selector: 'node[type = "nameserver"]',
            style: {
              'shape': 'diamond',
              'border-color': '#059669'
            }
          },
          {
            selector: 'node[type = "related_domain"]',
            style: {
              'shape': 'ellipse',
              'border-style': 'dashed'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 1.5,
              'line-color': '#CBD5E1',
              'target-arrow-color': '#94A3B8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 0.8,
              'label': 'data(label)',
              'font-size': '8px',
              'font-family': 'monospace',
              'color': '#64748B',
              'text-background-opacity': 0.95,
              'text-background-color': '#FFFFFF',
              'text-background-padding': 2,
              'text-background-shape': 'roundrectangle'
            }
          },
          {
            selector: ':selected',
            style: {
              'border-color': '#1E40AF',
              'border-width': 3.5,
              'line-color': '#2563EB',
              'target-arrow-color': '#2563EB'
            }
          },
          {
            selector: '.highlighted',
            style: {
              'border-color': '#2563EB',
              'border-width': 3
            }
          },
          {
            selector: '.faded',
            style: {
              'opacity': 0.25
            }
          }
        ],
        layout: {
          name: layoutName,
          animate: true,
          animationDuration: 400,
          padding: 30,
          nodeRepulsion: 6500,
          idealEdgeLength: 85,
          edgeElasticity: 0.45
        }
      });

      // Node click handler
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        const data = node.data();
        setSelectedNode(data);

        // Highlight neighborhood
        cy.elements().removeClass('highlighted faded');
        const neighborhood = node.neighborhood().add(node);
        cy.elements().difference(neighborhood).addClass('faded');
        neighborhood.addClass('highlighted');
      });

      // Background click handler
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          cy.elements().removeClass('highlighted faded');
        }
      });

      cyRef.current = cy;
    } catch (e) {
      console.warn('Cytoscape graph initialization error:', e);
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, layoutName]);

  const handleZoomIn = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  };

  const handleZoomOut = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  };

  const handleResetView = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  };

  const toggleLayout = () => {
    setLayoutName((prev) => (prev === 'cose' ? 'concentric' : 'cose'));
  };

  return (
    <div className="rounded-[16px] bg-white border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Top Bar with Controls and Legend */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-[#F5F9FF]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
            <Network className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
              <span>Infrastructure Connections Graph</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E2E8F0] text-[#2563EB] font-medium">
                Cytoscape Engine
              </span>
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Interactive mapping of verified IP, ASN, DNS, and shared hosting nodes.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] p-1 rounded-[10px] shadow-sm">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#111827] hover:bg-[#F5F9FF] transition-colors cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleLayout}
            className="p-1.5 rounded-[6px] text-[#2563EB] hover:bg-[#DBEAFE]/50 transition-colors cursor-pointer text-[10px] font-mono px-2 font-medium"
            title="Switch Layout"
          >
            {layoutName === 'cose' ? 'Force Layout' : 'Radial'}
          </button>
        </div>
      </div>

      {/* Graph Visual Canvas */}
      <div className="relative w-full h-[380px] bg-[#F8FAFC]">
        <div ref={containerRef} className="w-full h-full" />

        {/* Floating Node Badge Legend */}
        <div className="absolute top-3 left-3 pointer-events-none flex flex-wrap gap-1.5 max-w-md">
          <span className="px-2 py-0.5 rounded bg-white/95 border border-[#2563EB]/30 text-[#2563EB] text-[10px] font-mono flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Target
          </span>
          <span className="px-2 py-0.5 rounded bg-white/95 border border-[#1D4ED8]/30 text-[#1D4ED8] text-[10px] font-mono flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" /> Resolved IP
          </span>
          <span className="px-2 py-0.5 rounded bg-white/95 border border-[#7C3AED]/30 text-[#7C3AED] text-[10px] font-mono flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> BGP ASN
          </span>
          <span className="px-2 py-0.5 rounded bg-white/95 border border-[#0284C7]/30 text-[#0284C7] text-[10px] font-mono flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#0284C7]" /> Hosting
          </span>
          <span className="px-2 py-0.5 rounded bg-white/95 border border-[#059669]/30 text-[#059669] text-[10px] font-mono flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#059669]" /> Nameserver
          </span>
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 p-3.5 rounded-[12px] bg-white/95 border border-[#E2E8F0] shadow-xl backdrop-blur-md space-y-1.5 z-20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                {selectedNode.category || 'Node Inspector'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold" style={{ backgroundColor: `${selectedNode.color}20`, color: selectedNode.color }}>
                {selectedNode.badge || selectedNode.type}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#111827] font-mono break-all">
              {selectedNode.label}
            </div>
            <p className="text-[10px] text-[#64748B] leading-relaxed">
              Click anywhere on empty canvas to dismiss. Drag nodes to explore cluster physics.
            </p>
          </div>
        )}
      </div>

      {/* Attribution Disclaimer Footer */}
      <div className="p-3 bg-[#F5F9FF] border-t border-[#E2E8F0] flex items-start gap-2 text-[11px] text-[#64748B] leading-relaxed">
        <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#111827]">Infrastructure Attribution Warning: </strong>
          {disclaimer || 'Shared infrastructure does not automatically imply common ownership or malicious affiliation; multiple unrelated domains frequently share commercial hosting and CDN infrastructure.'}
        </span>
      </div>
    </div>
  );
}
