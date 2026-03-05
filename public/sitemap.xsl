<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap - BookMe AI</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            background: linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%);
            color: #e0e0e0;
            margin: 0;
            padding: 40px 20px;
            min-height: 100vh;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
          }
          h1 {
            color: #3b82f6;
            font-size: 2rem;
            margin-bottom: 10px;
          }
          .description {
            color: #888;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            overflow: hidden;
          }
          th {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
            text-align: left;
            padding: 15px;
            font-weight: 600;
          }
          td {
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          tr:hover td {
            background: rgba(59, 130, 246, 0.1);
          }
          a {
            color: #60a5fa;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .priority {
            text-align: center;
          }
          .count {
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>XML Sitemap</h1>
          <p class="description">This sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs for BookMe AI.</p>
          <table>
            <tr>
              <th>URL</th>
              <th>Last Modified</th>
              <th>Change Freq</th>
              <th class="priority">Priority</th>
            </tr>
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <tr>
                <td>
                  <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                </td>
                <td><xsl:value-of select="sitemap:lastmod"/></td>
                <td><xsl:value-of select="sitemap:changefreq"/></td>
                <td class="priority"><xsl:value-of select="sitemap:priority"/></td>
              </tr>
            </xsl:for-each>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
