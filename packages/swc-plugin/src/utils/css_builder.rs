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
    if needs_px_unit(property_name) && !value.contains("px") {
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
    matches!(property, 
        "width" | "height" | "top" | "right" | "bottom" | "left" | 
        "margin" | "marginTop" | "marginRight" | "marginBottom" | "marginLeft" |
        "padding" | "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft" |
        "fontSize" | "borderWidth" | "borderRadius" | "maxWidth" | "maxHeight" |
        "minWidth" | "minHeight"
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
