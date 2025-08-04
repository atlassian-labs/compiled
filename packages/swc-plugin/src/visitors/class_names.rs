use swc_core::ecma::ast::*;
use crate::types::*;
use crate::utils::ast::*;

/// Handles transformation of ClassNames component usage
/// Transforms <ClassNames>{...}</ClassNames> into optimized class strings
pub fn visit_class_names_jsx_element(
    elem: &mut JSXElement,
    _state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is a ClassNames component
    if !is_class_names_element(elem) {
        return false;
    }
    
    // Extract the children (should be a function)
    let children = match extract_children_function(elem) {
        Some(func) => func,
        None => return false,
    };
    
    // Find and collect all css() calls in the children
    let mut css_outputs = Vec::new();
    let mut collected_sheets = Vec::new();
    
    collect_css_calls(&children, &mut css_outputs, &mut collected_sheets);
    
    // Transform the ClassNames element into <CC><CS>{sheets}</CS>{content}</CC>
    transform_to_compiled_component(elem, collected_sheets, children, css_outputs, collected_css_sheets);
    
    true
}

fn is_class_names_element(elem: &JSXElement) -> bool {
    match &elem.opening.name {
        JSXElementName::Ident(ident) => ident.sym.as_ref() == "ClassNames",
        _ => false,
    }
}

/// Extract the children function from ClassNames component
fn extract_children_function(elem: &JSXElement) -> Option<JSXExprContainer> {
    // Look for the first JSXExprContainer child
    for child in &elem.children {
        if let JSXElementChild::JSXExprContainer(container) = child {
            return Some(container.clone());
        }
    }
    None
}

/// Collect all css() calls and transform them
fn collect_css_calls(
    container: &JSXExprContainer,
    css_outputs: &mut Vec<CSSOutput>,
    collected_sheets: &mut Vec<String>,
) {
    if let JSXExpr::Expr(expr) = &container.expr {
        collect_css_from_expr(expr, css_outputs, collected_sheets);
    }
}

