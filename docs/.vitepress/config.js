const { head, nav, sidebar } = require('./configs/index.js');

export default {
  head: head,
  themeConfig: {
    logo: "/images/logo.png",
    siteTitle: "whatsapp-web.js",
    editLink: false,
    aside: false,
    lastUpdated: false,
    docFooter: {
      prev: false,
      next: false
    },
    nav: nav,
    sidebar: sidebar
  }
};