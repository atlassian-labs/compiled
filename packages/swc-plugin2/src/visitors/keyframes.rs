use crate::types::{KeyframeVarSpec, KeyframesInfo, TransformState};
use crate::utils::css_builder;
use swc_core::ecma::ast::*;

pub fn is_keyframes_call(call: &CallExpr, state: &TransformState) -> bool {
    let maybe_names = state
        .compiled_imports
        .as_ref()
        .and_then(|c| c.keyframes.as_ref());
    match &call.callee {
        Callee::Expr(expr) => match expr.as_ref() {
            Expr::Ident(id) => match maybe_names {
                Some(locals) => locals.contains(&id.sym.to_string()),
                None => id.sym.as_ref() == "keyframes",
            },
            _ => false,
        },
        _ => false,
    }
}

pub fn is_keyframes_tagged_template(expr: &Expr, state: &TransformState) -> bool {
    // We don't plan to support tagged template literals for keyframes in swc-plugin2 per requirements
    // Always return false so it won't be transformed
    match expr {
        Expr::TaggedTpl(tagged) => match tagged.tag.as_ref() {
            Expr::Ident(id) => {
                let maybe = state
                    .compiled_imports
                    .as_ref()
                    .and_then(|c| c.keyframes.as_ref());
                if let Some(locals) = maybe {
                    locals.contains(&id.sym.to_string())
                } else {
                    id.sym.as_ref() == "keyframes"
                }
            }
            _ => false,
        },
        _ => false,
    }
}

fn is_unitless_property(property: &str) -> bool {
    matches!(property,
        "animationIterationCount" | "basePalette" | "borderImageOutset" | "borderImageSlice" | "borderImageWidth" |
        "boxFlex" | "boxFlexGroup" | "boxOrdinalGroup" | "columnCount" | "columns" | "flex" | "flexGrow" | "flexPositive" |
        "flexShrink" | "flexNegative" | "flexOrder" | "fontSizeAdjust" | "fontWeight" | "gridArea" | "gridRow" |
        "gridRowEnd" | "gridRowSpan" | "gridRowStart" | "gridColumn" | "gridColumnEnd" | "gridColumnSpan" | "gridColumnStart" |
        "lineClamp" | "lineHeight" | "opacity" | "order" | "orphans" | "tabSize" | "WebkitLineClamp" | "widows" | "zIndex" | "zoom" |
        "fillOpacity" | "floodOpacity" | "stopOpacity" | "strokeDasharray" | "strokeDashoffset" | "strokeMiterlimit" | "strokeOpacity" | "strokeWidth"
    )
}

pub fn transform_keyframes_call(
    call: &CallExpr,
    state: &mut TransformState,
) -> Option<(String, String, Vec<KeyframeVarSpec>)> {
    // Expect keyframes(<object or string>) and return (sheet_var_name, keyframes_name)
    if call.args.len() != 1 {
        return None;
    }
    let arg = call.args[0].expr.as_ref();
    // Build rule body from object or string
    // Derive a keyframes name based on a rough hash of input AST
    let key_for_hash = format!("{:?}", arg);
    let name_hash = crate::utils::css_builder::hash(&key_for_hash);
    let kf_name = format!("k{}", &name_hash[..8.min(name_hash.len())]);
    let mut body = String::new();
    let mut var_specs: Vec<KeyframeVarSpec> = Vec::new();
    match arg {
        Expr::Object(obj) => {
            let mut next_dyn_index: i32 = 0;
            for prop in &obj.props {
                if let PropOrSpread::Prop(p) = prop {
                    if let Prop::KeyValue(kv) = p.as_ref() {
                        let key_name = match &kv.key {
                            PropName::Ident(i) => i.sym.to_string(),
                            PropName::Str(s) => s.value.to_string(),
                            _ => continue,
                        };
                        if let Expr::Object(inner) = kv.value.as_ref() {
                            // Collect inner rules to a block
                            let mut decls: Vec<String> = Vec::new();
                            for in_prop in &inner.props {
                                if let PropOrSpread::Prop(pb) = in_prop {
                                    if let Prop::KeyValue(ikv) = pb.as_ref() {
                                        let prop_name = match &ikv.key { PropName::Ident(i) => i.sym.to_string(), PropName::Str(s) => s.value.to_string(), _ => continue };
                                        let css_prop = css_builder::camel_to_kebab_case(&prop_name);
                                        let mut needs_px = !is_unitless_property(&prop_name);
                                        let mut prefix: Option<String> = None;
                                        if prop_name == "content" { prefix = Some("\"".to_string()); needs_px = false; }
                                        let value_expr = ikv.value.as_ref();
                                        match value_expr {
                                            Expr::Lit(Lit::Str(s)) => {
                                                decls.push(format!("{}:{}", css_prop, css_builder::compact_declaration(&format!("{}:{}", css_prop, s.value.to_string())).split(':').nth(1).unwrap_or("")));
                                            }
                                            Expr::Lit(Lit::Num(n)) => {
                                                let v = if n.value.fract() == 0.0 { format!("{}", n.value as i64) } else { format!("{}", n.value) };
                                                let value = if needs_px && v != "0" { format!("{}px", v) } else { v };
                                                decls.push(format!("{}:{}", css_prop, value));
                                            }
                                            Expr::Ident(_) | Expr::Member(_) | Expr::Call(_) | Expr::Arrow(_) | Expr::Fn(_) => {
                                                next_dyn_index += 1;
                                                let var_name = format!("_k{}", next_dyn_index);
                                                let ix_suffix = if needs_px { Some("px".to_string()) } else { None };
                                                var_specs.push(KeyframeVarSpec { var_name: var_name.clone(), value_expr: Box::new(value_expr.clone()), suffix: ix_suffix, prefix });
                                                decls.push(format!("{}:var(--{})", css_prop, var_name));
                                            }
                                            _ => {}
                                        }
                                    }
                                }
                            }
                            let step = key_name.replace("from", "0%");
                            body.push_str(&format!("{}{{{}}}", step, decls.join("")));
                        }
                    }
                }
            }
        }
        Expr::Lit(Lit::Str(s)) => {
            body.push_str(&s.value);
        }
        _ => {}
    }
    if body.is_empty() {
        return None;
    }
    let sheet_text = format!("@keyframes {}{{{}}}", kf_name, body);
    Some((sheet_text, kf_name, var_specs))
}

pub fn record_keyframes_ident(name: &str, info: KeyframesInfo, state: &mut TransformState) {
    state.keyframes_by_ident.insert(name.to_string(), info);
}


