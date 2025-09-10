use crate::types::TransformState;
use swc_core::ecma::ast::*;

pub fn is_css_map_call(call: &CallExpr, state: &TransformState) -> bool {
    if let Some(ref imports) = state.compiled_imports {
        if let Some(ref css_map_imports) = imports.css_map {
            match &call.callee { Callee::Expr(expr) => match expr.as_ref() { Expr::Ident(ident) => css_map_imports.contains(&ident.sym.to_string()), _ => false }, _ => false }
        } else { false }
    } else {
        match &call.callee { Callee::Expr(expr) => match expr.as_ref() { Expr::Ident(ident) => ident.sym.as_ref() == "cssMap", _ => false }, _ => false }
    }
}

// Removed unused visitor helper; cssMap transform is handled directly in `lib.rs`

