use swc_core::ecma::ast::*;
use crate::{types::*, utils::{ast::*, css_builder::*}};

/// Handles transformation of cssMap() calls
/// Transforms cssMap({...}) into optimized CSS maps
pub fn visit_css_map_call_expr(
    call: &mut CallExpr,
    _state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is a cssMap() call
    if !is_css_map_call(call) {
        return false;
    }
    
    // Extract the cssMap object argument
    if let Some(first_arg) = call.args.first() {
        if let Expr::Object(obj) = &*first_arg.expr {
            // Transform the cssMap object
            let new_object = transform_css_map_object(obj, collected_css_sheets);
            
            // Replace the call with the transformed object
            // Create a special marker to be post-processed like keyframes
            *call = CallExpr {
                span: call.span,
                callee: Callee::Expr(Box::new(Expr::Object(new_object))),
                args: vec![],
                type_args: None,
            };
            
            return true;
        }
    }
    
    false
}

fn is_css_map_call(call: &CallExpr) -> bool {
    match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                Expr::Ident(ident) => ident.sym.as_ref() == "cssMap",
                _ => false,
            }
        }
        _ => false,
    }
}

/// Transform a cssMap object into an object of class names
fn transform_css_map_object(obj: &ObjectLit, collected_css_sheets: &mut Vec<(String, String)>) -> ObjectLit {
    let mut new_props = Vec::new();
    
    for prop in &obj.props {
        if let PropOrSpread::Prop(prop) = prop {
            if let Prop::KeyValue(kv) = &**prop {
                // Get the key name (variant name)
                let key_name = match &kv.key {
                    PropName::Ident(ident) => ident.sym.to_string(),
                    PropName::Str(s) => s.value.to_string(),
                    _ => continue,
                };
                
                // Process the CSS for this variant
                if let Some(css_output) = build_css_from_expression(&kv.value) {
                    // Generate a variable name for this CSS sheet
                    let var_name = format!("_cssMap_{}_{}", key_name, collected_css_sheets.len());
                    collected_css_sheets.push((var_name.clone(), css_output.css_text.clone()));
                    
                    // Create a new property with the class name
                    let new_prop = PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                        key: kv.key.clone(),
                        value: Box::new(Expr::Lit(Lit::Str(create_str_lit(&css_output.class_name)))),
                    })));
                    
                    new_props.push(new_prop);
                }
            }
        }
    }
    
    ObjectLit {
        span: obj.span,
        props: new_props,
    }
}