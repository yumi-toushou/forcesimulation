// const d3 = window.d3;
export class ForceGraph {
  mapId = "";
  nodes = [];
  links = [];
  options = {
    width: 100,
    height: 100,
  };

  // 越小越聚团
  linkDistance = 180;

  // DOM结构：SVG -> G -> nodesG、linksG ....
  svgContainer = null;
  // 主空间
  graphContainer = null;
  nodesContainer = null;
  linksContainer = null;
  linksLabelContainer = null;

  simulation = null;

  constructor(mapId = "", nodes = [], links = [], options = {}) {
    this.mapId = mapId;
    this.nodes = nodes;
    this.links = links;
    this.options = {
      ...this.options,
      ...options,
    };

    // 创建zoom
    this.createSvgContainer();

    this.createSimulation();
    this.createLinksLabelContainer();
    this.createLinksContainer();
    this.createNodesContainer();

    this.ticked();
  }

  createSvgContainer() {
    const { width, height } = this.options;
    this.svgContainer = window.d3
      .select(`#${this.mapId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    this.graphContainer = this.svgContainer
      .call(
        d3.zoom().on("zoom", ({ transform }) => {
          this.graphContainer.attr("transform", transform);
        })
      )
      .append("g");
  }

  createSimulation() {
    this.simulation = d3
      .forceSimulation(this.nodes)
      .force("charge", d3.forceManyBody())
      .force(
        "link",
        d3
          .forceLink(this.links)
          .id((d) => d.id)
          .distance(this.linkDistance)
      )
    // .force("x", d3.forceX())
    // .force("y", d3.forceY());
  }

  createNodesContainer() {
    this.nodesContainer = this.graphContainer
      .append("g")
      .attr("class", "nodesContainer")
      .attr("fill", "#fff666")
      .attr("stroke", "#666")
      .attr("stroke-width", 10)
      .selectAll("circle");

    this.bindNodesData();
  }

  createLinksLabelContainer() {
    this.linksLabelContainer = this.graphContainer
      .append("g")
      .attr("class", "linksLabelContainer")

    this.createLabelDefs()
  }

  createLinksContainer() {
    this.linksContainer = this.graphContainer
      .append("g")
      .attr("class", "linksContainer")
      .attr("stroke", "#c2c2c2")
      .attr("stroke-width", 2)
      .selectAll("g");

    this.bindLinksData();
  }

  ticked() {
    this.simulation.on("tick", () => {
      this.nodesContainer?.attr('transform', d => `translate(${d.x},${d.y})`)

      this.linksContainer
        ?.attr('d', d => linkArc(d, { isArc: false, radius: 50 }))
    });
  }

  drag(simulation) {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // 通过Graph操作
  reDraw() {
    this.simulation = d3
      .forceSimulation(this.nodes)
      .force("charge", d3.forceManyBody())
      .force(
        "link",
        d3
          .forceLink(this.links)
          .id((d) => {
            return d.id;
          })
          .distance(this.linkDistance)
      )
    // .force("x", d3.forceX())
    // .force("y", d3.forceY());

    this.ticked();
  }

  bindNodesData() {
    this.nodesContainer = this.nodesContainer
      .data(this.nodes)
      .join("g")
      .call(this.drag(this.simulation))

    this.nodesContainer.append('circle')
      .attr("r", 8.5)
      .on("click", (event, data) => {
        console.log("点击了节点", event, data);
        this.delete(data.id);
      });

    this.nodesContainer.append("text")
      .attr("x", -3)
      .attr("y", "1.7em")
      .text(d => d.id)
      // .clone(true).lower()
      .attr("fill", "#666")
      .attr("stroke", "#666")
      .attr("stroke-width", 1);
  }

  bindLinksData() {
    this.svgContainer
      .append('defs')
      .append('marker')
      .attr('id', 'Triangle')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', '27')
      .attr('refY', '5')
      .attr('markerWidth', '5')
      .attr('markerHeight', '4')
      .attr('fill', '#fff')
      .attr('stroke', '#666')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')

    this.linksContainer = this.linksContainer
      .data(this.links)
      .join('path')
      .attr('marker-end', 'url(#Triangle)')
      .attr('marker-start', d => `url(#${d.source.id}-${d.target.id})`)
      .attr("stroke", d => '#666')
      .attr("fill", "none")
      .on("click", (event, data) => {
        console.log("点击了边", event, data);
      });
  }

  createLabelDefs() {
    let label = this.linksLabelContainer
      .append("defs")
      .selectAll('marker')
      .data(this.links)
      .join('marker')
      .attr('id', d =>  `${d.source.id}-${d.target.id}`)
      .attr('refX', '-30')
      .attr('refY', '4')
      .attr('markerWidth', '100')
      .attr('markerHeight', '8')
      .attr('orient', 'auto')
      .append('g')

    label.append('rect')
      .attr('fill', '#fff')
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('x', 1)
      .attr('y', 1)
      .attr('rx', 2)
      .attr('rx', 2)
      .attr('width', 20)
      .attr('height', 6)

    label.append('text')
      .attr('x', 4)
      .attr('y', 5.5)
      .attr('font-size', '4')
      .attr('fill', d => d.label ? '#333' : "red")
      .text(d => { return d.label || '缺失'})
  }

  deleteNode(id) {
    this.nodes = this.nodes.filter((n) => {
      return n.id !== id;
    });
  }

  deleteLink(links) {
    // 根据index删除
    this.links = this.links.filter((l) => {
      return !links.some((rl) => rl.index === l.index);
    });
  }

  // 个性操作: Node
  append(nodes, links = []) {
    this.nodes = this.nodes.concat(nodes);
    this.links = this.links.concat(links);

    this.bindNodesData();
    this.bindLinksData();

    this.reDraw();
  }

  delete(id) {
    this.deleteNode(id);
    this.deleteLink(
      this.links.filter((l) => {
        return l.source.id === id || l.target.id === id;
      })
    );

    this.bindNodesData();
    this.bindLinksData();

    // 是否启动re-draw
    this.reDraw();
  }

  edit() { }
}


function linkArc(d, {
  isArc, radius = 500
}) {
  const r = isArc ? Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y) + radius : 0;
  return `
    M${d.source.x},${d.source.y}
    A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
  `;
}