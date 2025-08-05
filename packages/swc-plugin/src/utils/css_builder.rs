use crate::types::*;
use std::collections::HashMap;
use swc_core::ecma::ast::*;
use crate::utils::VariableContext;

/// Utilities for building and processing CSS

/// Convert a number to base36 string (matching JavaScript's toString(36))
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

/// Hash function (exact port from JavaScript version)
pub fn hash(input: &str) -> String {
    hash_murmurhash2(input, 0)
}

/// Generate atomic CSS class name using the exact algorithm from atomicify-rules
/// Format: "_{group_hash}{value_hash}" where group_hash and value_hash are first 4 chars
pub fn atomic_class_name(
    property: &str,
    value: &str,
    at_rule: Option<&str>,
    selectors: Option<&str>,
    class_hash_prefix: Option<&str>,
    important: bool,
) -> String {

    
    let prefix = class_hash_prefix.unwrap_or("");
    let at_rule_str = at_rule.unwrap_or("");
    let selectors_str = selectors.unwrap_or("");
    
    // Group hash: hash(prefix + atRule + selectors + property).slice(0, 4)
    let group_input = format!("{}{}{}{}", prefix, at_rule_str, selectors_str, property);
    let group_hash = hash(&group_input);
    let group_part = if group_hash.len() >= 4 {
        &group_hash[..4]
    } else {
        // Pad short hashes to 4 characters with the hash repeated
        &format!("{:0<4}", group_hash)[..4]
    };
    
    // Value hash: hash(value + important).slice(0, 4)
    let value_input = if important {
        format!("{}!important", value)
    } else {
        value.to_string()
    };
    let value_hash = hash(&value_input);
    let value_part = if value_hash.len() >= 4 {
        &value_hash[..4]
    } else {
        // Pad short hashes to 4 characters with the hash repeated
        &format!("{:0<4}", value_hash)[..4]
    };
    
    format!("_{}{}", group_part, value_part)
}

/// Generate a CSS hash using MurmurHash2 (identical to original babel plugin)
/// 
/// This is a direct port of the hash function from @compiled/utils
/// Taken from https://github.com/garycourt/murmurhash-js/blob/master/murmurhash2_gc.js
pub fn generate_css_hash(input: &str) -> String {
    format!("_{}", hash(input))
}

