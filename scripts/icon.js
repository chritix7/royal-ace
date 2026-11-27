// Chrysonyx icon artwork: gold "C" around a cut onyx (chrysos = gold, onyx). `node scripts/render.cjs` renders app/full/mask PNGs at 1024 px.
// builds icon SVG: mode "app" (rounded, border), "full" (full-bleed), "mask" (safe zone)
function svg(mode){
  const S=1024, c=S/2;
  const k = mode==="mask" ? 0.72 : mode==="full" ? 0.92 : 1;   // content scale
  // C ring: arc open on the right, angles in degrees (0 = right)
  const R=300, open=48, w=92;
  const p=a=>[c+R*Math.cos(a*Math.PI/180), c+R*Math.sin(a*Math.PI/180)];
  const [x1,y1]=p(-open), [x2,y2]=p(open);
  const ring=`M${x1} ${y1} A${R} ${R} 0 1 0 ${x2} ${y2}`;
  // serif terminals: short bars perpendicular to the ring end
  const term=a=>{const [x,y]=p(a); const up=a<0; const L=150; const x0=x+w*0.36;
    return `<rect x="${x0-17}" y="${up?y-L*0.62:y-L*0.38}" width="34" height="${L}" rx="4" fill="url(#g)"/>`;};
  // onyx gem: octagonal brilliant, top view
  const G=150, pts=[...Array(8)].map((_,i)=>{const a=(i*45+22.5)*Math.PI/180;return [c+G*Math.cos(a), c+G*Math.sin(a)];});
  const T=72, tbl=[...Array(8)].map((_,i)=>{const a=(i*45+22.5)*Math.PI/180;return [c+T*Math.cos(a), c+T*Math.sin(a)];});
  const poly=a=>a.map(q=>q.join(",")).join(" ");
  const facets=pts.map((q,i)=>`<line x1="${q[0]}" y1="${q[1]}" x2="${tbl[i][0]}" y2="${tbl[i][1]}"/>`).join("");
  const bg = mode==="app"
    ? `<rect x="8" y="8" width="${S-16}" height="${S-16}" rx="${S*0.22}" fill="url(#bg)"/>
       <rect x="44" y="44" width="${S-88}" height="${S-88}" rx="${S*0.19}" fill="none" stroke="url(#g)" stroke-width="10"/>
       <rect x="70" y="70" width="${S-140}" height="${S-140}" rx="${S*0.165}" fill="none" stroke="#d7b45b" stroke-opacity=".35" stroke-width="4"/>`
    : `<rect width="${S}" height="${S}" fill="url(#bg)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#1d1d20"/><stop offset="1" stop-color="#08080a"/></radialGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dc97"/><stop offset=".45" stop-color="#d7b45b"/><stop offset="1" stop-color="#9c7a2c"/></linearGradient>
    <linearGradient id="onyx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3a40"/><stop offset=".5" stop-color="#121214"/><stop offset="1" stop-color="#000"/></linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" result="b"/><feColorMatrix in="b" values="0 0 0 0 .84  0 0 0 0 .7  0 0 0 0 .35  0 0 0 .45 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  ${bg}
  <g transform="translate(${c} ${c}) scale(${k}) translate(${-c} ${-c})" filter="url(#glow)">
    <path d="${ring}" fill="none" stroke="url(#g)" stroke-width="${w}"/>

    <polygon points="${poly(pts)}" fill="url(#onyx)" stroke="url(#g)" stroke-width="16" stroke-linejoin="round"/>
    <g stroke="#d7b45b" stroke-opacity=".75" stroke-width="6">${facets}</g>
    <polygon points="${poly(tbl)}" fill="#1a1a1d" stroke="url(#g)" stroke-width="8"/>
    <path d="M${c-48} ${c-30} L${c-12} ${c-52}" stroke="#fff" stroke-opacity=".55" stroke-width="10" stroke-linecap="round"/>
  </g></svg>`;
}
module.exports=svg;
