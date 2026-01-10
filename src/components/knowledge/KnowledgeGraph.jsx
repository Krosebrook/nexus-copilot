import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function KnowledgeGraph({ articles, onArticleClick }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || articles.length === 0) return;

    try {
      setError(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Build graph structure
    const nodes = articles.map((article, idx) => ({
      id: article.id,
      title: article.title,
      category: article.category,
      x: (idx % 5) * 150 + 100,
      y: Math.floor(idx / 5) * 150 + 100,
      radius: 30,
      links: article.linked_articles || [],
      backlinks: article.backlinks || []
    }));

    // Draw edges
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    nodes.forEach(node => {
      node.links.forEach(linkId => {
        const targetNode = nodes.find(n => n.id === linkId);
        if (targetNode) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
          
          // Draw arrow
          const angle = Math.atan2(targetNode.y - node.y, targetNode.x - node.x);
          const arrowX = targetNode.x - targetNode.radius * Math.cos(angle);
          const arrowY = targetNode.y - targetNode.radius * Math.sin(angle);
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - 10 * Math.cos(angle - Math.PI / 6),
            arrowY - 10 * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            arrowX - 10 * Math.cos(angle + Math.PI / 6),
            arrowY - 10 * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = isHovered ? '#3b82f6' : '#f1f5f9';
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#2563eb' : '#cbd5e1';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Category badge
      if (node.category) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.category, node.x, node.y - node.radius - 10);
      }

      // Node label
      ctx.fillStyle = '#1e293b';
      ctx.font = isHovered ? 'bold 12px sans-serif' : '11px sans-serif';
      ctx.textAlign = 'center';
      const maxWidth = 100;
      const text = node.title.length > 20 ? node.title.slice(0, 17) + '...' : node.title;
      ctx.fillText(text, node.x, node.y + node.radius + 15);

      // Link count
      if (node.links.length > 0 || node.backlinks.length > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.font = '10px sans-serif';
        ctx.fillText(
          `${node.links.length + node.backlinks.length} links`,
          node.x,
          node.y + node.radius + 28
        );
      }
    });

    ctx.restore();

    // Mouse interaction
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      if (isDragging) {
        setPan({
          x: pan.x + (e.clientX - dragStart.x),
          y: pan.y + (e.clientY - dragStart.y)
        });
        setDragStart({ x: e.clientX, y: e.clientY });
        return;
      }

      const hovered = nodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < node.radius;
      });
      
      setHoveredNode(hovered?.id || null);
      canvas.style.cursor = hovered ? 'pointer' : isDragging ? 'grabbing' : 'grab';
    };

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      const clicked = nodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < node.radius;
      });

      if (clicked) {
        onArticleClick?.(clicked.id);
      } else {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    } catch (err) {
      console.error('Graph rendering error:', err);
      setError('Failed to render knowledge graph');
    }
  }, [articles, zoom, pan, isDragging, hoveredNode, onArticleClick]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Knowledge Graph</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="border border-slate-200 rounded-lg w-full"
          />
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">
            {articles.length} articles
          </Badge>
          <Badge variant="outline">
            {articles.reduce((sum, a) => sum + (a.linked_articles?.length || 0), 0)} links
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}