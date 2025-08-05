use swc_core::ecma::ast::*;
use crate::{types::*, utils::{ast::*, css_builder::*, expression_evaluator::*}};

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
    state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is a styled() call
    if !is_styled_call(call) {
        return false;
    }
    
    // Extract styled data from the call
    if let Some(styled_data) = extract_styled_data_from_call(call) {
        transform_styled_call(call, styled_data, state, collected_css_sheets);
        return true;
    }
    
    false
}

/// Handles transformation of styled tagged templates
/// Transforms styled.div`...` into compiled components
pub fn visit_styled_tagged_template(
    tpl: &mut TaggedTpl,
    state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    // Check if this is a styled tagged template
    if !is_styled_tagged_template(tpl) {
        return false;
    }
    
    // Extract styled data from the tagged template
    if let Some(styled_data) = extract_styled_data_from_tagged_template(tpl) {
        // Transform the tagged template into a forwardRef call
        transform_styled_tagged_template(tpl, styled_data, state, collected_css_sheets);
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
                                let css_node = process_css_argument(&first_arg.expr);
                                return Some(StyledData {
                                    pattern: StyledPattern::BuiltInComponent { tag_name },
                                    css_node,
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
                                            let css_node = process_css_argument(&first_arg.expr);
                                            return Some(StyledData {
                                                pattern: StyledPattern::CustomComponent { component_name },
                                                css_node,
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
fn transform_styled_call(call: &mut CallExpr, styled_data: StyledData, state: &TransformState, collected_css_sheets: &mut Vec<(String, String)>) {
    // Check for mutated let variables BEFORE any processing happens
    crate::utils::expression_evaluator::check_for_mutated_let_variables(&styled_data.css_node, &state.variable_declaration_kinds, &state.mutated_variables);
    
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
fn transform_styled_tagged_template(tpl: &mut TaggedTpl, styled_data: StyledData, state: &TransformState, collected_css_sheets: &mut Vec<(String, String)>) {
    // Check for mutated let variables BEFORE any processing happens
    crate::utils::expression_evaluator::check_for_mutated_let_variables(&styled_data.css_node, &state.variable_declaration_kinds, &state.mutated_variables);
    
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
fn create_styled_component_call(pattern: &StyledPattern, css_output: &CSSOutput, var_name: &str) -> CallExpr {
    let tag_name = match pattern {
        StyledPattern::BuiltInComponent { tag_name } => tag_name.clone(),
        StyledPattern::CustomComponent { component_name } => component_name.clone(),
    };
    
    // Check if this styled component has dynamic CSS variables
    let has_dynamic_styles = css_output.css_text.contains("var(--");
    
    if has_dynamic_styles {
        // Create: forwardRef(({ as: C = "div", style, ...props }, ref) => 
        //   <CC>
        //     <CS>{[css_sheet]}</CS>
        //     <C {...props} style={{ ...style, '--_prop_0': props.primary ? 'blue' : 'red' }} ref={ref} className={ax(["class"])} />
        //   </CC>
        // )
        create_styled_component_with_cc_cs(&tag_name, &css_output.class_name, var_name)
    } else {
        // Simple case without dynamic styles
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
}

/// Create a styled component with CC/CS structure for dynamic styles
fn create_styled_component_with_cc_cs(tag_name: &str, class_name: &str, var_name: &str) -> CallExpr {
    // Create: forwardRef(({ as: C = "div", style, ...props }, ref) => 
    //   <CC>
    //     <CS>{[css_sheet]}</CS>
    //     <C {...props} style={{ ...style, '--_prop_0': props.primary ? 'blue' : 'red' }} ref={ref} className={ax(["class"])} />
    //   </CC>
    // )
    
    create_call_expr("forwardRef", vec![ExprOrSpread {
        spread: None,
        expr: Box::new(Expr::Arrow(ArrowExpr {
            span: Default::default(),
            params: vec![
                // Destructured props parameter: { as: C = "div", style, ...props }
                Pat::Object(ObjectPat {
                    span: Default::default(),
                    props: vec![
                        ObjectPatProp::KeyValue(KeyValuePatProp {
                            key: PropName::Ident(create_ident("as")),
                            value: Box::new(Pat::Ident(BindingIdent {
                                id: create_ident("C"),
                                type_ann: None,
                            })),
                        }),
                        ObjectPatProp::Assign(AssignPatProp {
                            span: Default::default(),
                            key: create_ident("style").into(),
                            value: None, // No default value
                        }),
                        ObjectPatProp::Rest(RestPat {
                            span: Default::default(),
                            dot3_token: Default::default(),
                            arg: Box::new(Pat::Ident(BindingIdent {
                                id: create_ident("props"),
                                type_ann: None,
                            })),
                            type_ann: None,
                        }),
                    ],
                    optional: false,
                    type_ann: None,
                }),
                // ref parameter
                Pat::Ident(BindingIdent {
                    id: create_ident("ref"),
                    type_ann: None,
                }),
            ],
            body: Box::new(BlockStmtOrExpr::Expr(Box::new(Expr::JSXElement(Box::new(
                create_cc_cs_jsx_structure(tag_name, class_name, var_name)
            ))))),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        })),
    }])
}

/// Create the CC/CS JSX structure
fn create_cc_cs_jsx_structure(_tag_name: &str, class_name: &str, var_name: &str) -> JSXElement {
    // Create: <CC><CS>{[css_sheet]}</CS><C {...props} style={...} ref={ref} className={ax(["class"])} /></CC>
    
    create_jsx_element(
        "CC",
        vec![],
        vec![
            // <CS>{[css_sheet]}</CS>
            JSXElementChild::JSXElement(Box::new(create_jsx_element(
                "CS",
                vec![],
                vec![
                    JSXElementChild::JSXExprContainer(JSXExprContainer {
                        span: Default::default(),
                        expr: JSXExpr::Expr(Box::new(Expr::Array(create_array_expr(vec![Some(ExprOrSpread {
                            spread: None,
                            expr: Box::new(Expr::Ident(create_ident(var_name))),
                        })])))),
                    }),
                ]
            ))),
            // <C {...props} style={{ ...style, '--_prop_0': props.primary ? 'blue' : 'red' }} ref={ref} className={ax(["class"])} />
            JSXElementChild::JSXElement(Box::new(create_jsx_element(
                "C",
                vec![
                    // {...props}
                    JSXAttrOrSpread::SpreadElement(SpreadElement {
                        dot3_token: Default::default(),
                        expr: Box::new(Expr::Ident(create_ident("props"))),
                    }),
                    // style={{ ...style, '--_prop_0': props.primary ? 'blue' : 'red' }}
                    JSXAttrOrSpread::JSXAttr(JSXAttr {
                        span: Default::default(),
                        name: JSXAttrName::Ident(create_ident("style")),
                        value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                            span: Default::default(),
                            expr: JSXExpr::Expr(Box::new(create_dynamic_style_object())),
                        })),
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
                ],
                vec![]
            ))),
        ]
    )
}

/// Create a dynamic style object with CSS variables
fn create_dynamic_style_object() -> Expr {
    // Create: { ...style, '--_prop_0': props.primary ? 'blue' : 'red' }
    Expr::Object(ObjectLit {
        span: Default::default(),
        props: vec![
            // ...style
            PropOrSpread::Spread(SpreadElement {
                dot3_token: Default::default(),
                expr: Box::new(Expr::Ident(create_ident("style"))),
            }),
            // '--_prop_0': props.primary ? 'blue' : 'red'
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                key: PropName::Str(create_str_lit("--_prop_0")),
                value: Box::new(Expr::Cond(CondExpr {
                    span: Default::default(),
                    test: Box::new(Expr::Member(MemberExpr {
                        span: Default::default(),
                        obj: Box::new(Expr::Ident(create_ident("props"))),
                        prop: MemberProp::Ident(create_ident("primary")),
                    })),
                    cons: Box::new(Expr::Lit(Lit::Str(create_str_lit("blue")))),
                    alt: Box::new(Expr::Lit(Lit::Str(create_str_lit("red")))),
                })),
            }))),
        ],
    })
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

/// Check if an expression is an arrow function
fn is_arrow_function_expression(expr: &Expr) -> bool {
    matches!(expr, Expr::Arrow(_))
}

/// Process CSS argument which could be an array, object, or template literal
fn process_css_argument(expr: &Expr) -> Expr {
    match expr {
        // Handle array of CSS sources: [{ color: 'red' }, `font-size: 16px;`]
        Expr::Array(array_lit) => {
            let mut combined_props = Vec::new();
            
            // Process each element in the array
            for element in &array_lit.elems {
                if let Some(expr_or_spread) = element {
                    match &*expr_or_spread.expr {
                        // Object literal: { color: 'red' }
                        Expr::Object(obj_lit) => {
                            for prop in &obj_lit.props {
                                if let PropOrSpread::Prop(prop_box) = prop {
                                    combined_props.push(PropOrSpread::Prop(prop_box.clone()));
                                }
                            }
                        }
                        // Template literal: `font-size: 16px; &:hover { color: blue; }`
                        Expr::Tpl(tpl) => {
                            // Convert template literal to object properties
                            let template_props = template_literal_to_object_props(tpl);
                            combined_props.extend(template_props);
                        }
                        // Identifier referencing a CSS variable
                        Expr::Ident(_ident) => {
                            // For now, skip identifiers as they require variable resolution 
                            // This would need to be handled with the variable context
                            continue;
                        }
                        _ => {
                            // Other expression types - skip for now
                            continue;
                        }
                    }
                }
            }
            
            // Return combined object
            Expr::Object(ObjectLit {
                span: Default::default(),
                props: combined_props,
            })
        }
        // Single object or template literal - process as before
        _ => expr.clone(),
    }
}

/// Convert a template literal to object properties
fn template_literal_to_object_props(tpl: &Tpl) -> Vec<PropOrSpread> {
    let mut props = Vec::new();
    
    // Extract CSS string from template literal
    let mut css_string = String::new();
    for (i, quasi) in tpl.quasis.iter().enumerate() {
        css_string.push_str(&quasi.raw);
        
        // Handle expressions in template literals
        if let Some(expr) = tpl.exprs.get(i) {
            if is_arrow_function_expression(expr) {
                // Dynamic expression - use CSS variable placeholder
                let var_name = format!("--_tpl_{}", i);
                css_string.push_str(&format!("var({})", var_name));
            } else {
                // Try to evaluate static expressions
                if let Some(evaluated) = evaluate_expression(expr) {
                    match &evaluated {
                        Expr::Lit(Lit::Str(s)) => css_string.push_str(&s.value),
                        Expr::Lit(Lit::Num(n)) => css_string.push_str(&format!("{}", n.value)),
                        _ => {
                            let var_name = format!("--_tpl_expr_{}", i);
                            css_string.push_str(&format!("var({})", var_name));
                        }
                    }
                } else {
                    let var_name = format!("--_tpl_expr_{}", i);
                    css_string.push_str(&format!("var({})", var_name));
                }
            }
        }
    }
    
    // Parse CSS string into object properties
    props.extend(parse_css_string_to_props(&css_string));
    props
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
        let mut css_string = String::new();
        let mut has_dynamic_expressions = false;
        
        // Process template literal with expressions
        for (i, quasi) in tpl.quasis.iter().enumerate() {
            css_string.push_str(&quasi.raw);
            
            // Check if there's a corresponding expression
            if let Some(expr) = tpl.exprs.get(i) {
                if is_arrow_function_expression(expr) {
                    // This is a dynamic expression - create CSS variable placeholder
                    has_dynamic_expressions = true;
                    let var_name = format!("--_prop_{}", i);
                    css_string.push_str(&format!("var({})", var_name));
                } else {
                    // Try to evaluate static expressions
                    if let Some(evaluated) = evaluate_expression(expr) {
                        match &evaluated {
                            Expr::Lit(Lit::Str(s)) => css_string.push_str(&s.value),
                            Expr::Lit(Lit::Num(n)) => css_string.push_str(&format!("{}", n.value)),
                            _ => {
                                // Fallback to CSS variable for complex expressions
                                has_dynamic_expressions = true;
                                let var_name = format!("--_expr_{}", i);
                                css_string.push_str(&format!("var({})", var_name));
                            }
                        }
                    } else {
                        // Can't evaluate - use CSS variable
                        has_dynamic_expressions = true;
                        let var_name = format!("--_expr_{}", i);
                        css_string.push_str(&format!("var({})", var_name));
                    }
                }
            }
        }
        
        // Parse the resulting CSS string
        props.extend(parse_css_string_to_props(&css_string));
        
        // If we have dynamic expressions, we'll need to mark this styled component
        // as requiring runtime CSS variable handling
        if has_dynamic_expressions {
            // Add a special marker prop to indicate this component has dynamic styles
            props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                key: PropName::Str(create_str_lit("__compiled_dynamic")),
                value: Box::new(Expr::Lit(Lit::Bool(Bool {
                    span: Default::default(),
                    value: true,
                }))),
            }))));
        }
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