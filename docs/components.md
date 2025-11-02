# React Components

This document provides an overview of the React components used in the social graph visualizer.

## Application Components

These components are located in `src/`.

### `App`

The `App` component is the main component of the application. It is responsible for:

-   Loading the YAML data from `public/graph.yml` or `localStorage`.
-   Parsing the YAML data.
-   Managing the state of the application.
-   Rendering the `Layout` component.

**Props:**

-   None

## Layout Components

These components are located in `src/components/layouts`.

### `Layout`

The `Layout` component provides a two-column layout for the application.

**Props:**

-   `left`: The content to be displayed in the left column.
-   `right`: The content to be displayed in the right column.
-   `setSelectedPanel`: A function to set the selected panel.
-   `selectedPanel`: The currently selected panel.

### `Sidebar`

The `Sidebar` component displays a sidebar with buttons to toggle the different panels.

**Props:**

-   `isOpen`: A boolean to determine if the sidebar is open.
-   `selectedPanel`: The currently selected panel.
-   `setSelectedPanel`: A function to set the selected panel.

## Panel Components

These components are located in `src/components/panels`.

### `CodePanel`

The `CodePanel` component displays the YAML editor, and allows the user to upload and download the YAML file.

**Props:**

-   `value`: The YAML text to display in the editor.
-   `onChange`: A callback function that is called when the YAML text is changed.
-   `error`: An error message to display if the YAML is invalid.

### `ConnectionEditor`

The `ConnectionEditor` component provides a form to add and edit connections between people in the graph.

**Props:**

-   `yamlText`: The YAML text to be updated.
-   `setYamlText`: A function to update the YAML text.

### `InteractivePanel`

The `InteractivePanel` component provides a form to add and edit people in the graph.

**Props:**

-   `yamlText`: The YAML text to be updated.
-   `setYamlText`: A function to update the YAML text.

## UI Components

These components are located in `src/components/ui`.

### `Editor`

The `Editor` component is a wrapper around the CodeMirror editor. It is used to display and edit the YAML data.

**Props:**

-   `value`: The YAML text to display in the editor.
-   `onChange`: A callback function that is called when the YAML text is changed.

### `PersonForm`

The `PersonForm` component is a reusable form for adding and editing people.

**Props:**

-   `formData`: The form data.
-   `sectors`: A list of available sectors.
-   `colorGroups`: A list of available color groups.
-   `handleChange`: A function to handle form input changes.
-   `handleSubmit`: A function to handle form submission.
-   `buttonText`: The text to display on the submit button.

## View Components

These components are located in `src/components/view`.

### `D3Graph`

The `D3Graph` component is responsible for rendering the social graph using D3.js.

**Props:**

-   `graphData`: The parsed YAML data to be visualized.
