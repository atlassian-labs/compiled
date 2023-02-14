import { generateCompressionMap as generate } from '../generate-compression-map';

describe('generate compression map', () => {
  const baseCSS = `
    ._154i14e6{top:33px}
    ._14tk72c6>div:not([role=group])>a{padding-left:18.6px}
    ._14n4stnw._14n4stnw{position:absolute}
    ._13h81y44 span[role=button]{padding-top:4px}
    ._1di6k6hx:active, ._irr3k6hx:hover{background-color:var(--ds-background-neutral-subtle-hovered,#091e420a)}
    ._1di6k6hx:active, ._jomrk6hx:focus, ._10j7k6hx:focus-within, ._irr3k6hx:hover{background-color:var(--ds-background-neutral-subtle-hovered,#091e420a)}
    ._1gg2glyw>a:active, ._1o3iglyw>a[aria-current=page]{-webkit-text-decoration-line:none;text-decoration-line:none}
    ._1iohnqa1:active, ._5goinqa1:focus, ._jf4cnqa1:hover{-webkit-text-decoration-style:solid;text-decoration-style:solid}
    ._1iohnqa1:active, ._jf4cnqa1:hover, ._xatrnqa1:link, ._1726nqa1:visited{-webkit-text-decoration-style:solid;text-decoration-style:solid}
    ._1iqunqa1._1iqunqa1:active, ._1ejunqa1._1ejunqa1:hover, ._1lwpnqa1._1lwpnqa1:visited{-webkit-text-decoration-style:solid;text-decoration-style:solid}
    ._1iqunqa1._1iqunqa1:active, ._6xf7nqa1._6xf7nqa1:focus, ._1ejunqa1._1ejunqa1:hover, ._1lwpnqa1._1lwpnqa1:visited{-webkit-text-decoration-style:solid;text-decoration-style:solid}
    ._1mb818uv>a:active, ._oga118uv>a[aria-current=page]{-webkit-text-decoration-color:initial;text-decoration-color:initial}
    ._1n2onqa1>a:active, ._1k4fnqa1>a[aria-current=page]{-webkit-text-decoration-style:solid;text-decoration-style:solid}
    ._1nrm18uv:active, ._1a3b18uv:focus, ._9oik18uv:hover{-webkit-text-decoration-color:initial;text-decoration-color:initial}
    ._1nrm18uv:active, ._9oik18uv:hover, ._5bd618uv:link, ._1ydc18uv:visited{-webkit-text-decoration-color:initial;text-decoration-color:initial}
    ._1ohyglyw:active, ._49pcglyw:focus, ._ra3xglyw:focus-visible, ._ksodglyw:hover{outline-style:none}
    ._1ohyglyw:active, ._ksodglyw:hover, ._q4asglyw:link, ._tpgfglyw:visited{outline-style:none}
    ._1oxgru3m:active{transition-duration:0s}
    ._9h8h1e9r:active, ._f8pj1e9r:focus, ._30l31e9r:hover, ._10531e9r:visited{color:var(--ds-text-subtlest,#7a869a)}
    @media screen and (min-width:1300px){._1jhpoyl8{max-width:10vw}}
    @media (max-width:1199px){._11usglyw{display:none}}
    @media (min--moz-device-pixel-ratio:2){._11y7oza4{max-width:510px}._11y7uu9g{max-width:840px}._l82t7vkz{border-left-width:1pc}._j7o07vkz{border-right-width:1pc}._1od57vkz._1od57vkz{border-left-width:1pc}._l82tgktf{border-left-width:20px}._j7o0gktf{border-right-width:20px}._yksp1ssb{width:50%}._1b421ssb{height:50%}._s8ks18ws{transform:scale(2)}._u1wz1nty{transform-origin:0 0}}
    @media (min-width:1000px) and (max-width:1439px){._hnu8tcjq{display:block!important}}
    @media (min-width:1200px){._jvpg11p5{display:grid}._1nwdwxkt{grid-template-columns:1fr 1fr}._1vlxckbl{grid-gap:3pc}._kz8c16xz{padding-top:6pc}._1jyu16xz{padding-right:6pc}._11et16xz{padding-bottom:6pc}._fgkv16xz{padding-left:6pc}._szna1wug{margin-top:auto}._13on1wug{margin-right:auto}._1f3k1wug{margin-bottom:auto}._inid1wug{margin-left:auto}._12wp9ac1{max-width:1400px}._jvpgglyw{display:none}}
    @media (min-width:1440px) and (max-width:1919px){._pbi4tcjq{display:block!important}}
    @media (min-width:1920px) and (max-width:2559px){._16b9tcjq{display:block!important}}
    @media (min-width:2560px) and (max-width:2999px){._jmaqtcjq{display:block!important}}
    @media (min-width:3000px){._1q5htcjq{display:block!important}}
    @media (min-width:800px) and (max-width:999px){._11x1tcjq{display:block!important}}
    @media (min-width:800px){._121jagmp{display:none!important}}
    @media (prefers-reduced-motion:reduce){._1bumglyw{animation:none}._sedtglyw{transition:none}}
    @media screen and (-webkit-min-device-pixel-ratio:0){._14kw1hna >textarea{word-break:break-word}._mc2h1hna{word-break:break-word}}
    @media screen and (-webkit-transition){._14fy1hna{word-break:break-word}._1vdp1hna >textarea{word-break:break-word}}
    @media screen and (max-height:400px){._17gjpfqs{position:static}}
    @media screen and (min-width:1300px){._1jhpoyl8{max-width:10vw}}
`;

  const baseResult = {
    '154i14e6': 'a',
    '14tk72c6': 'b',
    '14n4stnw': 'c',
    '13h81y44': 'd',
    '1di6k6hx': 'e',
    irr3k6hx: 'f',
    jomrk6hx: 'g',
    '10j7k6hx': 'h',
    '1gg2glyw': 'i',
    '1o3iglyw': 'j',
    '1iohnqa1': 'k',
    '5goinqa1': 'l',
    jf4cnqa1: 'm',
    xatrnqa1: 'n',
    '1726nqa1': 'o',
    '1iqunqa1': 'p',
    '1ejunqa1': 'q',
    '1lwpnqa1': 'r',
    '6xf7nqa1': 's',
    '1mb818uv': 't',
    oga118uv: 'u',
    '1n2onqa1': 'v',
    '1k4fnqa1': 'w',
    '1nrm18uv': 'x',
    '1a3b18uv': 'y',
    '9oik18uv': 'z',
    '5bd618uv': '_',
    '1ydc18uv': 'aa',
    '1ohyglyw': 'ba',
    '49pcglyw': 'ca',
    ra3xglyw: 'da',
    ksodglyw: 'ea',
    q4asglyw: 'fa',
    tpgfglyw: 'ga',
    '1oxgru3m': 'ha',
    '9h8h1e9r': 'ia',
    f8pj1e9r: 'ja',
    '30l31e9r': 'ka',
    '10531e9r': 'la',
    '1jhpoyl8': 'ma',
    '11usglyw': 'na',
    '11y7oza4': 'oa',
    '11y7uu9g': 'pa',
    l82t7vkz: 'qa',
    j7o07vkz: 'ra',
    '1od57vkz': 'sa',
    l82tgktf: 'ta',
    j7o0gktf: 'ua',
    yksp1ssb: 'va',
    '1b421ssb': 'wa',
    s8ks18ws: 'xa',
    u1wz1nty: 'ya',
    hnu8tcjq: 'za',
    jvpg11p5: '_a',
    '1nwdwxkt': 'ab',
    '1vlxckbl': 'bb',
    kz8c16xz: 'cb',
    '1jyu16xz': 'db',
    '11et16xz': 'eb',
    fgkv16xz: 'fb',
    szna1wug: 'gb',
    '13on1wug': 'hb',
    '1f3k1wug': 'ib',
    inid1wug: 'jb',
    '12wp9ac1': 'kb',
    jvpgglyw: 'lb',
    pbi4tcjq: 'mb',
    '16b9tcjq': 'nb',
    jmaqtcjq: 'ob',
    '1q5htcjq': 'pb',
    '11x1tcjq': 'qb',
    '121jagmp': 'rb',
    '1bumglyw': 'sb',
    sedtglyw: 'tb',
    '14kw1hna': 'ub',
    mc2h1hna: 'vb',
    '14fy1hna': 'wb',
    '1vdp1hna': 'xb',
    '17gjpfqs': 'yb',
  };
  it('should generate class names without the old compression map', () => {
    const result = generate(baseCSS);
    expect(result).toStrictEqual(baseResult);
  });

  it('should generate class names with the old compression map', () => {
    const oldCompressionMap: { [index: string]: string } = {
      '17gjpfqs': 'a',
      '1vdp1hna': 'b',
      '14fy1hna': 'c',
    };
    const result = generate(baseCSS, oldCompressionMap);
    for (const property in oldCompressionMap) {
      expect(result).toHaveProperty(property, oldCompressionMap[property]);
    }
  });
});
