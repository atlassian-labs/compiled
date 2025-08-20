use crate::types::TransformState;
use crate::utils::{css_builder, ast};
use swc_core::{
    common::DUMMY_SP,
    ecma::ast::*,
};

pub fn is_css_map_call(call: &CallExpr, state: &TransformState) -> bool {
    if let Some(ref imports) = state.compiled_imports {
        if let Some(ref css_map_imports) = imports.css_map {
            match &call.callee { Callee::Expr(expr) => match expr.as_ref() { Expr::Ident(ident) => css_map_imports.contains(&ident.sym.to_string()), _ => false }, _ => false }
        } else { false }
    } else {
        match &call.callee { Callee::Expr(expr) => match expr.as_ref() { Expr::Ident(ident) => ident.sym.as_ref() == "cssMap", _ => false }, _ => false }
    }
}

pub fn visit_css_map_call_expr(
    call: &mut CallExpr,
    state: &mut TransformState,
    collected_css_sheets: &mut Vec<(String, String)>,
) -> bool {
    if !is_css_map_call(call, state) { return false; }
    if call.args.len() != 1 { panic!("cssMap() must receive exactly one argument"); }
    let obj = match call.args[0].expr.as_ref() { Expr::Object(o) => o, _ => panic!("cssMap() argument must be an object") };
    let mut props_out: Vec<PropOrSpread> = Vec::new();
    for prop in &obj.props {
        if let PropOrSpread::Prop(p) = prop { if let Prop::KeyValue(kv) = p.as_ref() {
            let key_name = match &kv.key { PropName::Ident(ident) => ident.sym.to_string(), PropName::Str(str_lit) => str_lit.value.to_string(), _ => continue };
            if let Expr::Object(variant_obj) = &*kv.value {
                let atomic_rules = css_builder::build_atomic_rules_from_object(variant_obj);
                if !atomic_rules.is_empty() {
                    let (sheets, class_names) = css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
                    for sheet in sheets { collected_css_sheets.push(("_".to_string(), sheet)); }
                    let combined = class_names.join(" ");
                    props_out.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(ast::create_ident(&key_name)), value: Box::new(Expr::Lit(Lit::Str(ast::create_str_lit(&combined)))) }))));
                } else {
                    props_out.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Ident(ast::create_ident(&key_name)), value: Box::new(Expr::Lit(Lit::Str(ast::create_str_lit("")))) }))));
                }
            }
        } }
    }
    *call = CallExpr { span: call.span, callee: Callee::Expr(Box::new(Expr::Object(ObjectLit { span: DUMMY_SP, props: props_out }))), args: vec![], type_args: None };
    true
}

