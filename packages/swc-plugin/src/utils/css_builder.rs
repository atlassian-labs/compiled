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

fn slice_first_4(input: &str) -> String {
    // Hash strings are ASCII base36, safe to slice by bytes.
    if input.len() <= 4 { input.to_string() } else { input[0..4].to_string() }
}

fn property_from_declaration(decl: &str) -> &str {
    match decl.find(':') {
        Some(idx) => decl[..idx].trim(),
        None => decl,
    }
}

fn value_from_declaration(decl: &str) -> &str {
    match decl.find(':') {
        Some(idx) => decl[idx + 1..].trim(),
        None => "",
    }
}

fn normalized_selectors(selector_suffix: &Option<String>) -> String {
    // Mirror atomicify normalizeSelector behavior for hashing purposes.
    // Base selector becomes "&" and pseudos become like "&:hover".
    match selector_suffix {
        Some(suf) if !suf.is_empty() => format!("&{}", suf),
        _ => "&".to_string(),
    }
}

fn atomic_class_name_for_rule(rule: &AtomicRule, class_hash_prefix: Option<&str>) -> String {
    // Group = hash(prefix + atRule + selectors + property).take(4)
    let selectors = normalized_selectors(&rule.selector_suffix);
    let at_rule = rule.at_rule.as_deref().unwrap_or("");
    let property = property_from_declaration(&rule.declaration);
    let prefix = class_hash_prefix.unwrap_or("");

    let group_input = format!("{}{}{}{}", prefix, at_rule, selectors, property);
    let group_hash = slice_first_4(&hash(&group_input));

    // Value hash = hash(value[+important]).take(4)
    // Normalize any trailing whitespace before !important to match TS behavior (value + important, no space)
    let raw_value = value_from_declaration(&rule.declaration);
    let trimmed = raw_value.trim_end();
    let normalized_value = if trimmed.ends_with("!important") {
        let base = &trimmed[..trimmed.len() - "!important".len()];
        format!("{}!important", base.trim_end())
    } else {
        trimmed.to_string()
    };
    let value_hash = slice_first_4(&hash(&normalized_value));

    format!("_{}{}", group_hash, value_hash)
}

