// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  docSidebar: [
      'introduction',
      'installation',
      {
          type: 'category',
          label: 'Building blocks',
          collapsed: false,
          collapsible: false,
          items: [
              'building-blocks/component',
              'building-blocks/module',
              'building-blocks/app',
              'building-blocks/endpoint',
              'building-blocks/view',
              'building-blocks/middleware',
              'building-blocks/repository',
          ]
      },
      'getting-started/dependency-injection',
      'getting-started/database-migrations',
      'getting-started/i18n',
      {
          type: 'category',
          label: 'Utilities',
          collapsed: false,
          collapsible: false,
          items: [
              'utils/sql-query-builder',
              'utils/template-engine',
          ]
      },
  ]
};

export default sidebars;
