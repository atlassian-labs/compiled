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
    '5bd618uv': 'A',
    '1ydc18uv': 'B',
    '1ohyglyw': 'C',
    '49pcglyw': 'D',
    ra3xglyw: 'E',
    ksodglyw: 'F',
    q4asglyw: 'G',
    tpgfglyw: 'H',
    '1oxgru3m': 'I',
    '9h8h1e9r': 'J',
    f8pj1e9r: 'K',
    '30l31e9r': 'L',
    '10531e9r': 'M',
    '1jhpoyl8': 'N',
    '11usglyw': 'O',
    '11y7oza4': 'P',
    '11y7uu9g': 'Q',
    l82t7vkz: 'R',
    j7o07vkz: 'S',
    '1od57vkz': 'T',
    l82tgktf: 'U',
    j7o0gktf: 'V',
    yksp1ssb: 'W',
    '1b421ssb': 'X',
    s8ks18ws: 'Y',
    u1wz1nty: 'Z',
    hnu8tcjq: '_',
    jvpg11p5: 'aa',
    '1nwdwxkt': 'ba',
    '1vlxckbl': 'ca',
    kz8c16xz: 'da',
    '1jyu16xz': 'ea',
    '11et16xz': 'fa',
    fgkv16xz: 'ga',
    szna1wug: 'ha',
    '13on1wug': 'ia',
    '1f3k1wug': 'ja',
    inid1wug: 'ka',
    '12wp9ac1': 'la',
    jvpgglyw: 'ma',
    pbi4tcjq: 'na',
    '16b9tcjq': 'oa',
    jmaqtcjq: 'pa',
    '1q5htcjq': 'qa',
    '11x1tcjq': 'ra',
    '121jagmp': 'sa',
    '1bumglyw': 'ta',
    sedtglyw: 'ua',
    '14kw1hna': 'va',
    mc2h1hna: 'wa',
    '14fy1hna': 'xa',
    '1vdp1hna': 'ya',
    '17gjpfqs': 'za',
  };
  it('should generate class names as expected', () => {
    const result = generate(baseCSS);
    expect(result).toStrictEqual(baseResult);
  });

  it('should generate class names with the old compression map', () => {
    const oldCompressionMap: { [index: string]: string } = {
      '17gjpfqs': 'a',
      '1vdp1hna': 'b',
      '14fy1hna': 'c',
    };
    const result = generate(baseCSS, { oldClassNameCompressionMap: oldCompressionMap });
    for (const property in oldCompressionMap) {
      expect(result).toHaveProperty(property, oldCompressionMap[property]);
    }
  });

  it('should generate class names with prefix', () => {
    const result = generate(baseCSS, { prefix: '_' });
    expect(result).toStrictEqual({
      '154i14e6': '_a',
      '14tk72c6': '_b',
      '14n4stnw': '_c',
      '13h81y44': '_d',
      '1di6k6hx': '_e',
      irr3k6hx: '_f',
      jomrk6hx: '_g',
      '10j7k6hx': '_h',
      '1gg2glyw': '_i',
      '1o3iglyw': '_j',
      '1iohnqa1': '_k',
      '5goinqa1': '_l',
      jf4cnqa1: '_m',
      xatrnqa1: '_n',
      '1726nqa1': '_o',
      '1iqunqa1': '_p',
      '1ejunqa1': '_q',
      '1lwpnqa1': '_r',
      '6xf7nqa1': '_s',
      '1mb818uv': '_t',
      oga118uv: '_u',
      '1n2onqa1': '_v',
      '1k4fnqa1': '_w',
      '1nrm18uv': '_x',
      '1a3b18uv': '_y',
      '9oik18uv': '_z',
      '5bd618uv': '_A',
      '1ydc18uv': '_B',
      '1ohyglyw': '_C',
      '49pcglyw': '_D',
      ra3xglyw: '_E',
      ksodglyw: '_F',
      q4asglyw: '_G',
      tpgfglyw: '_H',
      '1oxgru3m': '_I',
      '9h8h1e9r': '_J',
      f8pj1e9r: '_K',
      '30l31e9r': '_L',
      '10531e9r': '_M',
      '1jhpoyl8': '_N',
      '11usglyw': '_O',
      '11y7oza4': '_P',
      '11y7uu9g': '_Q',
      l82t7vkz: '_R',
      j7o07vkz: '_S',
      '1od57vkz': '_T',
      l82tgktf: '_U',
      j7o0gktf: '_V',
      yksp1ssb: '_W',
      '1b421ssb': '_X',
      s8ks18ws: '_Y',
      u1wz1nty: '_Z',
      hnu8tcjq: '__',
      jvpg11p5: '_-',
      '1nwdwxkt': '_0',
      '1vlxckbl': '_1',
      kz8c16xz: '_2',
      '1jyu16xz': '_3',
      '11et16xz': '_4',
      fgkv16xz: '_5',
      szna1wug: '_6',
      '13on1wug': '_7',
      '1f3k1wug': '_8',
      inid1wug: '_9',
      '12wp9ac1': '_aa',
      jvpgglyw: '_ba',
      pbi4tcjq: '_ca',
      '16b9tcjq': '_da',
      jmaqtcjq: '_ea',
      '1q5htcjq': '_fa',
      '11x1tcjq': '_ga',
      '121jagmp': '_ha',
      '1bumglyw': '_ia',
      sedtglyw: '_ja',
      '14kw1hna': '_ka',
      mc2h1hna: '_la',
      '14fy1hna': '_ma',
      '1vdp1hna': '_na',
      '17gjpfqs': '_oa',
    });
  });
});
