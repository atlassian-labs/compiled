use swc_core::ecma::ast::*;
use crate::types::TransformState;

fn base36_u32(mut v: u32) -> String {
    const DIGITS: &[u8; 36] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut buf = [0u8; 16];
    let mut i = buf.len();
    if v == 0 { return "0".to_string(); }
    while v > 0 {
        let rem = (v % 36) as usize;
        v /= 36;
        i -= 1;
        buf[i] = DIGITS[rem];
    }
    String::from_utf8(buf[i..].to_vec()).unwrap()
}

// MurmurHash2 (Gary Court JS port semantics) over bytes, seed=0, returning base36 string
fn mulmix_32(x: u32) -> u32 {
    // Equivalent to (x & 0xffff) * m + ((((x >>> 16) * m) & 0xffff) << 16) with u32 wrapping
    let m: u32 = 0x5bd1e995;
    let lo = (x & 0xffff).wrapping_mul(m);
    let hi = (((x >> 16).wrapping_mul(m)) & 0xffff) << 16;
    lo.wrapping_add(hi)
}

fn murmurhash2_gc_js_units(input: &str, seed: u32) -> u32 {
    // Port of garycourt murmurhash2_gc.js on JS UTF-16 code units with low-8 packing
    // Streaming variant: avoids allocating the full Vec<u16>
    let len_units: usize = input.encode_utf16().count();
    let mut h: u32 = seed ^ (len_units as u32);

    let mut iter = input.encode_utf16();
    loop {
        let u0 = match iter.next() { Some(u) => u, None => break };
        let u1 = iter.next();
        let u2 = iter.next();
        let u3 = iter.next();
        let b0 = (u0 & 0x00ff) as u32;
        match (u1.map(|v| (v & 0x00ff) as u32), u2.map(|v| (v & 0x00ff) as u32), u3.map(|v| (v & 0x00ff) as u32)) {
            (Some(b1), Some(b2), Some(b3)) => {
                let mut k: u32 = b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
                k = mulmix_32(k);
                k ^= k >> 24;
                k = mulmix_32(k);
                h = mulmix_32(h) ^ k;
            }
            (Some(b1), Some(b2), None) => {
                h ^= b2 << 16;
                h ^= b1 << 8;
                h ^= b0;
                h = mulmix_32(h);
                break;
            }
            (Some(b1), None, None) => {
                h ^= b1 << 8;
                h ^= b0;
                h = mulmix_32(h);
                break;
            }
            (None, None, None) => {
                h ^= b0;
                h = mulmix_32(h);
                break;
            }
            _ => unreachable!(),
        }
    }
    h ^= h >> 13;
    h = mulmix_32(h);
    h ^= h >> 15;
    h
}

fn hash_js_low8(input: &str) -> String { base36_u32(murmurhash2_gc_js_units(input, 0)) }

#[allow(dead_code)]

pub fn hash(input: &str) -> String { hash_js_low8(input) }

pub fn generate_css_hash(input: &str) -> String { format!("_{}", hash(input)) }

pub fn build_class_name(hash: &str, prefix: Option<&str>) -> String { match prefix { Some(p) => format!("{}{}", p, hash), None => hash.to_string(), } }

fn slice_first_4(input: &str) -> String { if input.len() <= 4 { input.to_string() } else { input[0..4].to_string() } }

fn property_from_declaration(decl: &str) -> &str { match decl.find(':') { Some(idx) => decl[..idx].trim(), None => decl } }

fn value_from_declaration(decl: &str) -> &str { match decl.find(':') { Some(idx) => decl[idx + 1..].trim(), None => "" } }

fn normalized_selectors(selector_suffix: &Option<String>) -> String {
    match selector_suffix {
        Some(suf) => {
            let trimmed = suf.trim();
            if trimmed.is_empty() { "&".to_string() }
            else if trimmed.contains('&') { trimmed.to_string() }
            else if trimmed.starts_with(':') { format!("& {}", trimmed) }
            else { format!("& {}", trimmed) }
        }
        None => "&".to_string(),
    }
}

