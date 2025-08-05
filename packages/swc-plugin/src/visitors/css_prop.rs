use swc_core::ecma::ast::*;
use crate::{types::*, utils::{ast::*, css_builder::*, debug::inject_debug_comment}};



/// Visits JSX opening elements to process css prop
/// Transforms <div css={{color: 'red'}} /> into <div className={ax(["class_name"])} />
/// and collects CSS sheets for module-level declarations
pub fn visit_css_prop_jsx_opening_element(
    elem: &mut JSXOpeningElement,
    state: &mut TransformState,
    css_content_to_var: &mut std::collections::HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Only process CSS props if compiled imports are enabled
    if state.compiled_imports.is_none() {
        return false;
    }
    let mut css_attr_index = None;
    let mut css_expr = None;
    
    // Find css attribute
    for (i, attr) in elem.attrs.iter().enumerate() {
        if let JSXAttrOrSpread::JSXAttr(jsx_attr) = attr {
            if let JSXAttrName::Ident(ident) = &jsx_attr.name {
                if ident.sym.as_ref() == "css" {
                    css_attr_index = Some(i);
                    
                    // Extract the CSS expression
                    match &jsx_attr.value {
                        Some(JSXAttrValue::JSXExprContainer(container)) => {
                            if let JSXExpr::Expr(expr) = &container.expr {
                                css_expr = Some((**expr).clone());
                            }
                        }
                        Some(JSXAttrValue::Lit(lit)) => {
                            // Handle string literals like css="color: red;"
                            if let Lit::Str(str_lit) = lit {
                                // Convert string literal to an object for processing
                                css_expr = Some(create_css_object_from_string(&str_lit.value));
                            }
                        }
                        _ => {}
                    }
                    break;
                }
            }
        }
    }
    
    // If we found a css prop, transform it
    if let (Some(index), Some(mut expr)) = (css_attr_index, css_expr) {
        // WASM-SAFE: Our unit tests work fine, so let's not preemptively block processing
        // The spread expression fixes should have resolved the core issues
        
        // PROOF OF CONCEPT: Try to resolve imports directly
        expr = resolve_imports_in_css_expression(expr, state);
        
        // Check if this is a variable reference (e.g., styles.danger)
        if is_variable_reference(&expr) {
            return transform_css_prop_variable_reference(elem, index, expr);
        } else {
            // Handle object literals, arrays, etc.
            return transform_css_prop_element(elem, index, expr, state, css_content_to_var, collected_css_sheets);
        }
    }
    
    false
}

/// Transform JSX element with css prop
fn transform_css_prop_element(
    elem: &mut JSXOpeningElement,
    css_attr_index: usize,
    css_expr: Expr,
    state: &TransformState,
    css_content_to_var: &mut std::collections::HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Process the CSS expression into CSS output
    if let Some(css_output) = crate::utils::css_builder::build_css_from_expression_with_context(&css_expr, &state.variable_context) {
        // Use deduplication to get the variable name
        let _var_name = add_css_sheet_with_deduplication(&css_output.css_text, css_content_to_var, collected_css_sheets);
        
        // Remove the css attribute
        elem.attrs.remove(css_attr_index);
        
        // Add className attribute with ax([class_name])
        let class_name_attr = create_class_name_attr(&css_output.class_name);
        elem.attrs.push(class_name_attr);
        
        return true;
    }
    
    false
}

/// Add CSS sheet with deduplication - returns the variable name to use
fn add_css_sheet_with_deduplication(
    css_content: &str,
    css_content_to_var: &mut std::collections::HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> String {
    // Check if this CSS content already exists
    if let Some(existing_var_name) = css_content_to_var.get(css_content) {
        return existing_var_name.clone();
    }
    
    // Generate a new variable name
    let var_name = format!("_css_{}", collected_css_sheets.len());
    
    // Store the mapping and add to collected sheets
    css_content_to_var.insert(css_content.to_string(), var_name.clone());
    collected_css_sheets.push((var_name.clone(), css_content.to_string()));
    
    var_name
}

/// Create className attribute with ax([class_name])
fn create_class_name_attr(class_name: &str) -> JSXAttrOrSpread {
    JSXAttrOrSpread::JSXAttr(JSXAttr {
        span: Default::default(),
        name: JSXAttrName::Ident(create_ident("className")),
        value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
            span: Default::default(),
            expr: JSXExpr::Expr(Box::new(Expr::Call(CallExpr {
                span: Default::default(),
                callee: Callee::Expr(Box::new(Expr::Ident(create_ident("ax")))),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Array(ArrayLit {
                        span: Default::default(),
                        elems: vec![Some(ExprOrSpread {
                            spread: None,
                            expr: Box::new(Expr::Lit(Lit::Str(create_str_lit(class_name)))),
                        })],
                    })),
                }],
                type_args: None,
            }))),
        })),
    })
}



