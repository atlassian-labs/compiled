use crate::types::{CssMapVariantInfo, TransformState};
use swc_core::ecma::ast::*;

// Collect referenced sheets from an xcss expression:
// - If it's a string literal of class names, no sheets are needed (already emitted)
// - If it's a member expression like styles.primary, look up in state.css_map for sheet vars
// - If it's a conditional or logical with member expressions, traverse and collect
// - If it's an identifier referencing css() result, pick from css_classes_by_ident
pub fn collect_sheet_vars_from_xcss_expr(
    expr: &Expr,
    state: &TransformState,
    out_sheet_vars: &mut Vec<String>,
) {
    match expr {
        Expr::Member(member) => {
            if let Some((base, prop)) = split_member(member) {
                if let Some(variant_map) = state.css_map.get(&base) {
                    if let Some(info) = resolve_variant_info(variant_map, prop) {
                        for var in &info.sheet_var_names { out_sheet_vars.push(var.clone()); }
                    }
                }
            }
        }
        Expr::Ident(id) => {
            if let Some(info) = state.css_classes_by_ident.get(&id.sym.to_string()) {
                for var in &info.sheet_var_names { out_sheet_vars.push(var.clone()); }
            }
        }
        Expr::Cond(cond) => {
            collect_sheet_vars_from_xcss_expr(cond.cons.as_ref(), state, out_sheet_vars);
            collect_sheet_vars_from_xcss_expr(cond.alt.as_ref(), state, out_sheet_vars);
        }
        Expr::Call(call) => {
            // j()/cx() style concatenations: collect from args that are member/ident/cond
            for arg in &call.args { collect_sheet_vars_from_xcss_expr(arg.expr.as_ref(), state, out_sheet_vars); }
        }
        Expr::Array(arr) => {
            for elem in &arr.elems { if let Some(e) = elem { collect_sheet_vars_from_xcss_expr(e.expr.as_ref(), state, out_sheet_vars); } }
        }
        _ => {}
    }
}

fn split_member(member: &MemberExpr) -> Option<(String, String)> {
    // Supports styles.primary and styles["primary"]. No deep chains for now.
    if let MemberProp::Ident(prop_ident) = &member.prop {
        if let Some(base_ident) = member.obj.as_ident() {
            return Some((base_ident.sym.to_string(), prop_ident.sym.to_string()));
        }
    }
    if let MemberProp::Computed(comp) = &member.prop {
        if let Some(obj_ident) = member.obj.as_ident() {
            let e: &Expr = comp.expr.as_ref();
            if let Expr::Lit(Lit::Str(s)) = e {
                return Some((obj_ident.sym.to_string(), s.value.to_string()));
            }
        }
    }
    None
}

fn resolve_variant_info<'a>(
    map: &'a ahash::AHashMap<String, CssMapVariantInfo>,
    key: String,
) -> Option<&'a CssMapVariantInfo> {
    map.get(&key)
}


