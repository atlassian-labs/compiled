use swc_core::ecma::ast::*;
use crate::types::TransformState;

fn to_base36(mut num: u32) -> String {
    if num == 0 { return "0".to_string(); }
    let digits = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut result = Vec::new();
    while num > 0 { result.push(digits[(num % 36) as usize] as char); num /= 36; }
    result.reverse();
    result.into_iter().collect()
}

pub fn hash(input: &str) -> String { hash_murmurhash2(input, 0) }

pub fn generate_css_hash(input: &str) -> String { format!("_{}", hash(input)) }

fn hash_murmurhash2(s: &str, seed: u32) -> String {
    let utf16_chars: Vec<u16> = s.encode_utf16().collect();
    let mut l = utf16_chars.len() as u32;
    let mut h = seed ^ l;
    let mut i = 0;
    while l >= 4 {
        let mut k = (utf16_chars[i] as u32 & 0xff)
            | ((utf16_chars[i + 1] as u32 & 0xff) << 8)
            | ((utf16_chars[i + 2] as u32 & 0xff) << 16)
            | ((utf16_chars[i + 3] as u32 & 0xff) << 24);
        k = (k & 0xffff).wrapping_mul(0x5bd1e995)
            .wrapping_add(((k >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
        k ^= k >> 24;
        k = (k & 0xffff).wrapping_mul(0x5bd1e995)
            .wrapping_add(((k >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
        h = (h & 0xffff).wrapping_mul(0x5bd1e995)
            .wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
        h ^= k;
        l -= 4;
        i += 4;
    }
    match l {
        3 => { h ^= (utf16_chars[i + 2] as u32 & 0xff) << 16; h ^= (utf16_chars[i + 1] as u32 & 0xff) << 8; h ^= utf16_chars[i] as u32 & 0xff; h = (h & 0xffff).wrapping_mul(0x5bd1e995).wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16); }
        2 => { h ^= (utf16_chars[i + 1] as u32 & 0xff) << 8; h ^= utf16_chars[i] as u32 & 0xff; h = (h & 0xffff).wrapping_mul(0x5bd1e995).wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16); }
        1 => { h ^= utf16_chars[i] as u32 & 0xff; h = (h & 0xffff).wrapping_mul(0x5bd1e995).wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16); }
        _ => {}
    }
    h ^= h >> 13; h = (h & 0xffff).wrapping_mul(0x5bd1e995).wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16); h ^= h >> 15; to_base36(h)
}

pub fn build_class_name(hash: &str, prefix: Option<&str>) -> String { match prefix { Some(p) => format!("{}{}", p, hash), None => hash.to_string(), } }

fn slice_first_4(input: &str) -> String { if input.len() <= 4 { input.to_string() } else { input[0..4].to_string() } }

fn property_from_declaration(decl: &str) -> &str { match decl.find(':') { Some(idx) => decl[..idx].trim(), None => decl } }

fn value_from_declaration(decl: &str) -> &str { match decl.find(':') { Some(idx) => decl[idx + 1..].trim(), None => "" } }

fn compact_selector_suffix(input: &str) -> String {
    input.chars().filter(|c| !c.is_whitespace()).collect()
}

fn normalized_selectors(selector_suffix: &Option<String>) -> String {
    match selector_suffix {
        Some(suf) if !suf.is_empty() => format!("&{}", compact_selector_suffix(suf)),
        _ => "&".to_string(),
    }
}

fn atomic_class_name_for_rule(rule: &AtomicRule, class_hash_prefix: Option<&str>) -> String {
    let selectors = normalized_selectors(&rule.selector_suffix);
    let at_rule = rule.at_rule.as_deref().unwrap_or("");
    let property = property_from_declaration(&rule.declaration);
    let prefix = class_hash_prefix.unwrap_or("");
    let group_input = format!("{}{}{}{}", prefix, at_rule, selectors, property);
    let group_hash = slice_first_4(&hash(&group_input));
    let raw_value = value_from_declaration(&rule.declaration);
    let normalized_value = normalize_value_important(raw_value);
    let value_hash = slice_first_4(&hash(&normalized_value));
    format!("_{}{}", group_hash, value_hash)
}

fn pseudo_score(selector_suffix: &Option<String>) -> i32 {
    const STYLE_ORDER: [&str; 7] = [":link", ":visited", ":focus-within", ":focus", ":focus-visible", ":hover", ":active"]; 
    if let Some(suffix) = selector_suffix { for (idx, pseudo) in STYLE_ORDER.iter().enumerate() { if suffix.ends_with(pseudo) { return (idx as i32) + 1; } } } 0
}

pub fn camel_to_kebab_case(input: &str) -> String {
    let mut result = String::new();
    for ch in input.chars() { if ch.is_uppercase() { result.push('-'); result.push(ch.to_lowercase().next().unwrap()); } else { result.push(ch); } }
    result
}

#[derive(Debug, Clone)]
pub struct AtomicRule { pub selector_suffix: Option<String>, pub at_rule: Option<String>, pub declaration: String }

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

fn collect_atomic_rules_from_object(obj: &ObjectLit, parent_selector: Option<String>, parent_at_rule: Option<String>, out: &mut Vec<AtomicRule>, state: &TransformState) {
    for prop in &obj.props {
        match prop {
            PropOrSpread::Prop(prop_box) => if let Prop::KeyValue(kv) = prop_box.as_ref() {
            let key_name = match &kv.key { PropName::Ident(ident) => ident.sym.to_string(), PropName::Str(str_lit) => str_lit.value.to_string(), _ => continue };
            let base_expr: &Expr = match &*kv.value { Expr::Ident(id) => resolve_identifier(id, state), other => other };
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
                                out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", prop, valn) });
                            }
                        }
                    } else {
                        out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", css_property, value_norm) });
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
                                out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", prop, valn) });
                            }
                        }
                    } else {
                        let valn = normalize_value_important(&value);
                        out.push(AtomicRule { selector_suffix: parent_selector.clone(), at_rule: parent_at_rule.clone(), declaration: format!("{}:{}", css_property, valn) });
                    }
                }
                Expr::Object(nested_obj) => {
                    if key_name.starts_with("&:") { let pseudo = &key_name[1..]; let next_sel = match &parent_selector { Some(ps) => Some(format!("{}{}", ps, pseudo)), None => Some(pseudo.to_string()), }; collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out, state); }
                    else if key_name.starts_with('&') { let suffix = &key_name[1..]; let next_sel = match &parent_selector { Some(ps) => Some(format!("{}{}", ps, suffix)), None => Some(suffix.to_string()), }; collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out, state); }
                    else if key_name.starts_with(":") { let next_sel = match &parent_selector { Some(ps) => Some(format!("{}{}", ps, key_name)), None => Some(key_name.clone()), }; collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out, state); }
                    else if key_name.starts_with("@") { let next_at = match &parent_at_rule { Some(ar) => Some(format!("{}{{{}}}", key_name, ar)), None => Some(key_name.clone()), }; collect_atomic_rules_from_object(nested_obj, parent_selector.clone(), next_at, out, state); }
                    else { collect_atomic_rules_from_object(nested_obj, parent_selector.clone(), parent_at_rule.clone(), out, state); }
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
                            collect_atomic_rules_from_object(inner, parent_selector.clone(), parent_at_rule.clone(), out, state);
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

