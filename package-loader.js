/* GitHub Pages serves the compressed parts as ordinary binary files. */
function configurePortPackage(config, report, loadingFiles) {
  "use strict";
  const packed = {"dataUrl":{"decodedBytes":943626191,"compressedBytes":829252553,"sha256":"dd8722978dd34ba60ca63bc8f9740703768428a0b7e7bebc93490ce31e079598","parts":[{"path":"Build/web.data.dd8722978dd3.000.bin","bytes":50331648,"sha256":"6ada7634646edace2ad1241548a78b8436c6210800f412da3a3cdbe4541e9c9c"},{"path":"Build/web.data.dd8722978dd3.001.bin","bytes":50331648,"sha256":"f0773a486f7ca364a61ef27fd4e16061dfad9ad6947c30e99a335f49d1244bff"},{"path":"Build/web.data.dd8722978dd3.002.bin","bytes":50331648,"sha256":"4fd08f986f21d6212d591640edabae889617c33af96c9c745e685d10f4656312"},{"path":"Build/web.data.dd8722978dd3.003.bin","bytes":50331648,"sha256":"009bc8d62c6955a2b84a97e5df22d0b95bfd12286985c09778b2b30f0baba3ad"},{"path":"Build/web.data.dd8722978dd3.004.bin","bytes":50331648,"sha256":"3a7c20d611aaf971921079d321186e525ada6e19072f04640a0550117b8575a2"},{"path":"Build/web.data.dd8722978dd3.005.bin","bytes":50331648,"sha256":"18d4286130957352b1e177efd6424e69bbac068e8a6b0d0645d575e7df06de16"},{"path":"Build/web.data.dd8722978dd3.006.bin","bytes":50331648,"sha256":"82651f34167bd31d8862a02e74323a61867a9fb441e39d116764326d220b0392"},{"path":"Build/web.data.dd8722978dd3.007.bin","bytes":50331648,"sha256":"3cfab60ac751a5fc8d93b48c59cd1e121c3bebd2f3a460ea7b8b34434d047b9c"},{"path":"Build/web.data.dd8722978dd3.008.bin","bytes":50331648,"sha256":"d73e79d0e4649aa335dd4082100acdb67fc7b60892bb45b923f6ff46b25cb9e4"},{"path":"Build/web.data.dd8722978dd3.009.bin","bytes":50331648,"sha256":"cf96ad12e0d6433fb71270d965a2597dc35bf66ad5b9d881675b648a9cc4c3e5"},{"path":"Build/web.data.dd8722978dd3.010.bin","bytes":50331648,"sha256":"72686a449b569d4cbac4897719458756e61e75a9f4ee827650573a4c481d9130"},{"path":"Build/web.data.dd8722978dd3.011.bin","bytes":50331648,"sha256":"49e90fe0840cb2b0f38c6f9e17e5efa54a9cf4ca9accfb8ab1104a71abf778b2"},{"path":"Build/web.data.dd8722978dd3.012.bin","bytes":50331648,"sha256":"fa51bcbd460192be0146ab523bec2808444ec3a7d1be618f457fa87e3dffa06f"},{"path":"Build/web.data.dd8722978dd3.013.bin","bytes":50331648,"sha256":"a34385647b233c1f95daf049d95fe75419f188e406018e51f6e2716201d63687"},{"path":"Build/web.data.dd8722978dd3.014.bin","bytes":50331648,"sha256":"ae4e86f2089922346aba568f0ad65ee2d574534787adc631fe78febe22ddb1bd"},{"path":"Build/web.data.dd8722978dd3.015.bin","bytes":50331648,"sha256":"56a5835e1a03b80f95311077798bc43d73ff387896d5a02d33b232a969c83de0"},{"path":"Build/web.data.dd8722978dd3.016.bin","bytes":23946185,"sha256":"b2d2ec7a62cb945f5391b1f6e34e98ed134fdff9e1aa227ee2c24ace20f5c169"}],"contentType":"application/octet-stream"},"codeUrl":{"decodedBytes":106466123,"compressedBytes":19100472,"sha256":"aa3935c6823f5191f990614911693f38d18c45e18d28a7ad880f57790301ec79","parts":[{"path":"Build/web.wasm.aa3935c6823f.000.bin","bytes":19100472,"sha256":"8f3cd0c8efdbfcc82d9212c508baa58153912f74efe50eef1fabf743973da567"}],"contentType":"application/wasm"}};
  const nativeFetch = window.fetch.bind(window);
  const routes = new Map();
  Object.entries(packed).forEach(([key, spec]) => {
    routes.set(new URL(config[key], document.baseURI).href, { key, spec });
    loadingFiles[key].total = spec.compressedBytes;
  });
  // Browser HTTP caching handles the immutable parts. Avoid caching a second,
  // decoded gigabyte in Unity's own IndexedDB download cache.
  config.cacheControl = () => "no-store";
  config.onDownloadProgress = (key, progress) => {
    if (!packed[key]) report(key, progress);
  };
  config.portFetch = async (input, init) => {
    const address = new URL(typeof input === "string" ? input : input.url, document.baseURI).href;
    const route = routes.get(address);
    if (!route) return nativeFetch(input, init);
    const {key, spec} = route;
    const headers = {"Content-Type": spec.contentType, "Content-Length": String(spec.decodedBytes)};
    if (init && init.method === "HEAD") return new Response(null, {status:200, headers});
    if (!window.DecompressionStream) throw new Error("Please use a current browser with gzip decompression support.");
    let part = 0, reader = null, loaded = 0;
    const abort = new AbortController();
    if (init && init.signal) init.signal.addEventListener("abort", () => abort.abort(), {once:true});
    report(key, {loaded:0, total:spec.compressedBytes, lengthComputable:true});
    const compressed = new ReadableStream({
      async pull(controller) {
        try {
          for (;;) {
            if (!reader) {
              if (part === spec.parts.length) {
                report(key, {loaded, total:spec.compressedBytes, lengthComputable:true, finished:true});
                controller.close(); return;
              }
              const url = new URL(spec.parts[part].path, document.baseURI);
              const response = await nativeFetch(url, {signal:abort.signal});
              if (!response.ok) throw new Error("Could not load " + spec.parts[part].path + " (HTTP " + response.status + ")");
              reader = response.body.getReader();
            }
            const chunk = await reader.read();
            if (chunk.done) {reader.releaseLock(); reader = null; part++; continue;}
            loaded += chunk.value.byteLength;
            report(key, {loaded, total:spec.compressedBytes, lengthComputable:true});
            controller.enqueue(chunk.value); return;
          }
        } catch (error) {abort.abort(); controller.error(error);}
      },
      cancel(reason) {abort.abort(); if (reader) return reader.cancel(reason);}
    });
    return new Response(compressed.pipeThrough(new DecompressionStream("gzip")), {status:200, headers});
  };
}
