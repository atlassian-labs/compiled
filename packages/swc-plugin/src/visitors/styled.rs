use swc_core::ecma::ast::*;
use crate::{types::*, utils::{ast::*, css_builder::*}};

/// Represents different types of styled component patterns
#[derive(Debug, Clone)]
pub enum StyledPattern {
    /// styled.div({ ... })
    BuiltInComponent { tag_name: String },
    /// styled(MyComponent)({ ... })
    CustomComponent { component_name: String },
}

/// Data extracted from styled component expressions
#[derive(Debug, Clone)]
pub struct StyledData {
    pub pattern: StyledPattern,
    pub css_node: Expr,
}

/// Handles transformation of styled() calls and tagged templates
/// Transforms styled.div`...` and styled('div')(...) into compiled components
pub fn visit_styled_call_expr(
    call: &mut CallExpr,
    _state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is a styled() call
    if !is_styled_call(call) {
        return false;
    }
    
    // Extract styled data from the call
    if let Some(styled_data) = extract_styled_data_from_call(call) {
        transform_styled_call(call, styled_data, collected_css_sheets);
        return true;
    }
    
    false
}

/// Handles transformation of styled tagged templates
/// Transforms styled.div`...` into compiled components
pub fn visit_styled_tagged_template(
    tpl: &mut TaggedTpl,
    _state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is a styled tagged template
    if !is_styled_tagged_template(tpl) {
        return false;
    }
    
    // Extract styled data from the tagged template
    if let Some(styled_data) = extract_styled_data_from_tagged_template(tpl) {

        
        // Transform the tagged template into a forwardRef call
        transform_styled_tagged_template(tpl, styled_data, collected_css_sheets);
        return true;
    }
    
    false
}

fn is_styled_call(call: &CallExpr) -> bool {
    // Check if the callee is a styled function or member expression
    match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                Expr::Ident(ident) => ident.sym.as_ref() == "styled",
                Expr::Member(member) => {
                    if let Expr::Ident(ident) = member.obj.as_ref() {
                        ident.sym.as_ref() == "styled"
                    } else {
                        false
                    }
                }
                _ => false,
            }
        }
        _ => false,
    }
}

fn is_styled_tagged_template(tpl: &TaggedTpl) -> bool {
    // Check if the tag is a styled member expression (styled.div, styled.span, etc.)
    match tpl.tag.as_ref() {
        Expr::Member(member) => {
            if let Expr::Ident(ident) = member.obj.as_ref() {
                ident.sym.as_ref() == "styled"
            } else {
                false
            }
        }
        _ => false,
    }
}