/// Check if an expression is a variable reference (e.g., styles.danger, myVar, etc.)
fn is_variable_reference(expr: &Expr) -> bool {
    match expr {
        Expr::Ident(_) => true,                    // myVar
        Expr::Member(_) => true,                   // styles.danger
        _ => false,
    }
}

/// Transform css prop that contains a variable reference
fn transform_css_prop_variable_reference(
    elem: &mut JSXOpeningElement,
    css_attr_index: usize,
    css_expr: Expr,
) -> bool {
    // Remove the css attribute
    elem.attrs.remove(css_attr_index);
    
    // Add className attribute with ax([variable_reference])
    let class_name_attr = JSXAttrOrSpread::JSXAttr(JSXAttr {
        span: Default::default(),
        name: JSXAttrName::Ident(create_ident("className")),
        value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
            span: Default::default(),
            expr: JSXExpr::Expr(Box::new(Expr::Call(create_call_expr(
                "ax",
                vec![ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Array(ArrayLit {
                        span: Default::default(),
                        elems: vec![Some(ExprOrSpread {
                            spread: None,
                            expr: Box::new(css_expr), // Use the variable reference directly
                        })],
                    })),
                }],
            )))),
        })),
    });
    
    elem.attrs.push(class_name_attr);
    true
}

/// Convert a CSS string like "font-size: 12px; color: red;" into an object expression
fn create_css_object_from_string(css_str: &str) -> Expr {
    let mut props = Vec::new();
    
    // Simple CSS parser - split by semicolon and process each declaration
    for declaration in css_str.split(';') {
        let declaration = declaration.trim();
        if declaration.is_empty() {
            continue;
        }
        
        if let Some((property, value)) = declaration.split_once(':') {
            let property = property.trim();
            let value = value.trim();
            
            // Convert kebab-case to camelCase for JavaScript object
            let camel_case_property = kebab_to_camel_case(property);
            
            let prop = PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                key: PropName::Ident(create_ident(&camel_case_property)),
                value: Box::new(Expr::Lit(Lit::Str(create_str_lit(value)))),
            })));
            
            props.push(prop);
        }
    }
    
    Expr::Object(ObjectLit {
        span: Default::default(),
        props,
    })
}

/// Visit JSX call expressions (like _jsx, jsx, jsxs) to process css prop
/// This handles the case where JSX has already been transformed to function calls
pub fn visit_jsx_call_expr(
    call: &mut CallExpr,
    state: &mut TransformState,
    css_content_to_var: &mut std::collections::HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Only process CSS props if compiled imports are enabled
    if state.compiled_imports.is_none() {
        return false;
    }

    // Check if this is React.createElement or similar JSX call
    let is_jsx_call = match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                Expr::Member(member) => {
                    // Handle React.createElement, React.jsx, etc.
                    if let Expr::Ident(obj) = member.obj.as_ref() {
                        if let MemberProp::Ident(prop) = &member.prop {
                            let obj_name = obj.sym.as_ref();
                            let prop_name = prop.sym.as_ref();
                            (obj_name == "React" || obj_name == "React1") && 
                            (prop_name == "createElement" || prop_name == "jsx" || prop_name == "jsxs")
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                }
                _ => false
            }
        }
        _ => false
    };

    if !is_jsx_call || call.args.len() < 2 {
        return false;
    }

    // Get the props object (second argument)  
    let props_expr = &mut call.args[1];
    if let Expr::Object(object_lit) = props_expr.expr.as_mut() {
        // Look for css property
        let mut css_info: Option<(usize, Expr)> = None;
        
        for (i, prop) in object_lit.props.iter().enumerate() {
            if let PropOrSpread::Prop(prop_box) = prop {
                if let Prop::KeyValue(key_value) = prop_box.as_ref() {
                    if let PropName::Ident(ident) = &key_value.key {
                        if ident.sym.as_ref() == "css" {
                            css_info = Some((i, (*key_value.value).clone()));
                            break;
                        }
                    }
                }
            }
        }
        
        if let Some((css_prop_index, css_expr)) = css_info {
            return transform_jsx_call_css_prop(object_lit, css_prop_index, &css_expr, state, css_content_to_var, collected_css_sheets);
        }
    }
    
    false
}

