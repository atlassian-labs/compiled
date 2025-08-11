use swc_core::{
    common::DUMMY_SP,
    ecma::ast::*,
};

pub fn create_ident(name: &str) -> Ident {
    Ident::new(name.into(), DUMMY_SP)
}

pub fn create_str_lit(value: &str) -> Str {
    Str {
        span: DUMMY_SP,
        value: value.into(),
        raw: None,
    }
}

pub fn create_jsx_element_name(name: &str) -> JSXElementName {
    JSXElementName::Ident(create_ident(name))
}

pub fn create_jsx_attr_name(name: &str) -> JSXAttrName {
    JSXAttrName::Ident(create_ident(name))
}

pub fn create_jsx_attr_value_str(value: &str) -> JSXAttrValue {
    JSXAttrValue::Lit(Lit::Str(create_str_lit(value)))
}

pub fn create_jsx_expr_container(expr: Expr) -> JSXAttrValue {
    JSXAttrValue::JSXExprContainer(JSXExprContainer {
        span: DUMMY_SP,
        expr: JSXExpr::Expr(Box::new(expr)),
    })
}

pub fn create_call_expr(fn_name: &str, args: Vec<ExprOrSpread>) -> CallExpr {
    CallExpr {
        span: DUMMY_SP,
        callee: Callee::Expr(Box::new(Expr::Ident(create_ident(fn_name)))),
        args,
        type_args: None,
    }
}

pub fn create_array_lit(elems: Vec<Option<ExprOrSpread>>) -> ArrayLit {
    ArrayLit {
        span: DUMMY_SP,
        elems,
    }
}

pub fn create_expr_or_spread(expr: Expr) -> ExprOrSpread {
    ExprOrSpread {
        spread: None,
        expr: Box::new(expr),
    }
}
