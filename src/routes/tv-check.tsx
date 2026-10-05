import { createFileRoute } from "@tanstack/react-router";

// Plain old-style script so it runs on any TV browser, even ones that can't run the main app.
const CHECK_SCRIPT = `
(function(){
  var out = document.getElementById('tvc-out');
  function row(k, v){ var d=document.createElement('div'); d.style.padding='6px 0'; d.style.borderBottom='1px solid #333'; d.appendChild(document.createTextNode(k+': '+v)); out.appendChild(d); }
  function yes(b){ return b ? 'yes' : 'NO'; }
  var ua = navigator.userAgent; var m = ua.match(/Chrome\\/(\\d+)/);
  row('Browser', ua);
  row('Chrome version', m ? m[1] : 'unknown');
  row('Screen', window.innerWidth + ' x ' + window.innerHeight);
  row('Modern scripts (module)', yes('noModule' in document.createElement('script')));
  row('Promise', yes(typeof Promise !== 'undefined'));
  row('fetch', yes(typeof fetch !== 'undefined'));
  row('CSS variables', yes(window.CSS && CSS.supports && CSS.supports('--a', '0')));
  row('Optional chaining', (function(){ try { new Function('var a={};return a?.b'); return 'yes'; } catch(e){ return 'NO'; } })());
  var appOk = document.documentElement.getAttribute('data-app-ready') === '1';
  setTimeout(function(){ row('Main app started', yes(document.documentElement.getAttribute('data-app-ready') === '1')); }, 4000);
  window.addEventListener('error', function(e){ row('Error', (e.message || 'unknown') + ' @ ' + (e.filename || '') + ':' + (e.lineno || '')); });
})();`;

export const Route = createFileRoute("/tv-check")({
  head: () => ({
    meta: [
      { title: "TV Check — Lumiere" },
      { name: "description", content: "Check whether your TV's browser can run Lumiere." },
      { property: "og:title", content: "TV Check — Lumiere" },
      { property: "og:description", content: "A quick compatibility check for smart TV browsers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TvCheck,
});

function TvCheck() {
  return (
    <div className="min-h-screen bg-background px-6 pb-16 pt-28 text-foreground md:px-16">
      <h1 className="font-display text-4xl md:text-5xl">TV check</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Take a photo of this screen and send it so the TV version can be fixed.
      </p>
      <div id="tvc-out" className="mt-6 max-w-4xl break-all text-sm" />
      <script dangerouslySetInnerHTML={{ __html: CHECK_SCRIPT }} />
    </div>
  );
}