fn extract_at_rule_label(at_rule_css: &str) -> String {
    // Convert a CSS at-rule chain like "@media screen and (min-width: 600px){...}"
    // into a label string "mediascreen and (min-width: 600px)" like Babel's atomicify.
    let mut out = String::new();
    let bytes = at_rule_css.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'@' {
            i += 1;
            let name_start = i;
            while i < bytes.len() && ((bytes[i] as char).is_ascii_alphabetic() || bytes[i] == b'-') { i += 1; }
            let name = &at_rule_css[name_start..i];
            // skip spaces
            while i < bytes.len() && (bytes[i] as char).is_ascii_whitespace() { i += 1; }
            let params_start = i;
            while i < bytes.len() && bytes[i] != b'{' { i += 1; }
            let mut params = at_rule_css[params_start..i].to_string();
            // Trim any whitespace at both ends similar to PostCSS serialization used by Babel
            params = params.trim().to_string();
            if name == "supports" {
                // PostCSS normalizes some whitespace; match Babel label by stripping spaces
                params = params.replace(' ', "");
            } else if name == "media" {
                // Match Babel label formatting for media params by removing spaces around ':' in features
                // e.g. "screen and (min-width: 600px)" -> "screen and (min-width:600px)"
                // Do not alter other spacing (e.g. around 'and').
                params = params.replace(": ", ":").replace(" :", ":");
            } else if name == "container" {
                // Keep container params spacing as-is to mirror Babel (no extra normalization)
            }
            out.push_str(name);
            out.push_str(&params);
            if i < bytes.len() && bytes[i] == b'{' { i += 1; }
        } else {
            i += 1;
        }
    }
    out
}

fn sanitize_at_rule_label_for_styled(label: &str) -> String {
    let trimmed = label.trim_end_matches('}');
    let len = trimmed.len();
    if len > 0 && len % 2 == 0 {
        let mid = len / 2;
        let (a, b) = trimmed.split_at(mid);
        if a == b { return a.to_string(); }
    }
    trimmed.to_string()
}

fn atomic_class_name_for_rule(rule: &AtomicRule, class_hash_prefix: Option<&str>) -> String {
    let mut selectors = normalized_selectors(&rule.selector_suffix);
    // For css-prop path, normalize attribute selector spacing: '&[x]' -> '& [x]'
    if !rule.is_styled && selectors.starts_with("&[") {
        selectors = selectors.replacen("&[", "& [", 1);
    }
    // Keep '&:pseudo' as-is; Babel group hashing uses '&:pseudo' (no space)
    let at_rule_label_raw = rule
        .at_rule
        .as_deref()
        .map(extract_at_rule_label)
        .unwrap_or_else(|| "".to_string());
    // In Babel, label building for nested at-rules concatenates names/params in nesting order, e.g.
    // supports(display:grid)media screen and (min-width: 600px)
    // Our extract_at_rule_label already produces a stable string per level; sanitize only for styled duplication.
    let at_rule_label = if rule.is_styled { sanitize_at_rule_label_for_styled(&at_rule_label_raw) } else { at_rule_label_raw.clone() };
    let property = property_from_declaration(&rule.declaration);
    // Hashing selector normalization: Babel sometimes uses "&:pseudo" (no space) when inside at-rules
    // even if top-level css-prop hashing used "& :pseudo". Mirror that by collapsing "& :" -> "&:" only
    // for hashing when an at-rule label exists. Do not alter the emitted selector text elsewhere.
    let selectors_for_hash = if !at_rule_label_raw.is_empty() {
        selectors.replace("& :", "&:")
    } else {
        selectors.clone()
    };
    let prefix = class_hash_prefix.unwrap_or("");
    // Babel atomicify passes raw opts.atRule into template without defaulting to '',
    // which coerces undefined into the string "undefined". Mirror that for styled mode.
    // Mirror Babel atomicify: opts.atRule is interpolated into a template, coercing undefined -> "undefined".
    // Apply this consistently for both styled and css-prop paths when no at-rule label exists.
    let at_for_group = if at_rule_label.is_empty() { "undefined" } else { &at_rule_label };
    // For cssMap path we normalize a synthesized '&' to include a space before selector text when the selector
    // begins with non-ampersand (e.g. "screen and(min-width: 600px):hover") to match Babel's "& screen and(min-width: 600px):hover".
    if !rule.is_styled {
        if let Some(suf) = &rule.selector_suffix {
            if suf.starts_with('s') { selectors = format!("& {}", suf); let _ = &selectors; }
        }
    }
    let group_input = format!("{}{}{}{}", prefix, at_for_group, selectors_for_hash, property);
    // Always mirror Babel murmur2_gc semantics over JS charCodeAt low-8 units
    let group_hash = slice_first_4(&hash(&group_input));
    let raw_value = value_from_declaration(&rule.declaration);
    // For hashing, mirror Babel behavior observed in plugin logs:
    // valueForHash = node.value + node.important (boolean) when !important is present (case-insensitive, extra spaces allowed),
    // otherwise just the raw value. Eg: "redtrue" instead of "red!important".
    let value_for_hash = {
        let trimmed = raw_value.trim_end();
        const IMP: &str = "!important";
        if trimmed.len() >= IMP.len() && trimmed[trimmed.len() - IMP.len()..].eq_ignore_ascii_case(IMP) {
            let base = &trimmed[..trimmed.len() - IMP.len()];
            format!("{}{}", base.trim_end(), "true")
        } else {
            raw_value.to_string()
        }
    };
    let value_hash = slice_first_4(&hash(&value_for_hash));
    
    format!("_{}{}", group_hash, value_hash)
}

