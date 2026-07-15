/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://jakecastillo.github.io',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
}