/* GitHub Pages serves the compressed parts as ordinary binary files. */
function configurePortPackage(config, report, loadingFiles) {
  "use strict";
  const packed = {"dataUrl":{"decodedBytes":943626223,"compressedBytes":829252537,"sha256":"2e6210f2342da5ffd98a672d57e7bf02e3b2b918d8ca2c5d2a1b5b2ce672b9e6","parts":[{"path":"Build/web.data.2e6210f2342d.000.bin","bytes":50331648,"sha256":"98b356fe91573d2db46a2e3c1f9599d689838e49d1bcc4e58f06188fb536e65b"},{"path":"Build/web.data.2e6210f2342d.001.bin","bytes":50331648,"sha256":"de3a17952a7996d9f479d811996cea8b5b25da5fe85674b52afe3631039da048"},{"path":"Build/web.data.2e6210f2342d.002.bin","bytes":50331648,"sha256":"c13a69e8c05c09377da1d51d3e1d0dc399435c2f9417a9363173ff54aedda42a"},{"path":"Build/web.data.2e6210f2342d.003.bin","bytes":50331648,"sha256":"adf6d465e672735694a03bcbc9dc2d9dbdf9f06b29bd7ce10cf84f9af2c5f3ee"},{"path":"Build/web.data.2e6210f2342d.004.bin","bytes":50331648,"sha256":"6fc237c6ff6b39d3dc2c79c7a85041237266fdd242ced8d54fe67c1a35d88cf0"},{"path":"Build/web.data.2e6210f2342d.005.bin","bytes":50331648,"sha256":"c3992326b0ff71099354e450595f52aca0351ce8431e2c455ce43b4b3499a404"},{"path":"Build/web.data.2e6210f2342d.006.bin","bytes":50331648,"sha256":"b0406a19263689722a8d9c0bf5ae790e3e22eb945ccfba8ec5e1bbc2fd7f1372"},{"path":"Build/web.data.2e6210f2342d.007.bin","bytes":50331648,"sha256":"89a9e43bbcd0b3bb39f9801bf960e54c89d544570d64c40da423ee5447678487"},{"path":"Build/web.data.2e6210f2342d.008.bin","bytes":50331648,"sha256":"612901a10cad1a3baf272317fdc97ed13b0605cfbaa7dd48e23d6b3c1b3a8ccd"},{"path":"Build/web.data.2e6210f2342d.009.bin","bytes":50331648,"sha256":"122f58b508ea4af5a2a79896db34b12631c94114f82fa5998e0f553a38dbb8e4"},{"path":"Build/web.data.2e6210f2342d.010.bin","bytes":50331648,"sha256":"4dcc6442f3a2b0df559302fd67d32a0ce4e732974a9db01fe44297710df2aaf1"},{"path":"Build/web.data.2e6210f2342d.011.bin","bytes":50331648,"sha256":"521a085afe801d455e23ce30f7bd687fc7c0432df3daa0294345b3f47b176d20"},{"path":"Build/web.data.2e6210f2342d.012.bin","bytes":50331648,"sha256":"12fd972e8cad7fdc5be8b607b5c0bf7e3e3b9e33442cf4c17fb73a19f276f6b2"},{"path":"Build/web.data.2e6210f2342d.013.bin","bytes":50331648,"sha256":"160629f8c26fb1f42249f9772ba71febf9a436fb3c94734219f639fbd06b441f"},{"path":"Build/web.data.2e6210f2342d.014.bin","bytes":50331648,"sha256":"ab9157c57fae177b50bc8cd53ac5371824ba426577b6efb4f6fe106ce6326f4e"},{"path":"Build/web.data.2e6210f2342d.015.bin","bytes":50331648,"sha256":"a696f1dbe5a7724ade980353ae718f485d52ded064ef22acb2936df4f1e075f2"},{"path":"Build/web.data.2e6210f2342d.016.bin","bytes":23946169,"sha256":"13fde75406c3d453faebf00133ca12b5059c2414391761bcb4e41b8994425ee7"}],"contentType":"application/octet-stream"},"codeUrl":{"decodedBytes":106466123,"compressedBytes":19100472,"sha256":"aa3935c6823f5191f990614911693f38d18c45e18d28a7ad880f57790301ec79","parts":[{"path":"Build/web.wasm.aa3935c6823f.000.bin","bytes":19100472,"sha256":"8f3cd0c8efdbfcc82d9212c508baa58153912f74efe50eef1fabf743973da567"}],"contentType":"application/wasm"}};
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
