//
use swc_core::ecma::ast::*;


/*
This hashing algorithm is from the original compiled babel-plugin pkg.
It's longer because it has to include counterparts for what would normally be in the JS standard library.
*/
fn to_base36(mut num: u32) -> String {
    if num == 0 {
        return "0".to_string();
    }
    
    let digits = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut result = Vec::new();
    
    while num > 0 {
        result.push(digits[(num % 36) as usize] as char);
        num /= 36;
    }
    
    result.reverse();
    result.into_iter().collect()
}

pub fn hash(input: &str) -> String {
    hash_murmurhash2(input, 0)
}

pub fn generate_css_hash(input: &str) -> String {
    format!("_{}", hash(input))
}

fn hash_murmurhash2(s: &str, seed: u32) -> String {
    let utf16_chars: Vec<u16> = s.encode_utf16().collect();
    let mut l = utf16_chars.len() as u32;
    let mut h = seed ^ l;
    let mut i = 0;

    while l >= 4 {
        let mut k = (utf16_chars[i] as u32 & 0xff) |
                   ((utf16_chars[i + 1] as u32 & 0xff) << 8) |
                   ((utf16_chars[i + 2] as u32 & 0xff) << 16) |
                   ((utf16_chars[i + 3] as u32 & 0xff) << 24);

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
        3 => {
            h ^= (utf16_chars[i + 2] as u32 & 0xff) << 16;
            h ^= (utf16_chars[i + 1] as u32 & 0xff) << 8;
            h ^= utf16_chars[i] as u32 & 0xff;
            h = (h & 0xffff).wrapping_mul(0x5bd1e995)
                .wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
        }
        2 => {
            h ^= (utf16_chars[i + 1] as u32 & 0xff) << 8;
            h ^= utf16_chars[i] as u32 & 0xff;
            h = (h & 0xffff).wrapping_mul(0x5bd1e995)
                .wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
        }
        1 => {
            h ^= utf16_chars[i] as u32 & 0xff;
            h = (h & 0xffff).wrapping_mul(0x5bd1e995)
                .wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
        }
        _ => {}
    }

    h ^= h >> 13;
    h = (h & 0xffff).wrapping_mul(0x5bd1e995)
        .wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
    h ^= h >> 15;

    to_base36(h)
}

pub fn build_class_name(hash: &str, prefix: Option<&str>) -> String {
    match prefix {
        Some(p) => format!("{}{}", p, hash),
        None => hash.to_string(),
    }
}

pub fn camel_to_kebab_case(input: &str) -> String {
    let mut result = String::new();
    let mut chars = input.chars().peekable();
    
    while let Some(ch) = chars.next() {
        if ch.is_uppercase() {
            if result.is_empty() {
                result.push('-');
                result.push(ch.to_lowercase().next().unwrap());
            } else {
                result.push('-');
                result.push(ch.to_lowercase().next().unwrap());
            }
        } else {
            result.push(ch);
        }
    }
    
    result
}

#[derive(Debug, Clone)]
pub struct AtomicRule {
    pub selector_suffix: Option<String>, // e.g. ":hover"
    pub at_rule: Option<String>,         // e.g. "@media screen"
    pub declaration: String,             // e.g. "color:red"
}

fn number_to_css_value(property_name: &str, num_lit: &Number) -> String {
    let value = if num_lit.value.fract() == 0.0 {
        format!("{}", num_lit.value as i64)
    } else {
        format!("{}", num_lit.value)
    };
    // Mirror semantics from our JS implementation: only add 'px' for numeric values
    // that are non-zero and not unitless for the given property.
    if num_lit.value != 0.0 && needs_px_unit(property_name) && !value.contains("px") {
        format!("{}px", value)
    } else {
        value
    }
}

