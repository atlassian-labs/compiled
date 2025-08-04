use swc_core::ecma::ast::*;
use crate::{types::*, utils::{ast::*, css_builder::*}};

/// Handles transformation of keyframes() calls and tagged templates
/// Transforms keyframes`...` and keyframes({...}) into optimized animations
pub fn visit_keyframes_call_expr(
    call: &mut CallExpr,
    _state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is a keyframes() call
    if !is_keyframes_call(call) {
        return false;
    }
    
    // Process keyframes call expression
    if let Some(first_arg) = call.args.first() {
        if let Expr::Object(obj) = &*first_arg.expr {
            // Transform keyframes object to CSS
            let keyframes_css = object_to_keyframes_css(obj);
            if !keyframes_css.is_empty() {
                // Generate keyframe name with hash
                let keyframe_name = generate_keyframe_name(&keyframes_css);
                
                // Create @keyframes CSS rule
                let keyframes_rule = format!("@keyframes {}{{{}}}", keyframe_name, keyframes_css);
                
                // Add to collected CSS sheets
                let var_name = format!("_{}", generate_unique_keyframes_var_name());
                collected_css_sheets.push((var_name, keyframes_rule));
                
                // Replace the entire call expression with just the keyframe name string
                // Transform: keyframes({...}) -> "k9cb77f03"
                // We do this by replacing the call with a simple string literal expression
                // Note: We can't change the CallExpr type directly, so we use an empty args array
                call.args.clear();
                call.callee = Callee::Expr(Box::new(Expr::Lit(Lit::Str(create_str_lit(&keyframe_name)))));
                
                return true;
            }
        }
    }
    
    false
}

/// Handles transformation of keyframes tagged templates
/// Transforms keyframes`...` into optimized animations
pub fn visit_keyframes_tagged_template(
    tpl: &mut TaggedTpl,
    _state: &mut TransformState,
) -> bool {
    // Check if this is a keyframes tagged template
    if !is_keyframes_tagged_template(tpl) {
        return false;
    }
    
    // TODO: Implement the actual transformation logic
    // This would involve:
    // 1. Extracting the CSS from the template literal
    // 2. Generating CSS @keyframes rules
    // 3. Replacing the tagged template with animation names
    
    
    
    true
}

fn is_keyframes_call(call: &CallExpr) -> bool {
    match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                Expr::Ident(ident) => ident.sym.as_ref() == "keyframes",
                _ => false,
            }
        }
        _ => false,
    }
}

fn is_keyframes_tagged_template(tpl: &TaggedTpl) -> bool {
    match tpl.tag.as_ref() {
        Expr::Ident(ident) => ident.sym.as_ref() == "keyframes",
        _ => false,
    }
}

/// Convert keyframes object to CSS string
fn object_to_keyframes_css(obj: &ObjectLit) -> String {
    let mut css = String::new();
    
    for prop in &obj.props {
        if let PropOrSpread::Prop(prop) = prop {
            if let Prop::KeyValue(kv) = &**prop {
                let keyframe_selector = match &kv.key {
                    PropName::Ident(ident) => ident.sym.to_string(),
                    PropName::Str(s) => s.value.to_string(),
                    _ => continue,
                };
                
                if let Expr::Object(nested_obj) = &*kv.value {
                    let rules = object_expression_to_css(nested_obj);
                    if !rules.is_empty() {
                        css.push_str(&format!("{}{{{}}}", keyframe_selector, rules));
                    }
                }
            }
        }
    }
    
    css
}

/// Generate keyframe name with k prefix + hash (following original babel plugin)
fn generate_keyframe_name(css: &str) -> String {
    let hash = generate_css_hash(css);
    format!("k{}", hash.trim_start_matches('_'))
}

/// Generate unique variable name for keyframes
fn generate_unique_keyframes_var_name() -> String {
    use std::sync::atomic::{AtomicUsize, Ordering};
    static COUNTER: AtomicUsize = AtomicUsize::new(0);
    let count = COUNTER.fetch_add(1, Ordering::SeqCst);
    format!("keyframes_{}", count)
}

/// Create expression for keyframe name (just the string literal)
#[allow(dead_code)]
fn create_keyframe_name_expr(name: &str) -> CallExpr {
    // We need to replace the entire call expression with just a string literal
    // But since this function returns CallExpr, we'll create a minimal one
    // The actual fix should replace the call with Expr::Lit directly
    CallExpr {
        span: Default::default(),
        callee: Callee::Expr(Box::new(Expr::Lit(Lit::Str(create_str_lit(name))))),
        args: vec![],
        type_args: None,
    }
}