/// Hash function that exactly matches the JavaScript implementation
fn hash_murmurhash2(s: &str, seed: u32) -> String {
    // Convert to UTF-16 to match JavaScript's charCodeAt behavior exactly
    let utf16_chars: Vec<u16> = s.encode_utf16().collect();
    let mut l = utf16_chars.len();
    let mut h = seed ^ (l as u32);
    let mut i = 0;

    while l >= 4 {
        // JavaScript: charCodeAt(i), charCodeAt(++i), charCodeAt(++i), charCodeAt(++i)
        // Each ++i increments before reading, so we read positions i, i+1, i+2, i+3
        let mut k = (utf16_chars[i] as u32 & 0xff)
            | ((utf16_chars[i + 1] as u32 & 0xff) << 8)
            | ((utf16_chars[i + 2] as u32 & 0xff) << 16)
            | ((utf16_chars[i + 3] as u32 & 0xff) << 24);

        // JavaScript complex multiplication to handle 32-bit arithmetic
        k = (k & 0xffff).wrapping_mul(0x5bd1e995)
            .wrapping_add(((k >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);
        k ^= k >> 24;
        k = (k & 0xffff).wrapping_mul(0x5bd1e995)
            .wrapping_add(((k >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16);

        h = ((h & 0xffff).wrapping_mul(0x5bd1e995)
            .wrapping_add(((h >> 16).wrapping_mul(0x5bd1e995) & 0xffff) << 16))
            ^ k;

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

    // JavaScript returns (h >>> 0).toString(36)
    to_base36(h)
}

/// Builds CSS class name from a hash
pub fn build_class_name(hash: &str, prefix: Option<&str>) -> String {
    match prefix {
        Some(p) => format!("{}{}", p, hash),
        None => hash.to_string(),
    }
}

/// Converts camelCase CSS properties to kebab-case, with special handling for vendor prefixes
pub fn camel_to_kebab_case(input: &str) -> String {
    let mut result = String::new();
    let mut chars = input.chars().peekable();
    let mut is_first_char = true;
    
    // Handle vendor prefixes: WebkitTransform -> -webkit-transform, MozTransform -> -moz-transform, msTransform -> -ms-transform
    if input.starts_with("Webkit") || input.starts_with("Moz") || input.starts_with("ms") || input.starts_with("O") {
        result.push('-');
    }
    
    while let Some(c) = chars.next() {
        if c.is_uppercase() {
            if !is_first_char {
                result.push('-');
            }
            result.push(c.to_lowercase().next().unwrap());
        } else {
            result.push(c);
        }
        is_first_char = false;
    }
    
    result
}

/// Returns true if the CSS property should not have units added
fn is_unitless_property(prop: &str) -> bool {
    matches!(prop, 
        "opacity" | "z-index" | "font-weight" | "line-height" | "flex" | 
        "flex-grow" | "flex-shrink" | "order" | "grid-column" | "grid-row" |
        "column-count" | "tab-size"
    )
}

/// Converts a CSS object expression to CSS string
pub fn object_expression_to_css(obj_expr: &ObjectLit) -> String {
    let mut css = String::new();
    
    for prop in &obj_expr.props {
        match prop {
            PropOrSpread::Prop(prop) => {
                if let Prop::KeyValue(kv) = &**prop {
                let key = match &kv.key {
                    PropName::Ident(ident) => {
                        let prop_name = ident.sym.as_ref();
                        if prop_name.starts_with("--") {
                            // CSS custom properties - preserve case
                            prop_name.to_string()
                        } else {
                            // Convert camelCase to kebab-case
                            camel_to_kebab_case(prop_name)
                        }
                    }
                    PropName::Str(s) => s.value.to_string(),
                    _ => continue,
                };
                
                let value = match &*kv.value {
                    Expr::Lit(Lit::Str(s)) => s.value.to_string(),
                    Expr::Lit(Lit::Num(n)) => {
                        // Add 'px' to numeric values unless it's a unitless property
                        let prop_name_lower = key.to_lowercase();
                        if is_unitless_property(&prop_name_lower) {
                            n.value.to_string()
                        } else {
                            format!("{}px", n.value)
                        }
                    }
                    Expr::Object(nested_obj) => {
                        // Handle nested objects for pseudo-selectors and media queries
                        process_nested_css_object(&key, nested_obj, &mut css);
                        continue;
                    }
                    _ => {
                        // Dynamic value - skip for now, will be handled in extended version
                        continue;
                    }
                };
                
                css.push_str(&format!("{}:{};", key, value));
                }
            }
            PropOrSpread::Spread(spread) => {
                // Handle spread syntax like ...obj
                match &*spread.expr {
                    Expr::Object(spread_obj) => {
                        // Flatten the spread object properties into current CSS
                        let spread_css = object_expression_to_css(spread_obj);
                        css.push_str(&spread_css);
                    }
                    _ => {
                        // For other spread expressions (like identifiers or function calls),
                        // they should already be resolved by the module resolver before reaching this point
                        println!("Warning: Unresolved spread expression in CSS: {:?}", spread.expr);
                    }
                }
            }
        }
    }
    
    css
}

/// Generate a CSS variable name from an expression
fn generate_css_variable_name(expr: &Expr) -> String {
    // SAFETY: Avoid Debug formatting which can cause WASM crashes
    // Instead, generate names based on expression type
    let expr_string = match expr {
        Expr::Ident(ident) => format!("ident_{}", ident.sym.as_ref()),
        Expr::Lit(Lit::Str(s)) => format!("str_{}", s.value),
        Expr::Lit(Lit::Num(n)) => format!("num_{}", n.value),
        Expr::Call(_) => "call_expr".to_string(),
        Expr::Member(_) => "member_expr".to_string(),
        Expr::Tpl(_) => "template_literal".to_string(),
        _ => "unknown_expr".to_string(),
    };
    
    let hash = generate_css_hash(&expr_string);
    format!("--_{}", hash.chars().take(8).collect::<String>())
}

/// Converts a CSS object expression to CSS string with variable support and state (includes mutated let variable check)
pub fn object_expression_to_css_with_state(obj_expr: &ObjectLit, state: &TransformState) -> (String, Vec<Variable>) {
    // Check for actually mutated let variables first
    crate::utils::expression_evaluator::check_for_mutated_let_variables(&Expr::Object(obj_expr.clone()), &state.variable_declaration_kinds, &state.mutated_variables);
    
    // If no mutated let variables found, proceed with normal processing
    object_expression_to_css_with_variables_and_context(obj_expr, &state.variable_context)
}

/// Converts a CSS object expression to CSS string with variable support and context
pub fn object_expression_to_css_with_variables_and_context(obj_expr: &ObjectLit, context: &VariableContext) -> (String, Vec<Variable>) {
    let mut css = String::new();
    let mut variables = Vec::new();
    
    for prop in &obj_expr.props {
        match prop {
            PropOrSpread::Prop(prop) => {
                if let Prop::KeyValue(kv) = &**prop {
                let key = match &kv.key {
                    PropName::Ident(ident) => {
                        let prop_name = ident.sym.as_ref();
                        if prop_name.starts_with("--") {
                            // CSS custom properties - preserve case
                            prop_name.to_string()
                        } else {
                            // Convert camelCase to kebab-case
                            camel_to_kebab_case(prop_name)
                        }
                    }
                    PropName::Str(s) => s.value.to_string(),
                    _ => continue,
                };

                match &*kv.value {
                    Expr::Lit(Lit::Str(s)) => {
                        // Static string value
                        css.push_str(&format!("{}:{};", key, s.value));
                    }
                    Expr::Lit(Lit::Num(n)) => {
                        // Static numeric value
                        let prop_name_lower = key.to_lowercase();
                        let value = if is_unitless_property(&prop_name_lower) {
                            n.value.to_string()
                        } else {
                            format!("{}px", n.value)
                        };
                        css.push_str(&format!("{}:{};", key, value));
                    }
                    Expr::Object(nested_obj) => {
                        // Handle nested objects for pseudo-selectors and media queries
                        process_nested_css_object(&key, nested_obj, &mut css);
                    }
                    _ => {
                        // Try to evaluate the expression first
                        if let Some(evaluated) = crate::utils::expression_evaluator::evaluate_expression_with_context(&kv.value, context) {
                            match &evaluated {
                                Expr::Lit(Lit::Str(s)) => {
                                    // Evaluated to static string value
                                    css.push_str(&format!("{}:{};", key, s.value));
                                }
                                Expr::Lit(Lit::Num(n)) => {
                                    // Evaluated to static numeric value
                                    let prop_name_lower = key.to_lowercase();
                                    let value = if is_unitless_property(&prop_name_lower) {
                                        n.value.to_string()
                                    } else {
                                        format!("{}px", n.value)
                                    };
                                    css.push_str(&format!("{}:{};", key, value));
                                }
                                _ => {
                                    // Evaluated to something else, fall back to CSS variable
                                    let variable_name = generate_css_variable_name(&kv.value);
                                    variables.push(Variable {
                                        name: variable_name.clone(),
                                        expression: (*kv.value).clone(),
                                        suffix: None,
                                        prefix: None,
                                    });
                                    css.push_str(&format!("{}:var({});", key, variable_name));
                                }
                            }
                        } else {
                            // Could not evaluate - create CSS variable
                            let variable_name = generate_css_variable_name(&kv.value);
                            variables.push(Variable {
                                name: variable_name.clone(),
                                expression: (*kv.value).clone(),
                                suffix: None,
                                prefix: None,
                            });
                            css.push_str(&format!("{}:var({});", key, variable_name));
                        }
                    }
                }
                }
            }
            PropOrSpread::Spread(spread) => {
                // Handle spread syntax like ...obj
                match &*spread.expr {
                    Expr::Object(spread_obj) => {
                        // Flatten the spread object properties into current CSS
                        let (spread_css, spread_vars) = object_expression_to_css_with_variables_and_context(spread_obj, context);
                        css.push_str(&spread_css);
                        variables.extend(spread_vars);
                    }
                    _ => {
                        // For other spread expressions (like identifiers or function calls),
                        // they should already be resolved by the module resolver before reaching this point
                        println!("Warning: Unresolved spread expression in CSS: {:?}", spread.expr);
                    }
                }
            }
        }
    }
    
    (css, variables)
}

/// Backward-compatible wrapper for object_expression_to_css_with_variables
pub fn object_expression_to_css_with_variables(obj_expr: &ObjectLit) -> (String, Vec<Variable>) {
    let context = VariableContext::new();
    object_expression_to_css_with_variables_and_context(obj_expr, &context)
}

/// Process nested CSS objects (pseudo-selectors, media queries, etc.)
fn process_nested_css_object(selector: &str, obj: &ObjectLit, css: &mut String) {
    if selector.starts_with(':') || selector.starts_with('&') || selector.starts_with('@') {
        // This is a pseudo-selector, nested selector, or media query
        let nested_css = object_expression_to_css(obj);
        if !nested_css.is_empty() {
            let processed_selector = if selector.starts_with('&') {
                // Replace & with the parent selector (we'll handle this properly later)
                selector.replacen('&', "", 1)
            } else {
                selector.to_string()
            };
            
            if selector.starts_with('@') {
                // Media query
                css.push_str(&format!("{}{{{}}}", processed_selector, nested_css));
            } else {
                // Pseudo-selector or nested selector
                css.push_str(&format!("{}{{{}}}", processed_selector, nested_css));
            }
        }
    }
}

/// Processes CSS content and generates rules
pub fn process_css_content(
    css_content: &str,
    context: &TransformContext,
) -> Vec<CssRule> {
    // This is a simplified CSS processor
    // In production, this would use a proper CSS parser
    
    let mut rules = Vec::new();
    
    // Split by rules (very basic parsing)
    let parts: Vec<&str> = css_content.split(';').collect();
    
    for part in parts {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }
        
        if let Some((property, value)) = part.split_once(':') {
            let property = property.trim().to_string();
            let value = value.trim().to_string();
            
            // Create a basic rule
            let rule = CssRule {
                selector: match context {
                    TransformContext::Root => ".compiled-class".to_string(),
                    TransformContext::Keyframes { keyframe } => keyframe.clone(),
                    TransformContext::Fragment => "".to_string(),
                },
                declarations: vec![CssDeclaration {
                    property,
                    value,
                    important: false,
                }],
            };
            
            rules.push(rule);
        }
    }
    
    rules
}

/// Optimizes CSS rules by deduplicating and sorting
pub fn optimize_css_rules(rules: Vec<CssRule>) -> Vec<CssRule> {
    // Simple optimization - deduplicate identical rules
    let mut optimized = Vec::new();
    let mut seen = HashMap::new();
    
    for rule in rules {
        let key = format!("{}:{:?}", rule.selector, rule.declarations);
        if !seen.contains_key(&key) {
            seen.insert(key, true);
            optimized.push(rule);
        }
    }
    
    optimized
}

/// Converts CSS rules to a string representation
pub fn rules_to_css_string(rules: &[CssRule]) -> String {
    let mut css = String::new();
    
    for rule in rules {
        if !rule.selector.is_empty() {
            css.push_str(&format!("{} {{\n", rule.selector));
        }
        
        for decl in &rule.declarations {
            css.push_str(&format!("  {}: {}", decl.property, decl.value));
            if decl.important {
                css.push_str(" !important");
            }
            css.push_str(";\n");
        }
        
        if !rule.selector.is_empty() {
            css.push_str("}\n");
        }
    }
    
    css
}

/// Extract CSS content from a CSS output (without the class wrapper)
fn extract_css_content_from_output(css_output: &CSSOutput) -> String {
    // Extract just the CSS content without the class wrapper
    let css_text = &css_output.css_text;
    if let Some(start) = css_text.find('{') {
        if let Some(end) = css_text.rfind('}') {
            return css_text[start + 1..end].to_string();
        }
    }
    css_text.clone()
}



/// Transform CSS property-value pair to atomic CSS class  
pub fn transform_css_property(property: &str, value: &str) -> (String, String) {
    let class_name = atomic_class_name(property, value, None, None, None, false);
    let css_rule = format!(".{}{{{}: {};}}", class_name, property, value);
    (class_name, css_rule)
}

/// Builds atomic CSS classes from CSS properties (like Babel plugin)
pub fn build_atomic_css_from_object(obj_expr: &ObjectLit) -> Option<AtomicCSSOutput> {
    let mut atomic_classes = Vec::new();
    let mut css_sheets = Vec::new();
    
    for prop in &obj_expr.props {
        if let PropOrSpread::Prop(prop) = prop {
            if let Prop::KeyValue(kv) = &**prop {
                let key = match &kv.key {
                    PropName::Ident(ident) => {
                        let prop_name = ident.sym.as_ref();
                        if prop_name.starts_with("--") {
                            prop_name.to_string()
                        } else {
                            camel_to_kebab_case(prop_name)
                        }
                    }
                    PropName::Str(s) => s.value.to_string(),
                    _ => continue,
                };

                let value = match &*kv.value {
                    Expr::Lit(Lit::Str(s)) => s.value.to_string(),
                    Expr::Lit(Lit::Num(n)) => {
                        let prop_name_lower = key.to_lowercase();
                        if is_unitless_property(&prop_name_lower) {
                            n.value.to_string()
                        } else {
                            format!("{}px", n.value)
                        }
                    }
                    _ => continue, // Skip complex expressions for now
                };
                
                // Generate atomic class name and CSS rule  
                let class_name = atomic_class_name(&key, &value, None, None, None, false);
                let css_rule = format!(".{}{{{}: {};}}", class_name, key, value);
                
                atomic_classes.push(class_name.clone());
                css_sheets.push((class_name, css_rule));
            }
        }
    }
    
    if atomic_classes.is_empty() {
        return None;
    }
    
    Some(AtomicCSSOutput {
        class_names: atomic_classes,
        css_sheets,
    })
}

/// Builds CSS output from an expression with state (includes mutated let variable check)
pub fn build_css_from_expression_with_state(expr: &Expr, state: &TransformState) -> Option<CSSOutput> {
    // Check for actually mutated let variables first
    crate::utils::expression_evaluator::check_for_mutated_let_variables(expr, &state.variable_declaration_kinds, &state.mutated_variables);
    
    // If no mutated let variables found, proceed with normal processing
    build_css_from_expression_with_context(expr, &state.variable_context)
}

/// Builds CSS output from an expression with variable support (with context)
pub fn build_css_from_expression_with_context(expr: &Expr, context: &VariableContext) -> Option<CSSOutput> {
    match expr {
        Expr::Object(obj) => {
            let (css_string, variables) = object_expression_to_css_with_variables_and_context(obj, context);
            if css_string.is_empty() {
                return None;
            }
            
            let hash = generate_css_hash(&css_string);
            let class_name = build_class_name(&hash, None);
            
            Some(CSSOutput {
                css: vec![CssItem::Unconditional { css: css_string.clone() }],
                variables,
                class_name: class_name.clone(),
                css_text: format!(".{}{{{}}}", class_name, css_string),
            })
        }
        Expr::Array(array) => {
            // Handle array of style objects: css([baseStyles, themeStyles])
            let mut combined_css = String::new();
            let mut found_styles = false;
            
            for elem in &array.elems {
                if let Some(expr_or_spread) = elem {
                    if expr_or_spread.spread.is_none() {
                        match &*expr_or_spread.expr {
                            Expr::Object(_) => {
                                // Direct object
                                if let Some(css_output) = build_css_from_expression_with_context(&expr_or_spread.expr, context) {
                                    let css_content = extract_css_content_from_output(&css_output);
                                    combined_css.push_str(&css_content);
                                    found_styles = true;
                                }
                            }
                            Expr::Ident(_ident) => {
                                // Variable reference - these should be resolved by the main transformation
                                // process before reaching the CSS builder. If we get here, the variable
                                // couldn't be resolved at compile time, so skip it.
                                // This is the correct behavior for production - unresolved variables
                                // should not have hardcoded fallbacks.
                            }
                            _ => {}
                        }
                    }
                }
            }
            
            if !found_styles || combined_css.is_empty() {
                return None;
            }
            
            let hash = generate_css_hash(&combined_css);
            let class_name = build_class_name(&hash, None);
            
            Some(CSSOutput {
                css: vec![CssItem::Unconditional { css: combined_css.clone() }],
                variables: vec![],
                class_name: class_name.clone(),
                css_text: format!(".{}{{{}}}", class_name, combined_css),
            })
        }
        _ => None,
    }
}

/// Backward-compatible wrapper for build_css_from_expression
pub fn build_css_from_expression(expr: &Expr) -> Option<CSSOutput> {
    let context = VariableContext::new();
    build_css_from_expression_with_context(expr, &context)
}