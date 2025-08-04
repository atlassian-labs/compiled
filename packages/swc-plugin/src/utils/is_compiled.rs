use swc_core::ecma::ast::*;
use crate::types::TransformState;

/// Check if a call expression is a compiled CSS call expression
pub fn is_compiled_css_call_expression(expr: &Expr, state: &TransformState) -> bool {
    if let Expr::Call(call) = expr {
        return is_compiled_call(call, "css", state);
    }
    false
}

/// Check if a tagged template expression is a compiled CSS tagged template
pub fn is_compiled_css_tagged_template_expression(expr: &Expr, state: &TransformState) -> bool {
    if let Expr::TaggedTpl(tagged) = expr {
        return is_compiled_tagged_template(tagged, "css", state);
    }
    false
}

/// Check if a call expression is a compiled styled call expression
pub fn is_compiled_styled_call_expression(expr: &Expr, state: &TransformState) -> bool {
    if let Expr::Call(call) = expr {
        return is_compiled_call(call, "styled", state);
    }
    false
}

/// Check if a tagged template expression is a compiled styled tagged template
pub fn is_compiled_styled_tagged_template_expression(expr: &Expr, state: &TransformState) -> bool {
    if let Expr::TaggedTpl(tagged) = expr {
        return is_compiled_tagged_template(tagged, "styled", state);
    }
    false
}

/// Check if a call expression is a compiled keyframes call expression
pub fn is_compiled_keyframes_call_expression(expr: &Expr, state: &TransformState) -> bool {
    if let Expr::Call(call) = expr {
        return is_compiled_call(call, "keyframes", state);
    }
    false
}

/// Check if a tagged template expression is a compiled keyframes tagged template
pub fn is_compiled_keyframes_tagged_template_expression(expr: &Expr, state: &TransformState) -> bool {
    if let Expr::TaggedTpl(tagged) = expr {
        return is_compiled_tagged_template(tagged, "keyframes", state);
    }
    false
}

/// Check if a call expression is a compiled CSS map call expression
pub fn is_compiled_css_map_call_expression(expr: &Expr, state: &TransformState) -> bool {
    if let Expr::Call(call) = expr {
        return is_compiled_call(call, "cssMap", state);
    }
    false
}

/// Check if a call expression is a compiled API call
fn is_compiled_call(call: &CallExpr, api_name: &str, state: &TransformState) -> bool {
    match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                Expr::Ident(ident) => {
                    // Check if this identifier is imported from compiled
                    if let Some(compiled_imports) = &state.compiled_imports {
                        match api_name {
                            "css" => compiled_imports.css.as_ref().map_or(false, |imports| imports.contains(&ident.sym.to_string())),
                            "styled" => compiled_imports.styled.as_ref().map_or(false, |imports| imports.contains(&ident.sym.to_string())),
                            "keyframes" => compiled_imports.keyframes.as_ref().map_or(false, |imports| imports.contains(&ident.sym.to_string())),
                            "cssMap" => compiled_imports.css_map.as_ref().map_or(false, |imports| imports.contains(&ident.sym.to_string())),
                            _ => false,
                        }
                    } else {
                        // If no compiled imports tracked, check default name
                        ident.sym.as_ref() == api_name
                    }
                }
                Expr::Member(member) => {
                    // Handle styled.div, styled.span etc.
                    if api_name == "styled" {
                        if let Expr::Ident(obj) = member.obj.as_ref() {
                            if let Some(compiled_imports) = &state.compiled_imports {
                                compiled_imports.styled.as_ref().map_or(false, |imports| imports.contains(&obj.sym.to_string()))
                            } else {
                                obj.sym.as_ref() == "styled"
                            }
                        } else {
                            false
                        }
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

/// Check if a tagged template is a compiled API tagged template
fn is_compiled_tagged_template(tagged: &TaggedTpl, api_name: &str, state: &TransformState) -> bool {
    match tagged.tag.as_ref() {
        Expr::Ident(ident) => {
            // Check if this identifier is imported from compiled
            if let Some(compiled_imports) = &state.compiled_imports {
                match api_name {
                    "css" => compiled_imports.css.as_ref().map_or(false, |imports| imports.contains(&ident.sym.to_string())),
                    "styled" => compiled_imports.styled.as_ref().map_or(false, |imports| imports.contains(&ident.sym.to_string())),
                    "keyframes" => compiled_imports.keyframes.as_ref().map_or(false, |imports| imports.contains(&ident.sym.to_string())),
                    _ => false,
                }
            } else {
                // If no compiled imports tracked, check default name
                ident.sym.as_ref() == api_name
            }
        }
        Expr::Member(member) => {
            // Handle styled.div``, styled.span`` etc.
            if api_name == "styled" {
                if let Expr::Ident(obj) = member.obj.as_ref() {
                    if let Some(compiled_imports) = &state.compiled_imports {
                        compiled_imports.styled.as_ref().map_or(false, |imports| imports.contains(&obj.sym.to_string()))
                    } else {
                        obj.sym.as_ref() == "styled"
                    }
                } else {
                    false
                }
            } else {
                false
            }
        }
        _ => false,
    }
}

/// Check if a JSX function call is transformed (for error detection)
pub fn is_transformed_jsx_function(expr: &Expr, _state: &TransformState) -> bool {
    if let Expr::Call(call) = expr {
        if let Callee::Expr(callee) = &call.callee {
            if let Expr::Ident(ident) = callee.as_ref() {
                return ident.sym.as_ref() == "jsx" || ident.sym.as_ref() == "_jsx";
            }
        }
    }
    false
}