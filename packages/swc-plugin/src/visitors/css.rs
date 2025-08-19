use crate::types::TransformState;
use crate::CompiledOptions;
use crate::utils::{css_builder, ast};
use swc_core::{
    common::DUMMY_SP,
    ecma::ast::*,
};
use std::collections::HashMap;

pub fn is_css_call(call: &CallExpr, state: &TransformState) -> bool {
    if let Some(ref imports) = state.compiled_imports {
        if let Some(ref css_imports) = imports.css {
            match &call.callee {
                Callee::Expr(expr) => {
                    match expr.as_ref() {
                        Expr::Ident(ident) => {
                            let ident_name = ident.sym.to_string();
                            let is_css_call = css_imports.contains(&ident_name);
                            is_css_call
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
                Expr::Ident(ident) => ident.sym.as_ref() == "css",
                _ => false,
            },
            _ => false,
        }
    }
}

pub fn is_static_object_strict(obj: &ObjectLit) -> Result<(), String> {
    for prop in &obj.props {
        match prop {
            PropOrSpread::Prop(prop_box) => {
                match prop_box.as_ref() {
                    Prop::KeyValue(kv) => {
                        match &*kv.value {
                            Expr::Lit(_) => continue, // Literals are allowed
                            Expr::Object(nested_obj) => {
                                is_static_object_strict(nested_obj)?;
                            }
                            Expr::Ident(_) => {
                                return Err("Dynamic variables are not supported in strict mode in the SWC Plugin".to_string());
                            }
                            Expr::Call(_) => {
                                return Err("Function calls are not supported in strict mode in the SWC Plugin".to_string());
                            }
                            Expr::Member(_) => {
                                return Err("Member expressions are not supported in strict mode in the SWC Plugin".to_string());
                            }
                            Expr::Bin(_) => {
                                return Err("Binary expressions are not supported in strict mode in the SWC Plugin".to_string());
                            }
                            Expr::Cond(_) => {
                                return Err("Conditional expressions are not supported in strict mode in the SWC Plugin".to_string());
                            }
                            _ => {
                                return Err(format!("Expression type not supported in strict mode: {:?}", kv.value));
                            }
                        }
                    }
                    _ => {
                        return Err("Only key-value properties are supported in strict mode".to_string());
                    }
                }
            }
            PropOrSpread::Spread(_) => {
                return Err("Spread syntax is not supported in strict mode".to_string());
            }
        }
    }
    Ok(())
}

pub fn is_static_expression_strict(expr: &Expr) -> Result<(), String> {
    match expr {
        Expr::Lit(_) => Ok(()), // String literals are allowed
        Expr::Object(obj) => is_static_object_strict(obj),
        Expr::Ident(_) => Err("Dynamic variables are not supported in strict mode".to_string()),
        Expr::Call(_) => Err("Function calls are not supported in strict mode".to_string()),
        Expr::Member(_) => Err("Member expressions are not supported in strict mode".to_string()),
        Expr::Bin(_) => Err("Binary expressions are not supported in strict mode".to_string()),
        Expr::Cond(_) => Err("Conditional expressions are not supported in strict mode".to_string()),
        _ => Err(format!("Expression type not supported in strict mode: {:?}", expr)),
    }
}

#[allow(dead_code)]
pub fn visit_css_call_expr(
    call: &mut CallExpr,
    state: &mut TransformState,
    css_content_to_var: &mut HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
    options: &CompiledOptions,
) -> bool {
    if !is_css_call(call, state) {
        return false;
    }
    
    if call.args.is_empty() {
        return false;
    }
    
    let css_arg = &call.args[0].expr;
    
    if options.strict_mode {
        if let Err(error_msg) = is_static_expression_strict(css_arg) {
            panic!("Strict mode error in css(): {}", error_msg);
        }
    }
    
    let mut atomic_rules = css_builder::build_atomic_rules_from_expression(css_arg);
    if !atomic_rules.is_empty() {
        css_builder::sort_atomic_rules(&mut atomic_rules, options.sort_at_rules);
        let (sheets, _class_names) = css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
        
        for sheet in sheets {
            let _var_name = add_css_sheet_with_deduplication(
                css_content_to_var,
                collected_css_sheets,
                &sheet
            );
        }
        
        *call = CallExpr {
            span: call.span,
            callee: Callee::Expr(Box::new(Expr::Lit(Lit::Null(Null {
                span: DUMMY_SP,
            })))),
            args: vec![],
            type_args: None,
        };
        
        return true;
    }
    
    false
}

pub fn visit_css_prop_jsx_element(
    opening_elem: &mut JSXOpeningElement,
    _state: &mut TransformState,
    css_content_to_var: &mut HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
    options: &CompiledOptions,
) -> bool {
    let mut css_attr_index = None;
    for (i, attr) in opening_elem.attrs.iter().enumerate() {
        if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
            if let JSXAttrName::Ident(ident) = &jsx_attr.name {
                if ident.sym.as_ref() == "css" {
                    css_attr_index = Some(i);
                    break;
                }
            }
        }
    }
    
    let css_attr_index = match css_attr_index {
        Some(index) => index,
        None => return false, // No css prop found
    };
    
    let css_attr = match &opening_elem.attrs[css_attr_index] {
        JSXAttrOrSpread::JSXAttr(attr) => attr,
        _ => return false,
    };
    
    let is_string_literal = match &opening_elem.attrs[css_attr_index] {
        JSXAttrOrSpread::JSXAttr(attr) => matches!(&attr.value, Some(JSXAttrValue::Lit(Lit::Str(_)))),
        _ => false,
    };
    if is_string_literal {
        if let JSXAttrOrSpread::JSXAttr(attr) = &opening_elem.attrs[css_attr_index] {
            let str_lit = match &attr.value {
                Some(JSXAttrValue::Lit(Lit::Str(s))) => s.clone(),
                _ => unreachable!(),
            };
            let rules = css_builder::build_atomic_rules_from_expression(&Expr::Lit(Lit::Str(str_lit.clone())));
            if !rules.is_empty() {
                let (sheets, class_names) = css_builder::transform_atomic_rules_to_sheets(&rules);

                for sheet in sheets {
                    let _ = add_css_sheet_with_deduplication(
                        css_content_to_var,
                        collected_css_sheets,
                        &sheet,
                    );
                }

                if !class_names.is_empty() {
                    if let JSXAttrOrSpread::JSXAttr(attr_mut) = &mut opening_elem.attrs[css_attr_index] {
                        attr_mut.name = JSXAttrName::Ident(ast::create_ident("className"));
                        let ax_call = create_ax_call(&class_names);
                        attr_mut.value = Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                            span: DUMMY_SP,
                            expr: JSXExpr::Expr(Box::new(ax_call)),
                        }));
                    }
                } else {
                    opening_elem.attrs.remove(css_attr_index);
                }

                return true;
            }
        }
    }

    let expr = match get_jsx_attribute_expression(&css_attr.value) {
        Some(expr) => expr,
        None => return false, // No expression found
    };

    let should_rewrite_to_classname = matches!(expr, Expr::Member(_) | Expr::Ident(_));
    if should_rewrite_to_classname {
        let ax_call = Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(Box::new(Expr::Ident(ast::create_ident("ax")))),
            args: vec![ExprOrSpread {
                spread: None,
                expr: Box::new(Expr::Array(ArrayLit {
                    span: DUMMY_SP,
                    elems: vec![Some(ExprOrSpread { spread: None, expr: Box::new(expr.clone()) })],
                })),
            }],
            type_args: None,
        });
        if let JSXAttrOrSpread::JSXAttr(attr_mut) = &mut opening_elem.attrs[css_attr_index] {
            attr_mut.name = JSXAttrName::Ident(ast::create_ident("className"));
            attr_mut.value = Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                span: DUMMY_SP,
                expr: JSXExpr::Expr(Box::new(ax_call)),
            }));
        }
        return true;
    }

    if options.strict_mode {
        if let Err(error_msg) = is_static_expression_strict(expr) {
            panic!("Strict mode error in css prop: {}", error_msg);
        }
    }

    let mut atomic_rules = css_builder::build_atomic_rules_from_expression(expr);
    if !atomic_rules.is_empty() {
        css_builder::sort_atomic_rules(&mut atomic_rules, options.sort_at_rules);
        let (sheets, class_names) = css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
        
        for sheet in sheets {
            let _var_name = add_css_sheet_with_deduplication(
                css_content_to_var,
                collected_css_sheets,
                &sheet
            );
        }
        
        if !class_names.is_empty() {
            if let JSXAttrOrSpread::JSXAttr(attr) = &mut opening_elem.attrs[css_attr_index] {
                attr.name = JSXAttrName::Ident(ast::create_ident("className"));
                
                let ax_call = create_ax_call(&class_names);
                attr.value = Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                    span: DUMMY_SP,
                    expr: JSXExpr::Expr(Box::new(ax_call)),
                }));
            }
        } else {
            opening_elem.attrs.remove(css_attr_index);
        }
        
        return true;
    }
    
    false
}

fn get_jsx_attribute_expression(value: &Option<JSXAttrValue>) -> Option<&Expr> {
    match value {
        Some(JSXAttrValue::JSXExprContainer(container)) => {
            match &container.expr {
                JSXExpr::Expr(expr) => Some(expr.as_ref()),
                _ => None,
            }
        }
        Some(JSXAttrValue::Lit(lit)) => {
            match lit {
                Lit::Str(_) => {
                    None
                }
                _ => None,
            }
        }
        _ => None,
    }
}

fn create_ax_call(class_names: &[String]) -> Expr {
    let array_elements: Vec<Option<ExprOrSpread>> = class_names
        .iter()
        .map(|class_name| {
            Some(ExprOrSpread {
                spread: None,
                expr: Box::new(Expr::Lit(Lit::Str(ast::create_str_lit(class_name)))),
            })
        })
        .collect();
    
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: Callee::Expr(Box::new(Expr::Ident(ast::create_ident("ax")))),
        args: vec![ExprOrSpread {
            spread: None,
            expr: Box::new(Expr::Array(ArrayLit {
                span: DUMMY_SP,
                elems: array_elements,
            })),
        }],
        type_args: None,
    })
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