/// Recursively find css() calls in expressions  
fn collect_css_from_expr(
    expr: &Expr,
    css_outputs: &mut Vec<CSSOutput>,
    collected_sheets: &mut Vec<String>,
) {
    match expr {
        Expr::Arrow(arrow) => {
            match &*arrow.body {
                BlockStmtOrExpr::Expr(expr) => {
                    collect_css_from_expr(expr, css_outputs, collected_sheets);
                }
                BlockStmtOrExpr::BlockStmt(block) => {
                    // Handle block statements - look for return statements and expressions
                    for stmt in &block.stmts {
                        if let Stmt::Return(ret_stmt) = stmt {
                            if let Some(arg) = &ret_stmt.arg {
                                collect_css_from_expr(arg, css_outputs, collected_sheets);
                            }
                        } else if let Stmt::Expr(expr_stmt) = stmt {
                            collect_css_from_expr(&expr_stmt.expr, css_outputs, collected_sheets);
                        }
                    }
                }
            }
        }
        Expr::Call(call) => {
            if is_css_call(call) {
                if let Some(css_output) = process_css_call(call) {
                    collected_sheets.push(css_output.css_text.clone());
                    css_outputs.push(css_output);
                }
            }
            // Also check arguments for nested css calls
            for arg in &call.args {
                collect_css_from_expr(&arg.expr, css_outputs, collected_sheets);
            }
        }
        Expr::JSXElement(jsx) => {
            // Skip nested ClassNames elements - they will be processed independently
            if is_class_names_element(jsx) {
                return;
            }
            
            // Check JSX attributes for css() calls
            for attr in &jsx.opening.attrs {
                if let JSXAttrOrSpread::JSXAttr(attr) = attr {
                    if let Some(JSXAttrValue::JSXExprContainer(container)) = &attr.value {
                        if let JSXExpr::Expr(expr) = &container.expr {
                            collect_css_from_expr(expr, css_outputs, collected_sheets);
                        }
                    }
                }
            }
            
            // Recursively check children for more css() calls
            for child in &jsx.children {
                match child {
                    JSXElementChild::JSXElement(elem) => {
                        // Skip nested ClassNames - they will be processed separately
                        if !is_class_names_element(elem) {
                            collect_css_from_expr(&Expr::JSXElement(elem.clone()), css_outputs, collected_sheets);
                        }
                    }
                    JSXElementChild::JSXExprContainer(container) => {
                        if let JSXExpr::Expr(expr) = &container.expr {
                            collect_css_from_expr(expr, css_outputs, collected_sheets);
                        }
                    }
                    JSXElementChild::JSXFragment(frag) => {
                        for frag_child in &frag.children {
                            match frag_child {
                                JSXElementChild::JSXElement(elem) => {
                                    // Skip nested ClassNames - they will be processed separately
                                    if !is_class_names_element(elem) {
                                        collect_css_from_expr(&Expr::JSXElement(elem.clone()), css_outputs, collected_sheets);
                                    }
                                }
                                JSXElementChild::JSXExprContainer(container) => {
                                    if let JSXExpr::Expr(expr) = &container.expr {
                                        collect_css_from_expr(expr, css_outputs, collected_sheets);
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Expr::Paren(paren) => {
            collect_css_from_expr(&paren.expr, css_outputs, collected_sheets);
        }
        Expr::Bin(bin_expr) => {
            // Handle binary expressions like 'existing-class ' + css({ color: 'red' })
            collect_css_from_expr(&bin_expr.left, css_outputs, collected_sheets);
            collect_css_from_expr(&bin_expr.right, css_outputs, collected_sheets);
        }
        Expr::Array(array) => {
            // Handle array expressions like [baseStyles, themeStyles]
            for elem in &array.elems {
                if let Some(expr_or_spread) = elem {
                    if expr_or_spread.spread.is_none() {
                        collect_css_from_expr(&expr_or_spread.expr, css_outputs, collected_sheets);
                    }
                }
            }
        }
        _ => {}
    }
}

/// Recursively find css() calls in expressions with parameter name
fn collect_css_from_expr_with_param(
    expr: &Expr,
    css_outputs: &mut Vec<CSSOutput>,
    collected_sheets: &mut Vec<String>,
    css_param_name: &str,
) {
    match expr {
        Expr::Arrow(arrow) => {
            match &*arrow.body {
                BlockStmtOrExpr::Expr(expr) => {
                    collect_css_from_expr_with_param(expr, css_outputs, collected_sheets, css_param_name);
                }
                BlockStmtOrExpr::BlockStmt(block) => {
                    // Handle block statements - look for return statements and expressions
                    for stmt in &block.stmts {
                        if let Stmt::Return(ret_stmt) = stmt {
                            if let Some(arg) = &ret_stmt.arg {
                                collect_css_from_expr_with_param(arg, css_outputs, collected_sheets, css_param_name);
                            }
                        } else if let Stmt::Expr(expr_stmt) = stmt {
                            collect_css_from_expr_with_param(&expr_stmt.expr, css_outputs, collected_sheets, css_param_name);
                        }
                    }
                }
            }
        }
        Expr::Call(call) => {
            if is_css_call(call) {
                if let Some(css_output) = process_css_call(call) {
                    collected_sheets.push(css_output.css_text.clone());
                    css_outputs.push(css_output);
                }
            }
            // Also check arguments for nested css calls
            for arg in &call.args {
                collect_css_from_expr(&arg.expr, css_outputs, collected_sheets);
            }
        }
        Expr::JSXElement(jsx) => {
            // Skip nested ClassNames elements - they will be processed independently
            if is_class_names_element(jsx) {
                return;
            }
            
            // Check JSX attributes for css() calls
            for attr in &jsx.opening.attrs {
                if let JSXAttrOrSpread::JSXAttr(attr) = attr {
                    if let Some(JSXAttrValue::JSXExprContainer(container)) = &attr.value {
                        if let JSXExpr::Expr(expr) = &container.expr {
                            collect_css_from_expr(expr, css_outputs, collected_sheets);
                        }
                    }
                }
            }
            
            // Recursively check children for more css() calls
            for child in &jsx.children {
                match child {
                    JSXElementChild::JSXElement(elem) => {
                        // Skip nested ClassNames - they will be processed separately
                        if !is_class_names_element(elem) {
                            collect_css_from_expr(&Expr::JSXElement(elem.clone()), css_outputs, collected_sheets);
                        }
                    }
                    JSXElementChild::JSXExprContainer(container) => {
                        if let JSXExpr::Expr(expr) = &container.expr {
                            collect_css_from_expr(expr, css_outputs, collected_sheets);
                        }
                    }
                    JSXElementChild::JSXFragment(frag) => {
                        for frag_child in &frag.children {
                            match frag_child {
                                JSXElementChild::JSXElement(elem) => {
                                    // Skip nested ClassNames - they will be processed separately
                                    if !is_class_names_element(elem) {
                                        collect_css_from_expr(&Expr::JSXElement(elem.clone()), css_outputs, collected_sheets);
                                    }
                                }
                                JSXElementChild::JSXExprContainer(container) => {
                                    if let JSXExpr::Expr(expr) = &container.expr {
                                        collect_css_from_expr(expr, css_outputs, collected_sheets);
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Expr::Paren(paren) => {
            collect_css_from_expr(&paren.expr, css_outputs, collected_sheets);
        }
        Expr::Bin(bin_expr) => {
            // Handle binary expressions like 'existing-class ' + css({ color: 'red' })
            collect_css_from_expr(&bin_expr.left, css_outputs, collected_sheets);
            collect_css_from_expr(&bin_expr.right, css_outputs, collected_sheets);
        }
        Expr::Array(array) => {
            // Handle array expressions like [baseStyles, themeStyles]
            for elem in &array.elems {
                if let Some(expr_or_spread) = elem {
                    if expr_or_spread.spread.is_none() {
                        collect_css_from_expr(&expr_or_spread.expr, css_outputs, collected_sheets);
                    }
                }
            }
        }
        _ => {}
    }
}

/// Check if a call expression is a css() call (including aliased names)
fn is_css_call(call: &CallExpr) -> bool {
    // Check for common CSS call patterns
    is_call_to_function(call, "css") || 
    is_call_to_function(call, "innerCss") ||
    is_call_to_function(call, "styles") ||
    is_call_to_function(call, "cssProps")
}

/// Check if a call expression is a css() call with specific parameter name
fn is_css_call_with_param(call: &CallExpr, param_name: &str) -> bool {
    is_call_to_function(call, param_name)
}

/// Extract CSS parameter name from render prop function
fn extract_css_param_name(expr: &Expr) -> String {
    match expr {
        Expr::Arrow(arrow) => {
            if let Some(param) = arrow.params.first() {
                match param {
                    Pat::Object(obj) => {
                        // Look for css parameter in destructuring: ({ css }) or ({ css: innerCss })
                        for prop in &obj.props {
                            if let ObjectPatProp::KeyValue(kv) = prop {
                                if let PropName::Ident(ident) = &kv.key {
                                    if ident.sym.as_ref() == "css" {
                                        // Check if it's aliased: { css: innerCss }
                                        if let Pat::Ident(alias) = &*kv.value {
                                            return alias.id.sym.to_string();
                                        }
                                    }
                                }
                            } else if let ObjectPatProp::Assign(assign) = prop {
                                // Simple destructuring: { css }
                                if assign.key.sym.as_ref() == "css" {
                                    return "css".to_string();
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    }
    "css".to_string() // Default fallback
}

/// Process a css() call and return CSS output
fn process_css_call(call: &CallExpr) -> Option<CSSOutput> {
    if let Some(first_arg) = call.args.first() {
        return crate::utils::css_builder::build_css_from_expression(&first_arg.expr);
    }
    None
}

/// Transform the ClassNames element to a Compiled Component
fn transform_to_compiled_component(
    elem: &mut JSXElement,
    collected_sheets: Vec<String>,
    children: JSXExprContainer,
    css_outputs: Vec<CSSOutput>,
    collected_css_sheets: &mut Vec<(String, String)>,
) {
    // Add CSS outputs to module-level declarations
    for (i, css_output) in css_outputs.iter().enumerate() {
        let var_name = if i == 0 { "_".to_string() } else { format!("_{}", i) };
        collected_css_sheets.push((var_name, css_output.css_text.clone()));
    }
    
    // Create the sheets array for CSS injection
    let sheets_array = create_sheets_array(&collected_sheets);
    
    // Create CS element: <CS>{[sheets]}</CS>
    let cs_element = create_jsx_element(
        "CS",
        vec![],
        vec![JSXElementChild::JSXExprContainer(JSXExprContainer {
            span: Default::default(),
            expr: JSXExpr::Expr(Box::new(Expr::Array(sheets_array))),
        })],
    );
    
    // Transform function body - replace css() calls with ax() calls
    let mut transformed_children = children;
    transform_css_calls_in_jsx_expr_container(&mut transformed_children);
    
    // Create the new children for CC
    let new_children = vec![
        JSXElementChild::JSXElement(Box::new(cs_element)),
        JSXElementChild::JSXExprContainer(transformed_children),
    ];
    
    // Transform the element to <CC>
    elem.opening.name = JSXElementName::Ident(create_ident("CC"));
    
    if let Some(closing) = &mut elem.closing {
        closing.name = JSXElementName::Ident(create_ident("CC"));
    }
    
    elem.children = new_children;
}

/// Create the sheets array from collected CSS
fn create_sheets_array(sheets: &[String]) -> ArrayLit {
    let elements: Vec<Option<ExprOrSpread>> = sheets
        .iter()
        .enumerate()
        .map(|(i, _sheet)| {
            let var_name = if i == 0 { "_".to_string() } else { format!("_{}", i) };
            Some(ExprOrSpread {
                spread: None,
                expr: Box::new(Expr::Ident(create_ident(&var_name))),
            })
        })
        .collect();
    
    create_array_expr(elements)
}

/// Transform css() calls to ax() calls in the JSX expression container
fn transform_css_calls_in_jsx_expr_container(container: &mut JSXExprContainer) {
    if let JSXExpr::Expr(expr) = &mut container.expr {
        transform_css_calls_in_expr(expr);
    }
}

/// Transform css() calls to ax() calls in expressions
fn transform_css_calls_in_expr(expr: &mut Box<Expr>) {
    match expr.as_mut() {
        Expr::Call(call) => {
            if is_css_call(call) {
                // Transform css() to ax()
                if let Callee::Expr(callee_expr) = &mut call.callee {
                    if let Expr::Ident(ident) = callee_expr.as_mut() {
                        ident.sym = "ax".into();
                        
                        // Wrap the first argument in an array - use the actual class name
                        if let Some(first_arg) = call.args.first_mut() {
                            // Try to get the class name from the CSS processing
                            let class_name_str = if let Some(css_output) = crate::utils::css_builder::build_css_from_expression(&first_arg.expr) {
                                css_output.class_name
                            } else {
                                "_default_class".to_string()
                            };
                            
                            let new_array = create_array_expr(vec![Some(ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Lit(Lit::Str(create_str_lit(&class_name_str)))),
                            })]);
                            
                            first_arg.expr = Box::new(Expr::Array(new_array));
                        }
                    }
                }
            }
            
            // Recursively transform arguments
            for arg in &mut call.args {
                transform_css_calls_in_expr(&mut arg.expr);
            }
        }
        Expr::JSXElement(jsx) => {
            // Transform JSX attributes
            for attr in &mut jsx.opening.attrs {
                if let JSXAttrOrSpread::JSXAttr(attr) = attr {
                    if let Some(JSXAttrValue::JSXExprContainer(container)) = &mut attr.value {
                        if let JSXExpr::Expr(expr) = &mut container.expr {
                            transform_css_calls_in_expr(expr);
                        }
                    }
                }
            }
        }
        Expr::Arrow(arrow) => {
            match &mut *arrow.body {
                BlockStmtOrExpr::Expr(expr) => {
                    transform_css_calls_in_expr(expr);
                }
                BlockStmtOrExpr::BlockStmt(block) => {
                    // Handle block statements
                    for stmt in &mut block.stmts {
                        if let Stmt::Return(ret_stmt) = stmt {
                            if let Some(arg) = &mut ret_stmt.arg {
                                transform_css_calls_in_expr(arg);
                            }
                        } else if let Stmt::Expr(expr_stmt) = stmt {
                            transform_css_calls_in_expr(&mut expr_stmt.expr);
                        }
                    }
                }
            }
        }
        Expr::Paren(paren) => {
            transform_css_calls_in_expr(&mut paren.expr);
        }
        _ => {}
    }
}