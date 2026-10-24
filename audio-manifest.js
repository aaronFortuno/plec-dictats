/* Static audio manifest validation shared by the catalogue and student player. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecAudioManifest=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
  var BAD_SEGMENT = /^\.{1,2}$/;
  function validRelative(p, isBase) {
    if (typeof p !== "string" || p.length === 0) return false;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(p)) return false; // esquema/URL externa
    if (p.indexOf("\\") !== -1 || p.indexOf("?") !== -1 || p.indexOf("#") !== -1 ||
        p.indexOf("%") !== -1 || p.indexOf("//") !== -1) return false;
    if (/^[\x00-\x1f\x7f]|[\x00-\x1f\x7f]$/.test(p) || /[\x00-\x1f\x7f]/.test(p)) return false;
    if (!isBase && p.charAt(0) === "/") return false;
    var segs = p.split("/");
    for (var i = 0; i < segs.length; i++) {
      if (BAD_SEGMENT.test(segs[i])) return false;
      if (!isBase && segs[i] === "") return false;
      if (isBase && segs[i] === "" && i !== segs.length - 1) return false;
    }
    return true;
  }

  function coverage(manifest, entries, language, appBase, voice) {
    if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.packs)) {
      throw new Error("Manifest d'àudio invàlid.");
    }
    var pack = null, i;
    for (i = 0; i < manifest.packs.length; i++) {
      var p = manifest.packs[i];
      if (!p || typeof p !== "object" || Array.isArray(p)) {
        throw new Error("Manifest d'àudio invàlid.");
      }
    }
    if (voice) {
      for (i = 0; i < manifest.packs.length; i++) {
        if (manifest.packs[i].id === voice) { pack = manifest.packs[i]; break; }
      }
      if (!pack) throw new Error("La veu sol·licitada no existeix al manifest.");
    } else {
      var defId = manifest.defaultPacks && manifest.defaultPacks[language];
      for (i = 0; i < manifest.packs.length; i++) {
        if (manifest.packs[i].id === defId) { pack = manifest.packs[i]; break; }
      }
      if (!pack) throw new Error("No hi ha paquet d'àudio per a aquesta llengua.");
    }
    if (pack.language !== language) {
      throw new Error("El paquet d'àudio és d'una altra llengua.");
    }
    var basePath = pack.basePath;
    if (!validRelative(basePath, true) || basePath.slice(-1) !== "/") {
      throw new Error("La basePath del paquet d'àudio no és vàlida.");
    }
    var files = pack.files;
    if (!files || typeof files !== "object" || Array.isArray(files)) {
      throw new Error("El mapa de fitxers del paquet no és vàlida.");
    }
    var urls = [], missing = 0;
    for (i = 0; i < entries.length; i++) {
      var f = files[entries[i].id];
      if (f === undefined || f === null) { urls.push(null); missing++; continue; }
      if (!validRelative(f, false) || f.slice(-4) !== ".mp3") {
        throw new Error("El camí d'un fitxer d'àudio no és vàlid.");
      }
      var rel = basePath.split("/").map(function (s) {
        return s ? encodeURIComponent(s) : s;
      }).join("/") + f.split("/").map(encodeURIComponent).join("/");
      urls.push(new URL(rel, appBase).href);
    }
    return {
      ready: pack.status === "ready" && missing === 0,
      missing: missing,
      urls: urls,
      pack: pack
    };
  }


return {coverage:coverage};
});