fn pseudo_score(selector_suffix: &Option<String>) -> i32 {
    const STYLE_ORDER: [&str; 7] = [":link", ":visited", ":focus-within", ":focus", ":focus-visible", ":hover", ":active"]; 
    if let Some(suffix) = selector_suffix { for (idx, pseudo) in STYLE_ORDER.iter().enumerate() { if suffix.ends_with(pseudo) { return (idx as i32) + 1; } } } 0
}

pub fn camel_to_kebab_case(input: &str) -> String {
    let mut result = String::with_capacity(input.len() + 4);
    for ch in input.chars() {
        if ch.is_ascii_uppercase() {
            result.push('-');
            result.push(ch.to_ascii_lowercase());
        } else {
            result.push(ch);
        }
    }
    result
}

#[derive(Debug, Clone)]
pub struct AtomicRule { pub selector_suffix: Option<String>, pub at_rule: Option<String>, pub declaration: String, pub is_styled: bool, pub from_ampersand: bool }

fn number_to_css_value(property_name: &str, num_lit: &Number) -> String {
    let value = if num_lit.value.fract() == 0.0 { format!("{}", num_lit.value as i64) } else { format!("{}", num_lit.value) };
    if num_lit.value != 0.0 && needs_px_unit(property_name) && !value.contains("px") { format!("{}px", value) } else { value }
}

fn resolve_identifier<'a>(id: &Ident, state: &'a TransformState) -> &'a Expr {
    if let Some(expr) = state.const_bindings.get(&id.sym.to_string()) {
        return expr.as_ref();
    }
    panic!("Only local const variables are supported for CSS values");
}