fn pseudo_score(selector_suffix: &Option<String>) -> i32 {
    const STYLE_ORDER: [&str; 7] = [
        ":link",
        ":visited",
        ":focus-within",
        ":focus",
        ":focus-visible",
        ":hover",
        ":active",
    ];
    if let Some(suffix) = selector_suffix {
        for (idx, pseudo) in STYLE_ORDER.iter().enumerate() {
            if suffix.ends_with(pseudo) {
                return (idx as i32) + 1;
            }
        }
    }
    0
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
    // First pass: detect presence of shorthands and longhands within this object scope
    let mut has_padding_shorthand = false;
    let mut has_padding_longhand = false;
    let mut has_margin_shorthand = false;
    let mut has_margin_longhand = false;
    for prop in &obj.props {
        if let PropOrSpread::Prop(prop_box) = prop {
            if let Prop::KeyValue(kv) = prop_box.as_ref() {
                let key_name = match &kv.key { PropName::Ident(i) => i.sym.as_ref(), PropName::Str(s) => s.value.as_ref(), _ => continue };
                match key_name {
                    "padding" => has_padding_shorthand = true,
                    "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft" => has_padding_longhand = true,
                    "margin" => has_margin_shorthand = true,
                    "marginTop" | "marginRight" | "marginBottom" | "marginLeft" => has_margin_longhand = true,
                    _ => {}
                }
            }
        }
    }

    // Second pass: emit rules, expanding padding/margin only when longhands coexist in this scope
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
                        let value_str = str_lit.value.to_string();
                        let should_expand = (css_property == "padding" && has_padding_longhand)
                            || (css_property == "margin" && has_margin_longhand);
                        if should_expand {
                            if let Some(expanded_vals) = maybe_expand_shorthand(&css_property, &value_str) {
                                for (prop, val) in expanded_vals {
                                    out.push(AtomicRule {
                                        selector_suffix: parent_selector.clone(),
                                        at_rule: parent_at_rule.clone(),
                                        declaration: format!("{}:{}", prop, val),
                                    });
                                }
                            } else {
                                out.push(AtomicRule {
                                    selector_suffix: parent_selector.clone(),
                                    at_rule: parent_at_rule.clone(),
                                    declaration: format!("{}:{}", css_property, value_str),
                                });
                            }
                        } else {
                            // Do not expand shorthands when no longhand siblings are present
                            out.push(AtomicRule {
                                selector_suffix: parent_selector.clone(),
                                at_rule: parent_at_rule.clone(),
                                declaration: format!("{}:{}", css_property, value_str),
                            });
                        }
                    }
                    Expr::Lit(Lit::Num(num_lit)) => {
                        let css_property = camel_to_kebab_case(&key_name);
                        let value = number_to_css_value(&key_name, num_lit);
                        let should_expand = (css_property == "padding" && has_padding_longhand)
                            || (css_property == "margin" && has_margin_longhand);
                        if should_expand {
                            if let Some(expanded_vals) = maybe_expand_shorthand(&css_property, &value) {
                                for (prop, val) in expanded_vals {
                                    out.push(AtomicRule {
                                        selector_suffix: parent_selector.clone(),
                                        at_rule: parent_at_rule.clone(),
                                        declaration: format!("{}:{}", prop, val),
                                    });
                                }
                            } else {
                                out.push(AtomicRule {
                                    selector_suffix: parent_selector.clone(),
                                    at_rule: parent_at_rule.clone(),
                                    declaration: format!("{}:{}", css_property, value),
                                });
                            }
                        } else {
                            // Do not expand shorthands when no longhand siblings are present
                            out.push(AtomicRule {
                                selector_suffix: parent_selector.clone(),
                                at_rule: parent_at_rule.clone(),
                                declaration: format!("{}:{}", css_property, value),
                            });
                        }
                    }
                    Expr::Object(nested_obj) => {
                        if key_name.starts_with("&:") {
                            // Treat "&:pseudo" as a pseudo selector as well
                            let pseudo = &key_name[1..]; // drop leading '&' -> ":pseudo"
                            let next_sel = match &parent_selector {
                                Some(ps) => Some(format!("{}{}", ps, pseudo)),
                                None => Some(pseudo.to_string()),
                            };
                            collect_atomic_rules_from_object(nested_obj, next_sel, parent_at_rule.clone(), out);
                        } else if key_name.starts_with(":") {
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
    // Emit base first, then pseudos, so that after module insertion (reverse), pseudos appear first.
    for rule in rules.iter().filter(|r| r.at_rule.is_none() && pseudo_score(&r.selector_suffix) == 0) {
        let class_name = atomic_class_name_for_rule(rule, None);
        let selector_suffix = rule.selector_suffix.clone().unwrap_or_default();
        let core = format!(".{}{}{{{}}}", class_name, selector_suffix, rule.declaration);
        let css_text = if let Some(ar) = &rule.at_rule { format!("{}{{{}}}", ar, core) } else { core };
        sheets.push(css_text);
        class_names.push(class_name);
    }
    for rule in rules.iter().filter(|r| r.at_rule.is_none() && pseudo_score(&r.selector_suffix) != 0) {
        let class_name = atomic_class_name_for_rule(rule, None);
        let selector_suffix = rule.selector_suffix.clone().unwrap_or_default();
        let core = format!(".{}{}{{{}}}", class_name, selector_suffix, rule.declaration);
        let css_text = if let Some(ar) = &rule.at_rule { format!("{}{{{}}}", ar, core) } else { core };
        sheets.push(css_text);
        class_names.push(class_name);
    }
    // Keep at-rules as they are sorted
    for rule in rules.iter().filter(|r| r.at_rule.is_some()) {
        let class_name = atomic_class_name_for_rule(rule, None);
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
// - Within same pseudo level, sort shorthand buckets so shorthands precede longhands
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

    fn property_from_declaration(decl: &str) -> &str {
        match decl.find(':') {
            Some(idx) => decl[..idx].trim(),
            None => decl,
        }
    }

    // Partial port of packages/utils/src/shorthand.ts buckets.
    // Smaller number wins (comes earlier). Non-listed properties default to a large bucket.
    fn shorthand_bucket(property: &str) -> i32 {
        match property {
            // Top priority reset
            "all" => 0,

            // Common shorthands
            "animation" | "animation-range" | "background" | "border" | "border-image"
            | "border-radius" | "column-rule" | "columns" | "contain-intrinsic-size"
            | "container" | "flex" | "flex-flow" | "font" | "font-synthesis"
            | "gap" | "grid" | "grid-area" | "inset" | "list-style" | "mask"
            | "mask-border" | "offset" | "outline" | "overflow" | "overscroll-behavior"
            | "padding" | "margin" | "place-content" | "place-items" | "place-self"
            | "scroll-margin" | "scroll-padding" | "scroll-timeline" | "text-decoration"
            | "text-emphasis" | "text-wrap" | "transition" | "view-timeline" => 1,

            // Secondary groupings
            "border-color" | "border-style" | "border-width" | "border-block"
            | "border-inline" | "grid-column" | "grid-row" | "grid-template"
            | "inset-block" | "inset-inline" | "margin-block" | "margin-inline"
            | "padding-block" | "padding-inline" | "scroll-margin-block"
            | "scroll-margin-inline" | "scroll-padding-block" | "scroll-padding-inline"
            | "font-variant" => 2,

            // Edges
            "border-top" | "border-right" | "border-bottom" | "border-left" => 4,

            // Default: not a shorthand (comes after shorthands)
            _ => 1_000_000,
        }
    }

    // Partition into non-at and at rules
    let mut non_at_rules: Vec<AtomicRule> = Vec::new();
    let mut at_rules: Vec<AtomicRule> = Vec::new();
    for r in rules.iter().cloned() {
        if r.at_rule.is_some() { at_rules.push(r); } else { non_at_rules.push(r); }
    }

    // Sort non-at rules so that base rules (score 0) come first,
    // then pseudos in DESC LVFHA order. Within same pseudo level, sort by shorthand buckets.
    non_at_rules.sort_by(|a, b| {
        let sa = pseudo_score(&a.selector_suffix);
        let sb = pseudo_score(&b.selector_suffix);
        let base_order = match (sa == 0, sb == 0) {
            (true, true) => std::cmp::Ordering::Equal,
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => sa.cmp(&sb), // lower scores first: base(0) then LVFHA ascending
        };
        if base_order != std::cmp::Ordering::Equal {
            return base_order;
        }
        // Same pseudo layer -> compare shorthand buckets
        let a_prop = property_from_declaration(&a.declaration);
        let b_prop = property_from_declaration(&b.declaration);
        let ab = shorthand_bucket(a_prop);
        let bb = shorthand_bucket(b_prop);
        if ab != bb {
            // Place non-shorthands (large bucket) before shorthands (small bucket)
            return bb.cmp(&ab);
        }
        // Deterministic fallback: property then full declaration
        match a_prop.cmp(b_prop) {
            std::cmp::Ordering::Equal => a.declaration.cmp(&b.declaration),
            other => other,
        }
    });

    // Sort at-rules
    if sort_at_rules_enabled {
        at_rules.sort_by(|a, b| {
            let a_rule = a.at_rule.as_deref().unwrap_or("");
            let b_rule = b.at_rule.as_deref().unwrap_or("");
            let (a_name, a_query) = parse_at_rule(a_rule);
            let (b_name, b_query) = parse_at_rule(b_rule);
            let name_cmp = a_name.cmp(&b_name);
            if name_cmp != std::cmp::Ordering::Equal { return name_cmp; }
            let query_cmp = a_query.cmp(&b_query);
            if query_cmp != std::cmp::Ordering::Equal { return query_cmp; }
            // Same at-rule and query -> prefer pseudo LVFHA, then shorthand bucket
            let ps_cmp = pseudo_score(&a.selector_suffix).cmp(&pseudo_score(&b.selector_suffix));
            if ps_cmp != std::cmp::Ordering::Equal { return ps_cmp; }
            let a_prop = property_from_declaration(&a.declaration);
            let b_prop = property_from_declaration(&b.declaration);
            let ab = shorthand_bucket(a_prop);
            let bb = shorthand_bucket(b_prop);
            if ab != bb { return ab.cmp(&bb); }
            a_prop.cmp(b_prop)
        });
    }

    // Rebuild input vector.
    // Place higher-scored pseudos (LVFHA later in ascending) at the end of non_at_rules so
    // their variable declarations are emitted last in sheets, matching Babel's behavior of
    // listing :hover closer to the end in the const list when it sorts LVFHA last.
    rules.clear();
    // Move pseudo rules to the end of non_at_rules: split base vs pseudo
    let mut base_rules: Vec<AtomicRule> = Vec::new();
    let mut pseudo_rules: Vec<AtomicRule> = Vec::new();
    for r in non_at_rules.into_iter() {
        if pseudo_score(&r.selector_suffix) == 0 { base_rules.push(r); } else { pseudo_rules.push(r); }
    }
    rules.extend(base_rules.into_iter());
    rules.extend(pseudo_rules.into_iter());
    rules.extend(at_rules.into_iter());
}

// --- Shorthand expansion helpers (minimal strict-mode coverage) ---

fn expand_four_sides(base: &str, value: &str) -> Vec<(String, String)> {
    // Split by ASCII whitespace; collapse multiple spaces
    let tokens: Vec<&str> = value
        .split_whitespace()
        .filter(|t| !t.is_empty())
        .collect();

    // Resolve top, right, bottom, left per CSS rules
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

    vec![
        (top_prop, top.to_string()),
        (right_prop, right.to_string()),
        (bottom_prop, bottom.to_string()),
        (left_prop, left.to_string()),
    ]
}

fn maybe_expand_shorthand(property: &str, value_str: &str) -> Option<Vec<(String, String)>> {
    match property {
        "padding" | "margin" => Some(expand_four_sides(property, value_str)),
        _ => None,
    }
}
