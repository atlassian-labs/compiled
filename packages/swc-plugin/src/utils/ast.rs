use swc_core::ecma::ast::*;

/// Utility functions for AST manipulation and analysis

/// Creates a new identifier with the given name
pub fn create_ident(name: &str) -> Ident {
    Ident::new(name.into(), Default::default())
}

/// Creates a string literal with the given value
pub fn create_str_lit(value: &str) -> Str {
    Str {
        span: Default::default(),
        value: value.into(),
        raw: None,
    }
}

/// Creates a new JSX attribute with the given name and value
pub fn create_jsx_attr(name: &str, value: JSXAttrValue) -> JSXAttrOrSpread {
    JSXAttrOrSpread::JSXAttr(JSXAttr {
        span: Default::default(),
        name: JSXAttrName::Ident(create_ident(name)),
        value: Some(value),
    })
}

/// Creates a new JSX expression container
pub fn create_jsx_expr_container(expr: Expr) -> JSXAttrValue {
    JSXAttrValue::JSXExprContainer(JSXExprContainer {
        span: Default::default(),
        expr: JSXExpr::Expr(Box::new(expr)),
    })
}

/// Extracts the string value from a JSX attribute
pub fn get_jsx_attr_string_value(attr: &JSXAttr) -> Option<String> {
    match &attr.value {
        Some(JSXAttrValue::Lit(Lit::Str(s))) => Some(s.value.to_string()),
        Some(JSXAttrValue::JSXExprContainer(container)) => {
            match &container.expr {
                JSXExpr::Expr(expr) => {
                    match expr.as_ref() {
                        Expr::Lit(Lit::Str(s)) => Some(s.value.to_string()),
                        _ => None,
                    }
                }
                _ => None,
            }
        }
        _ => None,
    }
}

/// Gets the name of a JSX element
pub fn get_jsx_element_name(elem: &JSXElement) -> Option<String> {
    match &elem.opening.name {
        JSXElementName::Ident(ident) => Some(ident.sym.to_string()),
        JSXElementName::JSXMemberExpr(_member) => {
            // For now, just return a placeholder for member expressions
            // TODO: Implement proper member expression handling when needed
            Some("MemberExpression".to_string())
        }
        _ => None,
    }
}

/// Checks if an expression is a member expression with the given object and property
pub fn is_member_expr(expr: &Expr, obj_name: &str, prop_name: &str) -> bool {
    match expr {
        Expr::Member(member) => {
            if let (Expr::Ident(obj), MemberProp::Ident(prop)) = (member.obj.as_ref(), &member.prop) {
                obj.sym.as_ref() == obj_name && prop.sym.as_ref() == prop_name
            } else {
                false
            }
        }
        _ => false,
    }
}

/// Checks if a call expression is calling a function with the given name
pub fn is_call_to_function(call: &CallExpr, func_name: &str) -> bool {
    match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                Expr::Ident(ident) => ident.sym.as_ref() == func_name,
                _ => false,
            }
        }
        _ => false,
    }
}

/// Create a call expression
pub fn create_call_expr(callee_name: &str, args: Vec<ExprOrSpread>) -> CallExpr {
    CallExpr {
        span: Default::default(),
        callee: Callee::Expr(Box::new(Expr::Ident(create_ident(callee_name)))),
        args,
        type_args: None,
    }
}

/// Create an array expression
pub fn create_array_expr(elements: Vec<Option<ExprOrSpread>>) -> ArrayLit {
    ArrayLit {
        span: Default::default(),
        elems: elements,
    }
}

/// Create a JSX element
pub fn create_jsx_element(name: &str, attrs: Vec<JSXAttrOrSpread>, children: Vec<JSXElementChild>) -> JSXElement {
    JSXElement {
        span: Default::default(),
        opening: JSXOpeningElement {
            span: Default::default(),
            name: JSXElementName::Ident(create_ident(name)),
            attrs,
            self_closing: false,
            type_args: None,
        },
        closing: Some(JSXClosingElement {
            span: Default::default(),
            name: JSXElementName::Ident(create_ident(name)),
        }),
        children,
    }
}