fn fold_static_expr(expr: &Expr, state: &TransformState) -> Expr {
    match expr {
        Expr::Lit(Lit::Str(_)) | Expr::Lit(Lit::Num(_)) | Expr::Object(_) => expr.clone(),
        Expr::Ident(id) => {
            // If identifier references a compiled keyframes binding, inline its name
            if let Some(info) = state.keyframes_by_ident.get(&id.sym.to_string()) {
                return Expr::Lit(Lit::Str(Str { span: id.span, value: info.name.clone().into(), raw: None }));
            }
            let resolved = resolve_identifier(id, state);
            fold_static_expr(resolved, state)
        }
        Expr::Tpl(tpl) => {
            // Concatenate if all parts are statically resolvable to strings
            let mut out = String::new();
            let mut ok = true;
            for (i, quasis) in tpl.quasis.iter().enumerate() {
                // In our swc version, raw is a JsWord (Atom) and cooked is Option<JsWord>
                out.push_str(&quasis.raw.to_string());
                if let Some(expr_item) = tpl.exprs.get(i) {
                    let folded = fold_static_expr(expr_item, state);
                    match folded {
                        Expr::Lit(Lit::Str(s)) => out.push_str(&s.value),
                        Expr::Lit(Lit::Num(n)) => {
                            let v = if n.value.fract() == 0.0 { format!("{}", n.value as i64) } else { format!("{}", n.value) };
                            out.push_str(&v);
                        }
                        _ => { ok = false; break; }
                    }
                }
            }
            if ok { Expr::Lit(Lit::Str(Str { span: tpl.span, value: out.into(), raw: None })) } else { expr.clone() }
        }
        Expr::Bin(bin) => {
            if bin.op == BinaryOp::Add {
                let left = fold_static_expr(&bin.left, state);
                let right = fold_static_expr(&bin.right, state);
                match (&left, &right) {
                    (Expr::Lit(Lit::Num(a)), Expr::Lit(Lit::Num(b))) => {
                        let v = a.value + b.value;
                        return Expr::Lit(Lit::Num(Number { span: bin.span, value: v, raw: None }));
                    }
                    _ => {
                        // Try string concatenation
                        let to_string = |e: &Expr| -> Option<String> {
                            match e {
                                Expr::Lit(Lit::Str(s)) => Some(s.value.to_string()),
                                Expr::Lit(Lit::Num(n)) => Some(if n.value.fract() == 0.0 { format!("{}", n.value as i64) } else { format!("{}", n.value) }),
                                _ => None,
                            }
                        };
                        if let (Some(ls), Some(rs)) = (to_string(&left), to_string(&right)) {
                            return Expr::Lit(Lit::Str(Str { span: bin.span, value: format!("{}{}", ls, rs).into(), raw: None }));
                        }
                        expr.clone()
                    }
                }
            } else {
                expr.clone()
            }
        }
        Expr::Paren(p) => fold_static_expr(&p.expr, state),
        _ => expr.clone(),
    }
}

