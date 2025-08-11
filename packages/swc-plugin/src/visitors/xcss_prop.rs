use crate::types::TransformState;
use crate::CompiledOptions;
use crate::utils::{css_builder, ast};
use swc_core::{
    common::DUMMY_SP,
    ecma::ast::*,
};
use std::collections::HashMap;

fn is_xcss_prop(attr_name: &str) -> bool {
    attr_name.to_lowercase().ends_with("xcss")
}

fn get_jsx_attribute_expression(value: &Option<JSXAttrValue>) -> Option<&Expr> {
    match value {
        Some(JSXAttrValue::JSXExprContainer(container)) => {
            match &container.expr {
                JSXExpr::Expr(expr) => Some(expr.as_ref()),
                _ => None,
            }
        }
        _ => None,
    }
}

fn is_static_object(obj: &ObjectLit) -> bool {
    for prop in &obj.props {
        if let PropOrSpread::Prop(prop_box) = prop {
            if let Prop::KeyValue(kv) = prop_box.as_ref() {
                match &*kv.value {
                    Expr::Lit(_) => continue, // Literals are static
                    _ => return false, // Any non-literal makes it dynamic
                }
            } else {
                return false; // Methods, getters, setters are not static
            }
        } else {
            return false; // Spread is not static
        }
    }
    true
}

fn collect_member_expression_identifiers(expr: &Expr) -> Vec<String> {
    let mut identifiers = Vec::new();
    
    match expr {
        Expr::Member(member) => {
            if let Expr::Ident(ident) = &*member.obj {
                identifiers.push(ident.sym.to_string());
            }
        }
        Expr::Ident(ident) => {
            identifiers.push(ident.sym.to_string());
        }
        Expr::Cond(cond) => {
            identifiers.extend(collect_member_expression_identifiers(&cond.cons));
            identifiers.extend(collect_member_expression_identifiers(&cond.alt));
        }
        Expr::Call(call) => {
            for arg in &call.args {
                identifiers.extend(collect_member_expression_identifiers(&arg.expr));
            }
        }
        _ => {}
    }
    
    identifiers
}

fn collect_pass_styles(state: &TransformState, identifiers: &[String]) -> Vec<String> {
    let mut styles = Vec::new();
    
    for key in &state.css_map {
        if identifiers.iter().any(|id| key.0 == id) {
            styles.extend(key.1.clone());
        }
    }
    
    styles
}


pub fn visit_xcss_prop_jsx_opening_element(
    opening_elem: &mut JSXOpeningElement,
    state: &mut TransformState,
    css_content_to_var: &mut HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
    _options: &CompiledOptions,
) -> bool {
    let elem_key = opening_elem.span.lo.0 as usize;
    
    if state.transform_cache.contains_key(&elem_key) {
        return false;
    }
    
    state.transform_cache.insert(elem_key, true);
    
    let mut xcss_attr_index = None;
    for (i, attr) in opening_elem.attrs.iter().enumerate() {
        if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
            if let JSXAttrName::Ident(ident) = &jsx_attr.name {
                if is_xcss_prop(&ident.sym.to_string()) {
                    xcss_attr_index = Some(i);
                    break;
                }
            }
        }
    }
    
    let xcss_attr_index = match xcss_attr_index {
        Some(index) => index,
        None => return false, // No xcss prop found
    };
    
    let xcss_attr = match &opening_elem.attrs[xcss_attr_index] {
        JSXAttrOrSpread::JSXAttr(attr) => attr,
        _ => return false,
    };
    
    let expr = match get_jsx_attribute_expression(&xcss_attr.value) {
        Some(expr) => expr,
        None => return false, // No expression found
    };
    
    match expr {
        Expr::Object(obj) => {
            if !is_static_object(obj) {
                panic!("Object given to the xcss prop must be static");
            }
            
            let atomic_rules = css_builder::build_atomic_rules_from_object(obj);
            if !atomic_rules.is_empty() {
                let (sheets, class_names) = css_builder::transform_atomic_rules_for_xcss(&atomic_rules);
                
                match class_names.len() {
                    1 => {
                        if let JSXAttrOrSpread::JSXAttr(attr) = &mut opening_elem.attrs[xcss_attr_index] {
                            let class_expr = Expr::Lit(Lit::Str(Str { span: DUMMY_SP, value: class_names[0].clone().into(), raw: None }));
                            attr.value = Some(ast::create_jsx_expr_container(class_expr));
                        }
                        
                        if !sheets.is_empty() {
                            let _var_name = add_css_sheet_with_deduplication(
                                css_content_to_var,
                                collected_css_sheets,
                                &sheets[0]
                            );
                        }
                        
                        state.uses_xcss = true;
                        return true;
                    }
                    0 => {
                        if let JSXAttrOrSpread::JSXAttr(attr) = &mut opening_elem.attrs[xcss_attr_index] {
                            attr.value = Some(ast::create_jsx_expr_container(Expr::Ident(Ident::new("undefined".into(), DUMMY_SP))));
                        }
                        
                        state.uses_xcss = true;
                        return true;
                    }
                    _ => {
                        panic!("Unexpected count of class names");
                    }
                }
            } else {
                if let JSXAttrOrSpread::JSXAttr(attr) = &mut opening_elem.attrs[xcss_attr_index] {
                    attr.value = Some(ast::create_jsx_expr_container(Expr::Ident(Ident::new("undefined".into(), DUMMY_SP))));
                }
                
                state.uses_xcss = true;
                return true;
            }
        }
        
        _ => {
            let identifiers = collect_member_expression_identifiers(expr);
            
            for _identifier in &identifiers {
            }
            
            let sheets = collect_pass_styles(state, &identifiers);
            
            if sheets.is_empty() {
                return false;
            }
            
            state.uses_xcss = true;
            return true;
        }
    }
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