fn collect_atomic_rules_from_object(obj: &ObjectLit, parent_selector: Option<String>, parent_at_rule: Option<String>, out: &mut Vec<AtomicRule>) {
    for prop in &obj.props {
        if let PropOrSpread::Prop(prop_box) = prop {
            if let Prop::KeyValue(kv) = prop_box.as_ref() {
                let key_name = match &kv.key {
                    PropName::Ident(ident) => ident.sym.to_string(),
                    PropName::Str(str_lit) => str_lit.value.to_string(),
                    _ => continue,
                };

                match &*kv.value {
                    Expr::Lit(Lit::Str(str_lit)) => {
                        let css_property = camel_to_kebab_case(&key_name);
                        out.push(AtomicRule {
                            selector_suffix: parent_selector.clone(),
                            at_rule: parent_at_rule.clone(),
                            declaration: format!("{}:{}", css_property, str_lit.value),
                        });
                    }
                    Expr::Lit(Lit::Num(num_lit)) => {
                        let css_property = camel_to_kebab_case(&key_name);
                        let value = number_to_css_value(&key_name, num_lit);
                        out.push(AtomicRule {
                            selector_suffix: parent_selector.clone(),
                            at_rule: parent_at_rule.clone(),
                            declaration: format!("{}:{}", css_property, value),
                        });
                    }
                    Expr::Object(nested_obj) => {
                        if key_name.starts_with(":") {
                            let next_sel = match &parent_selector {
                                Some(ps) => Some(format!("{}{}", ps, key_name)),
                                None => Some(key_name.clone()),
                            };
                            collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out);
                        } else if key_name.starts_with("@") {
                            let next_at = match &parent_at_rule {
                                Some(ar) => Some(format!("{}{{{}}}", key_name, ar)), // Nested @rules (simplistic)
                                None => Some(key_name.clone()),
                            };
                            collect_atomic_rules_from_object(nested_obj, parent_selector.clone(), next_at, out);
                        } else {
                            collect_atomic_rules_from_object(nested_obj, parent_selector.clone(), parent_at_rule.clone(), out);
                        }
                    }
                    _ => {
                        continue;
                    }
                }
            }
        }
    }
}

pub fn build_atomic_rules_from_object(obj: &ObjectLit) -> Vec<AtomicRule> {
    let mut out = Vec::new();
    collect_atomic_rules_from_object(obj, None, None, &mut out);
    out
}

fn needs_px_unit(property: &str) -> bool {
    !is_unitless_property(property)
}

// Based on React's isUnitlessNumber list and aligned with our TS implementation
// at packages/css/src/utils/css-property.ts
fn is_unitless_property(property: &str) -> bool {
    matches!(property,
        // Core/unitless numbers
        "animationIterationCount" |
        "basePalette" |
        "borderImageOutset" |
        "borderImageSlice" |
        "borderImageWidth" |
        "boxFlex" |
        "boxFlexGroup" |
        "boxOrdinalGroup" |
        "columnCount" |
        "columns" |
        "flex" |
        "flexGrow" |
        "flexPositive" |
        "flexShrink" |
        "flexNegative" |
        "flexOrder" |
        "fontSizeAdjust" |
        "fontWeight" |
        "gridArea" |
        "gridRow" |
        "gridRowEnd" |
        "gridRowSpan" |
        "gridRowStart" |
        "gridColumn" |
        "gridColumnEnd" |
        "gridColumnSpan" |
        "gridColumnStart" |
        "lineClamp" |
        "lineHeight" |
        "opacity" |
        "order" |
        "orphans" |
        "tabSize" |
        "WebkitLineClamp" |
        "widows" |
        "zIndex" |
        "zoom" |
        // SVG-related properties
        "fillOpacity" |
        "floodOpacity" |
        "stopOpacity" |
        "strokeDasharray" |
        "strokeDashoffset" |
        "strokeMiterlimit" |
        "strokeOpacity" |
        "strokeWidth"
    )
}

