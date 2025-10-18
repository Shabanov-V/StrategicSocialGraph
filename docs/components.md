# React Components

This document provides an overview of the React components used in the social graph visualizer.

## `App`

The `App` component is the main component of the application. It is responsible for:

-   Loading the YAML data from `public/graph.yml` or `localStorage`.
-   Parsing the YAML data.
-   Managing the state of the application.
-   Rendering the `Editor` and `D3Graph` components.

**Props:**

-   None

## `Editor`

The `Editor` component is a wrapper around the CodeMirror editor. It is used to display and edit the YAML data.

**Props:**

-   `value`: The YAML text to display in the editor.
-   `onChange`: A callback function that is called when the YAML text is changed.

## `D3Graph`

The `D3Graph` component is responsible for rendering the social graph using D3.js.

**Props:**

-   `graphData`: The parsed YAML data to be visualized.

## `Layout`

The `Layout` component is a simple component that provides a two-column layout for the application.

**Props:**

-   `left`: The content to be displayed in the left column.
-   `right`: The content to be displayed in the right column.
