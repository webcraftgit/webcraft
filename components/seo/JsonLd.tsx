/**
 * JSON-LD injector (CP4_17-seo).
 *
 * A server component on purpose: the graph must be in the HTML that arrives
 * from the server, not appended after hydration. Crawlers that do not execute
 * JavaScript — which includes several of the LLM fetchers — would otherwise
 * see nothing.
 *
 * CSP: this renders an inline <script>, which the policy in next.config.mjs
 * already permits via script-src 'unsafe-inline'. If that ever tightens to a
 * nonce, this component needs the nonce passed in.
 *
 * JSON.stringify, never a template string: a `</script>` sequence inside any
 * dictionary value would otherwise close the tag early. Escaping `<` closes
 * that hole, and JSON parsers read \u003c as `<` so the graph is unaffected.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
