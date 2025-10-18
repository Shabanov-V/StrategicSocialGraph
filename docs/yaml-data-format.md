# YAML Data Format

The social graph visualizer is driven by a YAML file that defines the data and display settings. This document explains the structure and properties of this file.

## Root Level Properties

The YAML file has the following top-level properties:

-   `center`: The name of the central person in the graph.
-   `people`: A list of all the people in the social graph.
-   `peer_connections`: A list of connections between people in the graph.
-   `layout`: Configuration for the layout of the graph.
-   `display`: Configuration for the display of the graph.

## `center`

The `center` property is a simple string that defines the name of the central person.

**Example:**

```yaml
center: "Alex"
```

## `people`

The `people` property is a list of objects, where each object represents a person in the graph. Each person object has the following properties:

-   `id`: A unique identifier for the person.
-   `name`: The name of the person.
-   `sector`: The sector (context) the person belongs to (e.g., "Family", "Work").
-   `circle`: The closeness of the person to the center (1, 2, or 3).
-   `importance`: The importance of the person ("important" or "normal").
-   `strength`: The strength of the relationship with the center ("strong", "normal", or "weak").
-   `direction`: The direction of the relationship ("mutual", "from_center", or "to_center").
-   `quality`: The quality of the relationship ("positive", "neutral", or "negative").
-   `color_group`: The color group the person belongs to.

**Example:**

```yaml
people:
  - id: 1
    name: "Mom"
    sector: "Family"
    circle: 1
    importance: "important"
    strength: "strong"
    direction: "mutual"
    quality: "positive"
    color_group: "green"
```

## `peer_connections`

The `peer_connections` property is a list of objects, where each object represents a connection between two people in the graph. Each connection object has the following properties:

-   `from`: The name of the person the connection is from.
-   `to`: The name of the person the connection is to.
-   `strength`: The strength of the connection ("strong", "normal", or "weak").
-   `direction`: The direction of the connection ("mutual", "from_center", or "to_center").
-   `quality`: The quality of the connection ("positive", "neutral", or "negative").
-   `color_group`: The color group the connection belongs to.

**Example:**

```yaml
peer_connections:
  - from: "Mom"
    to: "Dad"
    strength: "strong"
    direction: "mutual"
    quality: "positive"
    color_group: "green"
```

## `layout`

The `layout` property is an object that contains the configuration for the layout of the graph. It has the following properties:

-   `sector_distribution`: An object that defines the angle (in degrees) for each sector.
-   `positioning_rules`: An object that defines the rules for positioning the nodes.
    -   `sort_by`: A list of properties to sort the people by within each sector.
    -   `angle_spread`: The angle (in degrees) to spread the people across within a sector.
    -   `circle_radius`: An object that defines the radius for each circle.

**Example:**

```yaml
layout:
  sector_distribution:
    Family: 60
    Work: 90
  positioning_rules:
    sort_by: ["circle", "importance", "name"]
    angle_spread: 55
    circle_radius:
      1: 180
      2: 260
      3: 340
```

## `display`

The `display` property is an object that contains the configuration for the display of the graph. It has the following properties:

-   `show_sector_labels`: A boolean that determines whether to show the sector labels.
-   `show_circles`: A boolean that determines whether to show the concentric circles.
-   `line_styles`: An object that defines the styles for the lines (connections).
-   `point_styles`: An object that defines the styles for the points (people).
-   `colors`: An object that defines the colors for the color groups.

**Example:**

```yaml
display:
  show_sector_labels: true
  show_circles: true
  line_styles:
    strong:
      width: 6
      style: "solid"
    normal:
      width: 2
      style: "solid"
    weak:
      width: 1
      style: "dashed"
  point_styles:
    important:
      size: 9
      style: "filled"
    normal:
      size: 5
      style: "filled"
  colors:
    red: "#FF6B6B"
    blue: "#4ECDC4"
```