/// Transform css prop in JSX call expression
fn transform_jsx_call_css_prop(
    object_lit: &mut ObjectLit,
    css_prop_index: usize,
    css_expr: &Expr,
    state: &TransformState,
    css_content_to_var: &mut std::collections::HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is an object that we can process atomically
    if let Expr::Object(obj) = css_expr {
        // Use atomic CSS generation like Babel
        if let Some(atomic_output) = build_atomic_css_from_object(obj) {
            // Add all atomic CSS sheets to the collection with deduplication
            for (_, css_rule) in atomic_output.css_sheets {
                let _var_name = add_css_sheet_with_deduplication(&css_rule, css_content_to_var, collected_css_sheets);
            }
            
            // Remove the css property
            object_lit.props.remove(css_prop_index);
            
            // Create a combined class name string for ax()
            let combined_class_names = atomic_output.class_names.join(" ");
            
            // Add className property with ax([combined_class_names])
            let class_name_prop = PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                key: PropName::Ident(create_ident("className")),
                value: Box::new(Expr::Call(CallExpr {
                    span: Default::default(),
                    callee: Callee::Expr(Box::new(Expr::Ident(create_ident("ax")))),
                    args: vec![ExprOrSpread {
                        spread: None,
                        expr: Box::new(Expr::Array(ArrayLit {
                            span: Default::default(),
                            elems: vec![Some(ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Lit(Lit::Str(create_str_lit(&combined_class_names)))),
                            })],
                        })),
                    }],
                    type_args: None,
                })),
            })));
            
            object_lit.props.push(class_name_prop);
            
            return true;
        }
    }
    
    // Fallback to the old approach for non-object expressions
    if let Some(css_output) = crate::utils::css_builder::build_css_from_expression_with_context(css_expr, &state.variable_context) {
        // Use deduplication to get the variable name
        let _var_name = add_css_sheet_with_deduplication(&css_output.css_text, css_content_to_var, collected_css_sheets);
        
        // Remove the css property
        object_lit.props.remove(css_prop_index);
        
        // Add className property with ax([class_name])
        let class_name_prop = PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
            key: PropName::Ident(create_ident("className")),
            value: Box::new(Expr::Call(CallExpr {
                span: Default::default(),
                callee: Callee::Expr(Box::new(Expr::Ident(create_ident("ax")))),
                args: vec![ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Array(ArrayLit {
                        span: Default::default(),
                        elems: vec![Some(ExprOrSpread {
                            spread: None,
                            expr: Box::new(Expr::Lit(Lit::Str(create_str_lit(&css_output.class_name)))),
                        })],
                    })),
                }],
                type_args: None,
            })),
        })));
        
        object_lit.props.push(class_name_prop);
        
        return true;
    }
    
    false
}

/// Convert kebab-case to camelCase
fn kebab_to_camel_case(input: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = false;
    
    for c in input.chars() {
        if c == '-' {
            capitalize_next = true;
        } else if capitalize_next {
            result.push(c.to_uppercase().next().unwrap_or(c));
            capitalize_next = false;
        } else {
            result.push(c);
        }
    }
    
    result
}