/// Extract styled data from call expressions like styled.div({ ... })
fn extract_styled_data_from_call(call: &CallExpr) -> Option<StyledData> {
    match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                // Handle styled.div({ ... })
                Expr::Member(member) => {
                    if let (Expr::Ident(obj), MemberProp::Ident(prop)) = (&*member.obj, &member.prop) {
                        if obj.sym.as_ref() == "styled" {
                            let tag_name = prop.sym.as_ref().to_string();
                            if let Some(first_arg) = call.args.first() {
                                return Some(StyledData {
                                    pattern: StyledPattern::BuiltInComponent { tag_name },
                                    css_node: (*first_arg.expr).clone(),
                                });
                            }
                        }
                    }
                }
                // Handle styled(MyComponent)({ ... })
                Expr::Call(inner_call) => {
                    if let Callee::Expr(inner_expr) = &inner_call.callee {
                        if let Expr::Ident(ident) = inner_expr.as_ref() {
                            if ident.sym.as_ref() == "styled" {
                                if let Some(component_arg) = inner_call.args.first() {
                                    if let Expr::Ident(component_ident) = &*component_arg.expr {
                                        let component_name = component_ident.sym.as_ref().to_string();
                                        if let Some(first_arg) = call.args.first() {
                                            return Some(StyledData {
                                                pattern: StyledPattern::CustomComponent { component_name },
                                                css_node: (*first_arg.expr).clone(),
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        _ => {}
    }
    None
}

/// Extract styled data from tagged template expressions like styled.div`...`
fn extract_styled_data_from_tagged_template(tagged: &TaggedTpl) -> Option<StyledData> {
    match tagged.tag.as_ref() {
        // Handle styled.div`...`
        Expr::Member(member) => {
            if let (Expr::Ident(obj), MemberProp::Ident(prop)) = (&*member.obj, &member.prop) {
                if obj.sym.as_ref() == "styled" {
                    let tag_name = prop.sym.as_ref().to_string();
                    return Some(StyledData {
                        pattern: StyledPattern::BuiltInComponent { tag_name },
                        css_node: create_object_from_template(&tagged.tpl),
                    });
                }
            }
        }
        // Handle styled(MyComponent)`...`
        Expr::Call(call) => {
            if let Callee::Expr(expr) = &call.callee {
                if let Expr::Ident(ident) = expr.as_ref() {
                    if ident.sym.as_ref() == "styled" {
                        if let Some(component_arg) = call.args.first() {
                            if let Expr::Ident(component_ident) = &*component_arg.expr {
                                let component_name = component_ident.sym.as_ref().to_string();
                                return Some(StyledData {
                                    pattern: StyledPattern::CustomComponent { component_name },
                                    css_node: create_object_from_template(&tagged.tpl),
                                });
                            }
                        }
                    }
                }
            }
        }
        _ => {}
    }
    None
}

/// Transform a styled call expression into a compiled component
fn transform_styled_call(call: &mut CallExpr, styled_data: StyledData, collected_css_sheets: &mut Vec<(String, String)>) {
    
    
    // Process the CSS
    if let Some(css_output) = build_css_from_expression(&styled_data.css_node) {
        // Generate a variable name for the CSS sheet
        let var_name = format!("_{}", generate_unique_var_name());
        
        // Add the CSS sheet to the collection
        collected_css_sheets.push((var_name.clone(), css_output.css_text.clone()));
        
        // Replace the call with a forwardRef component with CC/CS structure
        *call = create_styled_component_call(&styled_data.pattern, &css_output, &var_name);
    }
}

/// Transform a styled tagged template into a compiled component
fn transform_styled_tagged_template(tpl: &mut TaggedTpl, styled_data: StyledData, collected_css_sheets: &mut Vec<(String, String)>) {
    
    
    // Process the CSS
    if let Some(css_output) = build_css_from_expression(&styled_data.css_node) {
        // Generate a variable name for the CSS sheet
        let var_name = format!("_{}", generate_unique_var_name());
        
        // Add the CSS sheet to the collection
        collected_css_sheets.push((var_name.clone(), css_output.css_text.clone()));
        
        // Replace the tagged template with a forwardRef call expression
        // Note: We need to transform the tpl in place to a call expression
        let call_expr = create_styled_component_call(&styled_data.pattern, &css_output, &var_name);
        
        // Transform the tagged template by replacing its tag with the call expression
        // This is a bit of a hack, but we're essentially converting:
        // styled.div`...` -> forwardRef(...)
        tpl.tag = Box::new(Expr::Call(call_expr));
        tpl.tpl = Box::new(create_empty_template());
    }
}

/// Generate a unique variable name for CSS sheets
fn generate_unique_var_name() -> String {
    use std::sync::atomic::{AtomicUsize, Ordering};
    static COUNTER: AtomicUsize = AtomicUsize::new(0);
    let count = COUNTER.fetch_add(1, Ordering::SeqCst);
    format!("styled_{}", count)
}

/// Create a forwardRef component call for the styled component
fn create_styled_component_call(pattern: &StyledPattern, css_output: &CSSOutput, _var_name: &str) -> CallExpr {
    let tag_name = match pattern {
        StyledPattern::BuiltInComponent { tag_name } => tag_name.clone(),
        StyledPattern::CustomComponent { component_name } => component_name.clone(),
    };
    
    // Create: forwardRef((props, ref) => <div className={ax(["class"])} {...props} ref={ref} />)
    create_call_expr("forwardRef", vec![ExprOrSpread {
        spread: None,
        expr: Box::new(Expr::Arrow(ArrowExpr {
            span: Default::default(),
            params: vec![
                Pat::Ident(BindingIdent {
                    id: create_ident("props"),
                    type_ann: None,
                }),
                Pat::Ident(BindingIdent {
                    id: create_ident("ref"),
                    type_ann: None,
                }),
            ],
            body: Box::new(BlockStmtOrExpr::Expr(Box::new(Expr::JSXElement(Box::new(
                create_styled_jsx_element(&tag_name, &css_output.class_name)
            ))))),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        })),
    }])
}

/// Create a JSX element for the styled component
fn create_styled_jsx_element(tag_name: &str, class_name: &str) -> JSXElement {
    create_jsx_element(
        tag_name,
        vec![
            // className={ax(["class"])}
            JSXAttrOrSpread::JSXAttr(JSXAttr {
                span: Default::default(),
                name: JSXAttrName::Ident(create_ident("className")),
                value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                    span: Default::default(),
                    expr: JSXExpr::Expr(Box::new(Expr::Call(create_call_expr("ax", vec![
                        ExprOrSpread {
                            spread: None,
                            expr: Box::new(Expr::Array(create_array_expr(vec![Some(ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Lit(Lit::Str(create_str_lit(class_name)))),
                            })]))),
                        }
                    ])))),
                })),
            }),
            // {...props}
            JSXAttrOrSpread::SpreadElement(SpreadElement {
                dot3_token: Default::default(),
                expr: Box::new(Expr::Ident(create_ident("props"))),
            }),
            // ref={ref}
            JSXAttrOrSpread::JSXAttr(JSXAttr {
                span: Default::default(),
                name: JSXAttrName::Ident(create_ident("ref")),
                value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                    span: Default::default(),
                    expr: JSXExpr::Expr(Box::new(Expr::Ident(create_ident("ref")))),
                })),
            }),
        ],
        vec![]
    )
}