pub fn build_atomic_rules_from_object_with_state(obj: &ObjectLit, state: &TransformState) -> Vec<AtomicRule> { let mut out = Vec::new(); collect_atomic_rules_from_object(obj, None, None, &mut out, state); out }

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
        Expr::Object(obj) => build_atomic_rules_from_object_with_state(obj, state),
        Expr::Lit(Lit::Str(str_lit)) => {
            let mut rules = Vec::new();
            for part in str_lit.value.split(';') {
                let trimmed = part.trim(); if trimmed.is_empty() { continue; }
                rules.push(AtomicRule { selector_suffix: None, at_rule: None, declaration: trimmed.to_string() });
            }
            rules
        }
        _ => Vec::new(),
    }
}

pub fn transform_atomic_rules_to_sheets(rules: &[AtomicRule]) -> (Vec<String>, Vec<String>) {
    let mut sheets = Vec::new();
    let mut class_names = Vec::new();
    // No rule sorting beyond pseudos grouping: maintain insertion order except ensure base before pseudos for stable output
    for rule in rules.iter().filter(|r| r.at_rule.is_none() && pseudo_score(&r.selector_suffix) == 0) {
        let class_name = atomic_class_name_for_rule(rule, None);
        let selector_suffix = compact_selector_suffix(&rule.selector_suffix.clone().unwrap_or_default());
        let core = format!(".{}{}{{{}}}", class_name, selector_suffix, compact_declaration(&rule.declaration));
        let css_text = if let Some(ar) = &rule.at_rule { format!("{}{{{}}}", ar, core) } else { core };
        sheets.push(css_text);
        class_names.push(class_name);
    }
    for rule in rules.iter().filter(|r| r.at_rule.is_none() && pseudo_score(&r.selector_suffix) != 0) {
        let class_name = atomic_class_name_for_rule(rule, None);
        let selector_suffix = compact_selector_suffix(&rule.selector_suffix.clone().unwrap_or_default());
        let core = format!(".{}{}{{{}}}", class_name, selector_suffix, compact_declaration(&rule.declaration));
        let css_text = if let Some(ar) = &rule.at_rule { format!("{}{{{}}}", ar, core) } else { core };
        sheets.push(css_text);
        class_names.push(class_name);
    }
    for rule in rules.iter().filter(|r| r.at_rule.is_some()) {
        let class_name = atomic_class_name_for_rule(rule, None);
        let selector_suffix = compact_selector_suffix(&rule.selector_suffix.clone().unwrap_or_default());
        let core = format!(".{}{}{{{}}}", class_name, selector_suffix, compact_declaration(&rule.declaration));
        let css_text = if let Some(ar) = &rule.at_rule { format!("{}{{{}}}", ar, core) } else { core };
        sheets.push(css_text);
        class_names.push(class_name);
    }
    (sheets, class_names)
}

fn compact_declaration(decl: &str) -> String {
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