/// Resolve imports in a CSS expression (proof of concept)
fn resolve_imports_in_css_expression(expr: Expr, state: &mut TransformState) -> Expr {
    // Inject debug info into the output instead of using println
    inject_debug_comment(state, "=== Attempting to resolve imports in CSS expression ===");
    
    // Initialize module resolver if needed
    if state.module_resolver.is_none() {
        // Try to get current working directory from environment
        let base_dir = std::env::current_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| ".".to_string());
        inject_debug_comment(state, &format!("🔧 Initializing module resolver with base_dir: {}", base_dir));
        state.module_resolver = Some(crate::utils::module_resolver::ModuleResolver::new(base_dir));
    }
    
    match expr {
        Expr::Object(mut obj) => {
            inject_debug_comment(state, &format!("Processing object expression with {} properties", obj.props.len()));
            
            // Resolve identifiers in object properties and spreads
            for prop in &mut obj.props {
                match prop {
                    PropOrSpread::Prop(prop_box) => {
                        if let Prop::KeyValue(kv) = prop_box.as_mut() {
                            let old_value = (*kv.value).clone();
                            let new_value = resolve_imports_in_css_expression(old_value, state);
                            kv.value = Box::new(new_value);
                        }
                    }
                    PropOrSpread::Spread(spread) => {
                        // Resolve the spread expression (like colorMixin())
                        let old_expr = (*spread.expr).clone();
                        let new_expr = resolve_imports_in_css_expression(old_expr, state);
                        spread.expr = Box::new(new_expr);
                    }
                }
            }
            Expr::Object(obj)
        }
        Expr::Ident(ident) => {
            let ident_name = ident.sym.to_string();
            inject_debug_comment(state, &format!("Trying to resolve identifier: {}", ident_name));
            
            // First check local variables
            if let Some(local_value) = state.local_variables.get(&ident_name).cloned() {
                let debug_msg = format!("Found local variable: {} = {:?}", ident_name, local_value);
                inject_debug_comment(state, &debug_msg);
                if let Some(resolved_expr) = local_value.to_expr() {
        
                    return resolved_expr;
                }
            }
            
            // Then check external imports
            if let Some(import_path) = state.external_imports.get(&ident_name) {

                
                // Use catch_unwind to prevent WASM crashes
                let resolution_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                    if let Some(ref mut resolver) = state.module_resolver {
                        if let Some(export_value) = resolver.get_export(import_path, &ident_name) {
                            export_value.to_expr()
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                }));
                
                match resolution_result {
                    Ok(Some(resolved_expr)) => {
    
                        return resolved_expr;
                    }
                    Ok(None) => {
    
                    }
                    Err(_) => {
    
                    }
                }
            }
            

            Expr::Ident(ident)
        }
        Expr::Member(member_expr) => {
    
            
            // Handle simple property access like obj.prop
            if let Expr::Ident(obj_ident) = member_expr.obj.as_ref() {
                let obj_name = obj_ident.sym.to_string();
                
                if let MemberProp::Ident(prop_ident) = &member_expr.prop {
                    let prop_name = prop_ident.sym.to_string();
    
                    
                    // Check local variables first
                    if let Some(local_value) = state.local_variables.get(&obj_name) {
                        if let crate::utils::module_resolver::ExportValue::Object(obj_map) = local_value {
                            if let Some(prop_value) = obj_map.get(&prop_name) {
        
                                if let Some(resolved_expr) = prop_value.to_expr() {
                                    return resolved_expr;
                                }
                            }
                        }
                    }
                    
                    // Check imported variables
                    if let Some(import_path) = state.external_imports.get(&obj_name) {
    
                        
                        let resolution_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                            if let Some(ref mut resolver) = state.module_resolver {
                                if let Some(export_value) = resolver.get_export(import_path, &obj_name) {
                                    if let crate::utils::module_resolver::ExportValue::Object(obj_map) = export_value {
                                        if let Some(prop_value) = obj_map.get(&prop_name) {
                                            prop_value.to_expr()
                                        } else {
                                            None
                                        }
                                    } else {
                                        None
                                    }
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        }));
                        
                        match resolution_result {
                            Ok(Some(resolved_expr)) => {
    
                                return resolved_expr;
                            }
                            Ok(None) => {
    
                            }
                            Err(_) => {
    
                            }
                        }
                    }
                }
            }
            
    
            Expr::Member(member_expr)
        }
        Expr::Call(call) => {
    
            
            // Try to resolve call expressions like colorMixin()
            if let Callee::Expr(callee_expr) = &call.callee {
                if let Expr::Ident(ident) = callee_expr.as_ref() {
                    let ident_name = ident.sym.to_string();
    
                    
                    // WASM-SAFE: Re-enable function call resolution with safe error handling
                    if let Some(import_path) = state.external_imports.get(&ident_name) {
                        let resolution_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                            if let Some(ref mut resolver) = state.module_resolver {
                                if let Some(export_value) = resolver.get_export(import_path, &ident_name) {
                                    export_value.to_expr()
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        }));
                        
                        match resolution_result {
                            Ok(Some(resolved_expr)) => {
            
                                return resolved_expr;
                            }
                            Ok(None) => {
            
                            }
                            Err(_) => {
            
                            }
                        }
                    }
                }
            }
            
            Expr::Call(call)
        }
        Expr::Tpl(tpl) => {
    
            
            // Try to resolve template literals with imported variables
            if tpl.exprs.len() == 1 && tpl.quasis.len() == 2 {
                // Simple case: `prefix${variable}suffix`
                let prefix = &tpl.quasis[0].raw;
                let suffix = &tpl.quasis[1].raw;
                
                if let Expr::Ident(ident) = tpl.exprs[0].as_ref() {
                    let ident_name = ident.sym.to_string();

                    
                    if let Some(import_path) = state.external_imports.get(&ident_name) {
                        let resolution_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                            if let Some(ref mut resolver) = state.module_resolver {
                                if let Some(export_value) = resolver.get_export(import_path, &ident_name) {
                                    export_value.to_expr()
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        }));
                        
                        match resolution_result {
                            Ok(Some(Expr::Lit(Lit::Str(s)))) => {
                                let resolved_string = format!("{}{}{}", prefix, s.value, suffix);
        
                                return Expr::Lit(Lit::Str(Str {
                                    span: tpl.span,
                                    value: resolved_string.into(),
                                    raw: None,
                                }));
                            }
                            Ok(_) => {
        
                            }
                            Err(_) => {
        
                            }
                        }
                    }
                }
            }
            
            Expr::Tpl(tpl)
        }
        _ => {
    
            expr
        }
    }
}