fn collect_atomic_rules_from_object(obj: &ObjectLit, parent_selector: Option<String>, parent_at_rule: Option<String>, out: &mut Vec<AtomicRule>, state: &TransformState, styled_mode: bool, came_from_ampersand: bool) {
    for prop in &obj.props {
        match prop {
            PropOrSpread::Prop(prop_box) => if let Prop::KeyValue(kv) = prop_box.as_ref() {
            let key_name = match &kv.key { PropName::Ident(ident) => ident.sym.to_string(), PropName::Str(str_lit) => str_lit.value.to_string(), _ => continue };
            let base_expr: &Expr = match &*kv.value {
                Expr::Ident(id) => {
                    // If this ident is a keyframes reference, keep as Ident so folding can inline name
                    if state.keyframes_by_ident.contains_key(&id.sym.to_string()) { &*kv.value }
                    else { resolve_identifier(id, state) }
                }
                other => other
            };
            let folded_expr = fold_static_expr(base_expr, state);
            match &folded_expr {
                Expr::Lit(Lit::Str(str_lit)) => {
                    let css_property = camel_to_kebab_case(&key_name);
                    let value_str = str_lit.value.to_string();
                    let value_norm = normalize_value_important(&value_str);
                    // Always expand padding/margin shorthands into longhands
                    if css_property == "padding" || css_property == "margin" {
                        if let Some(expanded_vals) = maybe_expand_shorthand(&css_property, &value_norm) {
                            for (prop, val) in expanded_vals {
                                let valn = normalize_value_important(&val);
                                out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", prop, valn), is_styled: styled_mode, from_ampersand: came_from_ampersand });
                            }
                        }
                    } else {
                        out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", css_property, value_norm), is_styled: styled_mode, from_ampersand: came_from_ampersand });
                    }
                }
                Expr::Lit(Lit::Num(num_lit)) => {
                    let css_property = camel_to_kebab_case(&key_name);
                    let value = number_to_css_value(&key_name, num_lit);
                    // Always expand padding/margin shorthands into longhands
                    if css_property == "padding" || css_property == "margin" {
                        if let Some(expanded_vals) = maybe_expand_shorthand(&css_property, &value) {
                            for (prop, val) in expanded_vals {
                                let valn = normalize_value_important(&val);
                                out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", prop, valn), is_styled: styled_mode, from_ampersand: came_from_ampersand });
                            }
                        }
                    } else {
                        let valn = normalize_value_important(&value);
                        out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", css_property, valn), is_styled: styled_mode, from_ampersand: came_from_ampersand });
                    }
                }
                Expr::Object(nested_obj) => {
                    if key_name.starts_with("&:") { let pseudo = &key_name[1..]; let next_sel = match &parent_selector { Some(ps) => Some(format!("{}{}", ps, pseudo)), None => Some(pseudo.to_string()), }; collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out, state, styled_mode, true); }
                    else if key_name.starts_with('&') { let suffix = &key_name[1..]; let next_sel = match &parent_selector { Some(ps) => Some(format!("{}{}", ps, suffix)), None => Some(suffix.to_string()), }; collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out, state, styled_mode, true); }
                    else if key_name.starts_with(":") {
                        // For styled objects prefer '&:pseudo'; for css-prop also synthesize '&:pseudo' when top-level to mirror pre-processing in Babel pipeline
                        let (next_sel, added_ampersand) = if styled_mode {
                            match &parent_selector {
                                Some(ps) => (Some(format!("{}{}", ps, key_name)), false),
                                None => (Some(format!("&{}", key_name)), true),
                            }
                        } else {
                            match &parent_selector {
                                Some(ps) => (Some(format!("{}{}", ps, key_name)), false),
                                None => (Some(format!("&{}", key_name)), true),
                            }
                        };
                        collect_atomic_rules_from_object(
                            nested_obj,
                            next_sel,
                            parent_at_rule.clone(),
                            out,
                            state,
                            styled_mode,
                            came_from_ampersand || added_ampersand,
                        );
                    }
                    else if key_name.starts_with("[") {
                        // Attribute selector nesting, normalize like css-prop path to '& [attr=val]'
                        let next_sel = match &parent_selector { Some(ps) => Some(format!("{}{}", ps, key_name)), None => Some(key_name.clone()) };
                        collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out, state, styled_mode, false);
                    }
                    else if parent_at_rule.as_ref().map(|ar| ar.contains("@media")).unwrap_or(false) && !(key_name.starts_with('@') || key_name.starts_with(':') || key_name.starts_with('&') || key_name.starts_with('[')) {
                        // In cssMap, keys under @media like 'screen and (min-width: 600px)' become part of the selector string
                        let media_part = key_name.replace(" (", "(");
                        let next_sel = match &parent_selector { Some(ps) => Some(format!("{} {}", ps, media_part)), None => Some(media_part) };
                        collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out, state, styled_mode, came_from_ampersand);
                    }
                    else if key_name.starts_with("@") {
                        let next_at = match &parent_at_rule {
                            Some(ar) => Some(format!("{}{{{}}}", ar, key_name)),
                            None => Some(key_name.clone()),
                        };
                        collect_atomic_rules_from_object(nested_obj, parent_selector.clone(), next_at, out, state, styled_mode, came_from_ampersand);
                    }
                    else { collect_atomic_rules_from_object(nested_obj, parent_selector.clone(), parent_at_rule.clone(), out, state, styled_mode, came_from_ampersand); }
                }
                _ => { continue; }
            }
        }
            PropOrSpread::Spread(spread) => {
                // Support spreading of const object values
                match spread.expr.as_ref() {
                    Expr::Ident(id) => {
                        let resolved = resolve_identifier(id, state);
                        if let Expr::Object(inner) = resolved {
                            collect_atomic_rules_from_object(inner, parent_selector.clone(), parent_at_rule.clone(), out, state, styled_mode, came_from_ampersand);
                        } else {
                            panic!("Only object constants can be spread into CSS objects");
                        }
                    }
                    _ => panic!("Only identifiers can be spread in CSS objects"),
                }
            }
        }
    }
}

