# D3.js Visualization Logic

This document explains how the D3.js visualization works in the social graph visualizer.

## Overview

The visualization is built using the D3.js library and rendered as an SVG element. The process can be broken down into the following steps:

1.  **Data Processing**: The YAML data is processed and transformed into a format that D3.js can understand (nodes and links).
2.  **Simulation**: A D3.js force simulation is created to position the nodes in the graph.
3.  **Rendering**: The nodes, links, sectors, and circles are rendered as SVG elements.
4.  **Interaction**: User interactions like zooming, panning, and clicking are handled.

## Data Processing

The `processGraphDataForD3` function in `src/utils/d3-helper.js` is responsible for processing the YAML data. It takes the raw YAML data as input and returns an object with `nodes` and `links` arrays.

-   **Nodes**: The `nodes` array contains objects representing each person in the graph, including the center. Each node has properties like `id`, `name`, `sector`, `circle`, and `importance`.
-   **Links**: The `links` array contains objects representing the connections between people. Each link has `source` and `target` properties that correspond to the `id` of the connected nodes.

## Layout Logic

The layout of the graph is determined by a combination of the YAML configuration and the D3.js force simulation.

### Sectors

The graph is divided into sectors, which are radial wedges that represent different contexts (e.g., "Family", "Work"). The angle of each sector is defined in the `layout.sector_distribution` property in the YAML file.

**Diagram:**

```
      +------------------+
      |      Sector      |
      |        A         |
      +------------------+
      |      Sector      |
      |        B         |
      +------------------+
      |      Sector      |
      |        C         |
      +------------------+
```

### Circles

The graph has three concentric circles that represent the closeness of people to the center. The radius of each circle is defined in the `layout.positioning_rules.circle_radius` property in the YAML file.

**Diagram:**

```
      +------------------+
      |     Circle 1     |
      +------------------+
      |     Circle 2     |
      +------------------+
      |     Circle 3     |
      +------------------+
```

### Force Simulation

The `createSimulation` function in `src/utils/d3-helper.js` creates a D3.js force simulation to position the nodes. The simulation includes the following forces:

-   **Link Force**: Pushes linked nodes together or pulls them apart to a desired distance.
-   **Collision Force**: Prevents nodes from overlapping.
-   **Centering Force**: Keeps the nodes centered in the SVG element.

## Visual Encodings

The visual appearance of the graph is determined by the `display` property in the YAML file.

-   **Node Size**: The size of each node is determined by its `importance` and the `display.point_styles` configuration.
-   **Node Color**: The color of each node is determined by its `color_group` and the `display.colors` configuration.
-   **Link Style**: The style of each link (width and dash pattern) is determined by its `strength` and the `display.line_styles` configuration.

## User Interactions

The following user interactions are supported:

-   **Zoom and Pan**: Users can zoom in and out and pan the graph to explore it.
-   **Click**: When a user clicks on a node, an information panel is displayed with details about the person.
