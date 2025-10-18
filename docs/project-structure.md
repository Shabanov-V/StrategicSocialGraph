# Project Structure

This document provides an overview of the files and directories in the social graph visualizer project.

## Root Directory

-   `/.git`: Contains the Git version control history.
-   `/docs`: Contains all the documentation for the project.
-   `/public`: Contains static assets that are served directly to the browser.
-   `/src`: Contains the source code for the React application.
-   `.gitignore`: Specifies which files and directories should be ignored by Git.
-   `README.md`: The main entry point for the project's documentation.
-   `eslint.config.js`: Configuration file for ESLint, a code linter.
-   `index.html`: The main HTML file for the application.
-   `package-lock.json`: Records the exact versions of the project's dependencies.
-   `package.json`: Lists the project's dependencies and scripts.
-   `vite.config.js`: Configuration file for Vite, the build tool.

## `/public` Directory

-   `/public/graph.yml`: The default YAML data file that is loaded on the first run.
-   `/public/vite.svg`: The Vite logo, used as a placeholder image.

## `/src` Directory

-   `/src/assets`: Contains static assets like images and fonts.
-   `/src/components`: Contains the React components for the application.
-   `/src/utils`: Contains utility functions that are used throughout the application.
-   `/src/App.css`: Global CSS styles for the application.
-   `/src/App.jsx`: The main application component.
-   `/src/App.module.css`: CSS modules for the `App` component.
-   `/src/index.css`: Global CSS styles for the application.
-   `/src/main.jsx`: The entry point for the React application.