pub fn build_atomic_rules_from_object_with_state(obj: &ObjectLit, state: &TransformState) -> Vec<AtomicRule> { let mut out = Vec::new(); collect_atomic_rules_from_object(obj, None, None, &mut out, state, true, false); out }

fn needs_px_unit(property: &str) -> bool { !is_unitless_property(property) }

fn is_unitless_property(property: &str) -> bool {
    matches!(property,
        "animationIterationCount" | "basePalette" | "borderImageOutset" | "borderImageSlice" | "borderImageWidth" |
        "boxFlex" | "boxFlexGroup" | "boxOrdinalGroup" | "columnCount" | "columns" | "flex" | "flexGrow" | "flexPositive" |
        "flexShrink" | "flexNegative" | "flexOrder" | "fontSizeAdjust" | "fontWeight" | "gridArea" | "gridRow" |
        "gridRowEnd" | "gridRowSpan" | "gridRowStart" | "gridColumn" | "gridColumnEnd" | "gridColumnSpan" | "gridColumnStart" |
        "lineClamp" | "lineHeight" | "opacity" | "order" | "orphans" | "tabSize" | "WebkitLineClamp" | "widows" | "zIndex" | "zoom" |
        "fillOpacity" | "floodOpacity" | "stopOpacity" | "strokeDasharray" | "strokeDashoffset" | "strokeMiterlimit" | "strokeOpacity" | "strokeWidth"
    )
}

pub fn build_atomic_rules_from_expression_with_state(expr: &Expr, state: &TransformState) -> Vec<AtomicRule> {
    match expr {
        Expr::Ident(id) => {
            let resolved = resolve_identifier(id, state);
            build_atomic_rules_from_expression_with_state(resolved, state)
        }
        Expr::Object(obj) => {
            let mut out = Vec::new();
            collect_atomic_rules_from_object(obj, None, None, &mut out, state, false, false);
            out
        },
        Expr::Lit(Lit::Str(str_lit)) => {
            let mut rules = Vec::new();
            for part in str_lit.value.split(';') {
                let trimmed = part.trim(); if trimmed.is_empty() { continue; }
                rules.push(AtomicRule { selector_suffix: None, at_rule: None, declaration: trimmed.to_string(), is_styled: false, from_ampersand: false });
            }
            rules
        }
        _ => Vec::new(),
    }
}

pub fn transform_atomic_rules_to_sheets(rules: &[AtomicRule]) -> (Vec<String>, Vec<String>) {
    let mut base: Vec<(String, String)> = Vec::with_capacity(rules.len());
    let mut pseudos: Vec<(String, String)> = Vec::new();
    let mut at_rules: Vec<(String, String)> = Vec::new();

    for rule in rules.iter() {
        let is_at = rule.at_rule.is_some();
        let is_pseudo = !is_at && pseudo_score(&rule.selector_suffix) != 0;
        let class_name = atomic_class_name_for_rule(rule, None);
        let sel_src = rule.selector_suffix.clone().unwrap_or_default();
        let sel_raw = if rule.is_styled { sel_src } else { sel_src.replace(' ', "") };
        let selector = if sel_raw.contains('&') { sel_raw.replace("&", &format!(".{}", class_name)) } else { format!(".{}{}", class_name, sel_raw) };
        let core = format!("{}{{{}}}", selector, compact_declaration(&rule.declaration));
        let css_text = if let Some(ar) = &rule.at_rule { format!("{}{{{}}}", ar, core) } else { core };
        if is_at {
            at_rules.push((css_text, class_name));
        } else if is_pseudo {
            pseudos.push((css_text, class_name));
        } else {
            base.push((css_text, class_name));
        }
    }

    let total = base.len() + pseudos.len() + at_rules.len();
    let mut sheets: Vec<String> = Vec::with_capacity(total);
    let mut class_names: Vec<String> = Vec::with_capacity(total);
    for (css, cn) in base { sheets.push(css); class_names.push(cn); }
    for (css, cn) in pseudos { sheets.push(css); class_names.push(cn); }
    for (css, cn) in at_rules { sheets.push(css); class_names.push(cn); }
    (sheets, class_names)
}

