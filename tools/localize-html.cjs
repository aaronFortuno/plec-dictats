// Translate the text and user-facing attributes of the application's static templates.
function localizeHTML(html, messages) {
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const translate = text => Object.hasOwn(messages, text) ? escape(messages[text]) : text;
  return html.replace(/<[^>]+>|[^<]+/gu, part => {
    if (!part.startsWith('<')) return part.replace(/\S(?:[\s\S]*\S)?/u, translate);
    return part.replace(/\b(aria-label|alt|placeholder|title|data-report-tooltip|content)="([^"]*)"/gu, (_, attribute, value) => {
      return attribute + '="' + translate(value) + '"';
    });
  });
}
module.exports = { localizeHTML };