/// Create an object expression from a template literal
fn create_object_from_template(tpl: &Tpl) -> Expr {
    let mut props = Vec::new();
    
    // For simple template literals without expressions, we just have one quasi
    if tpl.exprs.is_empty() && tpl.quasis.len() == 1 {
        let css_str = &tpl.quasis[0].raw;
        props.extend(parse_css_string_to_props(css_str));
    } else {
        // Handle template literals with expressions (like ${...})
        // For now, extract the static CSS parts
        for quasi in &tpl.quasis {
            if !quasi.raw.is_empty() {
                props.extend(parse_css_string_to_props(&quasi.raw));
            }
        }
        
        // TODO: Handle expressions in template literals
        // This would require processing tpl.exprs and creating dynamic CSS variables
    }
    
    Expr::Object(ObjectLit {
        span: Default::default(),
        props,
    })
}

/// Parse a CSS string and convert to object properties
fn parse_css_string_to_props(css_str: &str) -> Vec<PropOrSpread> {
    let mut props = Vec::new();
    
    // Split by semicolons and process each declaration
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
    
    props
}

/// Convert kebab-case to camelCase
fn kebab_to_camel_case(kebab: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = false;
    
    for ch in kebab.chars() {
        if ch == '-' {
            capitalize_next = true;
        } else if capitalize_next {
            result.push(ch.to_uppercase().next().unwrap_or(ch));
            capitalize_next = false;
        } else {
            result.push(ch);
        }
    }
    
    result
}

/// Create an empty template literal (used for replacing transformed tagged templates)
fn create_empty_template() -> Tpl {
    Tpl {
        span: Default::default(),
        exprs: vec![],
        quasis: vec![TplElement {
            span: Default::default(),
            raw: "".into(),
            cooked: Some("".into()),
            tail: true,
        }],
    }
}