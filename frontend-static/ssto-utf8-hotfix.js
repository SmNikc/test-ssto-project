// ssto-utf8-hotfix.js
(function(){
  // Detect typical mojibake (UTF-8 seen as ISO-8859-1/Win-1252)
  function looksMojibake(s){ return /(?:Ã|Ð|Ñ)/.test(s); }
  function fixString(s){
    try {
      var fixed = decodeURIComponent(escape(s));
      // if Cyrillic letters appeared, we consider it fixed
      if (/[А-Яа-яЁё]/.test(fixed)) return fixed;
      return s;
    } catch(e) { return s; }
  }
  function walk(node){
    if (node.nodeType === 3) { // text
      var t = node.nodeValue;
      if (t && looksMojibake(t)) {
        var f = fixString(t);
        if (f !== t) node.nodeValue = f;
      }
    } else if (node.nodeType === 1) {
      var tag = node.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
      for (var i=0; i<node.childNodes.length; i++) {
        walk(node.childNodes[i]);
      }
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    try {
      // Title
      if (looksMojibake(document.title)) document.title = fixString(document.title);
      // Body text nodes
      walk(document.body);
    } catch(err){
      console.error('UTF-8 hotfix error', err);
    }
  });
})();