pub fn build_atomic_rules_from_expression(expr: &Expr) -> Vec<AtomicRule> {
    match expr {
        Expr::Object(obj) => build_atomic_rules_from_object(obj),
        Expr::Lit(Lit::Str(str_lit)) => {
            let mut rules = Vec::new();
            for part in str_lit.value.split(';') {
                let trimmed = part.trim();
                if trimmed.is_empty() { continue; }
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
    for rule in rules {
        let hash = generate_css_hash(&rule.declaration);
        let class_name = build_class_name(&hash, None);
        let selector_suffix = rule.selector_suffix.clone().unwrap_or_default();
        let core = format!(".{}{}{{{}}}", class_name, selector_suffix, rule.declaration);
        let css_text = if let Some(ar) = &rule.at_rule { format!("{}{{{}}}", ar, core) } else { core };
        sheets.push(css_text);
        class_names.push(class_name);
    }
    (sheets, class_names)
}

pub fn transform_atomic_rules_for_xcss(rules: &[AtomicRule]) -> (Vec<String>, Vec<String>) {
    let (sheets, class_names) = transform_atomic_rules_to_sheets(rules);
    (sheets, class_names)
}

// Sorting logic to match Babel/TS pipeline behaviour in packages/css:
// - Non @-rules come first, sorted by pseudo-selector LVFHA ordering
// - Then @-rules, sorted by at-rule name then query (basic alphabetical)
//   Note: Advanced media query numeric sorting is not implemented here yet.
pub fn sort_atomic_rules(rules: &mut Vec<AtomicRule>, sort_at_rules_enabled: bool) {
    // Style order per packages/css/src/utils/style-ordering.ts
    const STYLE_ORDER: [&str; 7] = [
        ":link",
        ":visited",
        ":focus-within",
        ":focus",
        ":focus-visible",
        ":hover",
        ":active",
    ];

    fn pseudo_score(selector_suffix: &Option<String>) -> i32 {
        if let Some(suffix) = selector_suffix {
            for (idx, pseudo) in STYLE_ORDER.iter().enumerate() {
                if suffix.ends_with(pseudo) {
                    return (idx as i32) + 1;
                }
            }
        }
        0
    }

    fn parse_at_rule(at_rule: &str) -> (String, String) {
        // Expect formats like "@media screen" or "@supports (display:grid)"
        if !at_rule.starts_with('@') {
            return (String::new(), String::new());
        }
        let mut name = String::new();
        let mut rest = String::new();
        let mut seen_space = false;
        for ch in at_rule.chars().skip(1) { // skip '@'
            if !seen_space {
                if ch.is_whitespace() || ch == '{' {
                    seen_space = true;
                } else {
                    name.push(ch);
                }
            } else {
                if ch == '{' { break; }
                rest.push(ch);
            }
        }
        (name, rest.trim().to_string())
    }

    // Partition into non-at and at rules
    let mut non_at_rules: Vec<AtomicRule> = Vec::new();
    let mut at_rules: Vec<AtomicRule> = Vec::new();
    for r in rules.iter().cloned() {
        if r.at_rule.is_some() { at_rules.push(r); } else { non_at_rules.push(r); }
    }

    // Sort non-at rules so that base rules (score 0) come first, then pseudos in DESC LVFHA order.
    non_at_rules.sort_by(|a, b| {
        let sa = pseudo_score(&a.selector_suffix);
        let sb = pseudo_score(&b.selector_suffix);
        match (sa == 0, sb == 0) {
            (true, true) => std::cmp::Ordering::Equal,
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => sb.cmp(&sa), // higher scores first
        }
    });

    // Sort at-rules
    if sort_at_rules_enabled {
        at_rules.sort_by(|a, b| {
            let a_rule = a.at_rule.as_deref().unwrap_or("");
            let b_rule = b.at_rule.as_deref().unwrap_or("");
            let (a_name, a_query) = parse_at_rule(a_rule);
            let (b_name, b_query) = parse_at_rule(b_rule);
            match a_name.cmp(&b_name) {
                std::cmp::Ordering::Equal => match a_query.cmp(&b_query) {
                    std::cmp::Ordering::Equal => pseudo_score(&a.selector_suffix).cmp(&pseudo_score(&b.selector_suffix)),
                    other => other,
                },
                other => other,
            }
        });
    }

    // Rebuild input vector
    rules.clear();
    rules.extend(non_at_rules.into_iter());
    rules.extend(at_rules.into_iter());
}
