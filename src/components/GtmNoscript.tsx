/** Noscript GTM — server component, justo después de &lt;body&gt;. */
export function GtmNoscript() {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!id) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height={0}
        width={0}
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