pub fn compact_declaration(decl: &str) -> String {
    // Remove spaces around ':' and before '!important'
    // Example: "color: red !important" -> "color:red!important"
    let mut out = String::new();
    if let Some(idx) = decl.find(':') {
        let prop = decl[..idx].trim();
        let mut val = decl[idx + 1..].trim().to_string();
        val = normalize_value_important(&val);
        out.push_str(prop);
        out.push(':');
        out.push_str(&val);
        return out;
    }
    decl.replace(' ', "")
}

fn normalize_value_important(val: &str) -> String {
    let trimmed = val.trim();
    if trimmed.ends_with("!important") {
        let base = &trimmed[..trimmed.len() - "!important".len()];
        format!("{}!important", base.trim_end())
    } else {
        trimmed.to_string()
    }
}

pub fn should_quote_content_value(raw: &str) -> bool {
    let v = raw.trim();
    if v.is_empty() { return true; }
    let first = v.chars().next().unwrap();
    let last = v.chars().last().unwrap();
    if (first == '\'' && last == '\'') || (first == '"' && last == '"') { return false; }
    // Keywords/functions that should not be quoted
    let lower = v.to_lowercase();
    let keywords = [
        "none", "inherit", "initial", "revert", "unset",
        "open-quote", "close-quote", "no-open-quote", "no-close-quote",
    ];
    if keywords.iter().any(|k| lower == *k) { return false; }
    let fn_prefixes = [
        "url(", "image-set(", "linear-gradient(", "counter(", "counters(", "attr("
    ];
    if fn_prefixes.iter().any(|p| lower.starts_with(p)) { return false; }
    // If value contains open-quote + counter(...) combined, do not quote
    if lower.contains("counter(") && lower.contains("open-quote") { return false; }
    true
}

pub fn maybe_quote_content_value(raw: &str) -> String {
    if should_quote_content_value(raw) {
        format!("\"{}\"", raw)
    } else {
        raw.to_string()
    }
}

fn expand_four_sides(base: &str, value: &str) -> Vec<(String, String)> {
    let tokens: Vec<&str> = value.split_whitespace().filter(|t| !t.is_empty()).collect();
    let (top, right, bottom, left) = match tokens.len() {
        0 => ("0", "0", "0", "0"),
        1 => (tokens[0], tokens[0], tokens[0], tokens[0]),
        2 => (tokens[0], tokens[1], tokens[0], tokens[1]),
        3 => (tokens[0], tokens[1], tokens[2], tokens[1]),
        _ => (tokens[0], tokens[1], tokens[2], tokens[3]),
    };
    let top_prop = match base { "padding" => "padding-top".to_string(), "margin" => "margin-top".to_string(), _ => base.to_string() };
    let right_prop = match base { "padding" => "padding-right".to_string(), "margin" => "margin-right".to_string(), _ => base.to_string() };
    let bottom_prop = match base { "padding" => "padding-bottom".to_string(), "margin" => "margin-bottom".to_string(), _ => base.to_string() };
    let left_prop = match base { "padding" => "padding-left".to_string(), "margin" => "margin-left".to_string(), _ => base.to_string() };
    vec![(top_prop, top.to_string()), (right_prop, right.to_string()), (bottom_prop, bottom.to_string()), (left_prop, left.to_string())]
}

fn maybe_expand_shorthand(property: &str, value_str: &str) -> Option<Vec<(String, String)>> {
    match property { "padding" | "margin" => Some(expand_four_sides(property, value_str)), _ => None }
}

