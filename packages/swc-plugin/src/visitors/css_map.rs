use crate::types::TransformState;
use crate::CompiledOptions;
use crate::utils::{css_builder, ast};
use swc_core::{
    common::DUMMY_SP,
    ecma::ast::*,
};
use std::collections::HashMap;

pub fn is_css_map_call(call: &CallExpr, state: &TransformState) -> bool {
    if let Some(ref imports) = state.compiled_imports {
        if let Some(ref css_map_imports) = imports.css_map {
            match &call.callee {
                Callee::Expr(expr) => {
                    match expr.as_ref() {
                        Expr::Ident(ident) => {
                            css_map_imports.contains(&ident.sym.to_string())
                        }
                        _ => false,
                    }
                }
                _ => false,
            }
        } else {
            false
        }
    } else {
        match &call.callee {
            Callee::Expr(expr) => match expr.as_ref() {
                Expr::Ident(ident) => ident.sym.as_ref() == "cssMap",
                _ => false,
            },
            _ => false,
        }
    }
}

pub fn is_static_css_map_strict(obj: &ObjectLit) -> Result<(), String> {
    for prop in &obj.props {
        match prop {
            PropOrSpread::Prop(prop_box) => {
                match prop_box.as_ref() {
                    Prop::KeyValue(kv) => {
                        match &*kv.value {
                            Expr::Object(variant_obj) => {
                                is_static_variant_object_strict(variant_obj)?;
                            }
                            _ => {
                                return Err("cssMap variants must be objects in strict mode".to_string());
                            }
                        }
                    }
                    _ => {
                        return Err("Only key-value properties are supported in cssMap strict mode".to_string());
                    }
                }
            }
            PropOrSpread::Spread(_) => {
                return Err("Spread syntax is not supported in cssMap strict mode".to_string());
            }
        }
    }
    Ok(())
}

pub fn is_static_variant_object_strict(obj: &ObjectLit) -> Result<(), String> {
    for prop in &obj.props {
        match prop {
            PropOrSpread::Prop(prop_box) => {
                match prop_box.as_ref() {
                    Prop::KeyValue(kv) => {
                        match &*kv.value {
                            Expr::Lit(_) => continue, // Literals are allowed
                            Expr::Object(nested_obj) => {
                                is_static_variant_object_strict(nested_obj)?;
                            }
                            Expr::Ident(_) => {
                                return Err("Dynamic variables are not supported in cssMap strict mode".to_string());
                            }
                            Expr::Call(_) => {
                                return Err("Function calls are not supported in cssMap strict mode".to_string());
                            }
                            Expr::Member(_) => {
                                return Err("Member expressions are not supported in cssMap strict mode".to_string());
                            }
                            Expr::Bin(_) => {
                                return Err("Binary expressions are not supported in cssMap strict mode".to_string());
                            }
                            Expr::Cond(_) => {
                                return Err("Conditional expressions are not supported in cssMap strict mode".to_string());
                            }
                            _ => {
                                return Err(format!("Expression type not supported in cssMap strict mode: {:?}", kv.value));
                            }
                        }
                    }
                    _ => {
                        return Err("Only key-value properties are supported in cssMap variant strict mode".to_string());
                    }
                }
            }
            PropOrSpread::Spread(_) => {
                return Err("Spread syntax is not supported in cssMap variant strict mode".to_string());
            }
        }
    }
    Ok(())
}

#[allow(dead_code)]
pub fn visit_css_map_call_expr(
    call: &mut CallExpr,
    state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
    options: &CompiledOptions,
) -> bool {
    if !is_css_map_call(call, state) {
        return false;
    }
    
    if call.args.len() != 1 {
        panic!("cssMap() must receive exactly one argument");
    }
    
    let css_map_arg = &call.args[0].expr;
    
    let obj = match css_map_arg.as_ref() {
        Expr::Object(obj) => obj,
        _ => {
            panic!("cssMap() argument must be an object");
        }
    };
    
    if options.strict_mode {
        if let Err(error_msg) = is_static_css_map_strict(obj) {
            panic!("Strict mode error in cssMap(): {}", error_msg);
        }
    }
    
    let mut variant_map = HashMap::new();
    
    for prop in &obj.props {
        if let PropOrSpread::Prop(prop_box) = prop {
            if let Prop::KeyValue(kv) = prop_box.as_ref() {
                let variant_name = match &kv.key {
                    PropName::Ident(ident) => ident.sym.to_string(),
                    PropName::Str(str_lit) => str_lit.value.to_string(),
                    _ => continue,
                };
                
                if let Expr::Object(variant_obj) = &*kv.value {
                    let atomic_rules = css_builder::build_atomic_rules_from_object(variant_obj);
                    if !atomic_rules.is_empty() {
                        let (sheets, class_names) = css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                        
                        for sheet in sheets {
                            let _var_name = add_css_sheet_with_deduplication(
                                &mut HashMap::new(), // We don't deduplicate cssMap sheets
                                collected_css_sheets,
                                &sheet
                            );
                        }
                        
                        let combined_class_names = class_names.join(" ");
                        variant_map.insert(variant_name.clone(), combined_class_names);
                        
                        state.css_map.insert(variant_name, class_names);
                    } else {
                        variant_map.insert(variant_name.clone(), "".to_string());
                        state.css_map.insert(variant_name, vec![]);
                    }
                }
            }
        }
    }
    
    let variant_props: Vec<PropOrSpread> = variant_map
        .into_iter()
        .map(|(variant_name, class_names)| {
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                key: PropName::Ident(ast::create_ident(&variant_name)),
                value: Box::new(Expr::Lit(Lit::Str(ast::create_str_lit(&class_names)))),
            })))
        })
        .collect();
    
    *call = CallExpr {
        span: call.span,
        callee: Callee::Expr(Box::new(Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: variant_props,
        }))),
        args: vec![],
        type_args: None,
    };
    
    true
}

fn add_css_sheet_with_deduplication(
    css_content_to_var: &mut HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
    css_content: &str,
) -> String {
    if let Some(existing_var_name) = css_content_to_var.get(css_content) {
        return existing_var_name.clone();
    }
    
    let index = collected_css_sheets.len();
    let var_name = if index == 0 { "_".to_string() } else { format!("_{}", index + 1) };
    
    css_content_to_var.insert(css_content.to_string(), var_name.clone());
    collected_css_sheets.push((var_name.clone(), css_content.to_string()));
    
    var_name
}
