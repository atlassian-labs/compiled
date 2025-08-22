use crate::types::TransformState;
use swc_core::ecma::ast::*;
use swc_core::ecma::ast::{AssignTarget, SimpleAssignTarget};
use std::collections::HashSet;

pub fn is_styled_call(call: &CallExpr, state: &TransformState) -> bool {
    // Detect styled.tag({...}) OR styled(Component)(...) OR styled('div')(...)
    let styled_locals = state
        .compiled_imports
        .as_ref()
        .and_then(|c| c.styled.as_ref());
    match &call.callee {
        Callee::Expr(expr) => {
            // styled.div({...})
            if let Expr::Member(member) = expr.as_ref() {
                if let Some(base_ident) = member.obj.as_ident() {
                    let base_ok = if let Some(locals) = styled_locals { locals.contains(&base_ident.sym.to_string()) } else { false };
                    if !base_ok { return false; }
                    return matches!(&member.prop, MemberProp::Ident(_))
                        && matches!(call.args.get(0).map(|a| a.expr.as_ref()), Some(Expr::Object(_)));
                }
            }
            // styled(Component)({...}) or styled('div')({...}) -> first call is callee, second call contains object
            if let Expr::Call(first_call) = expr.as_ref() {
                // first callee must be styled identifier and have one arg (component or string)
                let is_styled_ident = matches!(&first_call.callee, Callee::Expr(e) if matches!(e.as_ref(), Expr::Ident(id) if styled_locals.map_or(false, |l| l.contains(&id.sym.to_string()))));
                if is_styled_ident && first_call.args.len() == 1 {
                    // Our current node is the second call; ensure it passes an object
                    return matches!(call.args.get(0).map(|a| a.expr.as_ref()), Some(Expr::Object(_)));
                }
            }
            false
        }
        _ => false,
    }
}

pub fn transform_styled_call(
    n: &mut Expr,
    call: &CallExpr,
    _state: &mut TransformState,
    css_content_to_var: &mut std::collections::HashMap<String, String>,
    collected_css_sheets: &mut Vec<(String, String)>,
    extract: bool,
) -> (bool, bool) {
    // Handle styled.tag({ ... }) with support for static values and function values (via CSS variables)
    // Determine tag component or string
    let mut tag_component: Option<JSXElementName> = None;
    let mut default_component_ident: Option<Ident> = None;
    let mut styles_obj_opt: Option<&ObjectLit> = None;
    match &call.callee {
        Callee::Expr(expr) => {
            match expr.as_ref() {
                // styled.div({...})
                Expr::Member(member) => {
                    if let MemberProp::Ident(i) = &member.prop { tag_component = Some(JSXElementName::Ident(Ident::new(i.sym.clone(), Default::default()))); }
                    styles_obj_opt = call.args.get(0).and_then(|a| match a.expr.as_ref() { Expr::Object(o) => Some(o), _ => None });
                }
                // styled(Component)({...}) OR styled('div')({...})
                Expr::Call(first_call) => {
                    // Extract component/tag from first arg
                    if let Some(first_arg) = first_call.args.get(0) {
                        match first_arg.expr.as_ref() {
                            Expr::Lit(Lit::Str(s)) => { tag_component = Some(JSXElementName::Ident(Ident::new(s.value.clone(), Default::default()))); }
                            Expr::Ident(id) => { tag_component = Some(JSXElementName::Ident(id.clone())); default_component_ident = Some(id.clone()); }
                            Expr::Member(m) => { tag_component = Some(JSXElementName::JSXMemberExpr(JSXMemberExpr { obj: JSXObject::Ident(Ident::new("".into(), Default::default())), prop: Ident::new("".into(), Default::default()) })); }
                            _ => {}
                        }
                    }
                    styles_obj_opt = call.args.get(0).and_then(|a| match a.expr.as_ref() { Expr::Object(o) => Some(o), _ => None });
                }
                _ => {}
            }
        }
        _ => {}
    }
    let styles_obj = match styles_obj_opt { Some(o) => o, None => return (false, false) };

    // Rewrite function values to CSS variable references and collect variable assignments
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

    fn collect_member_props_in_expr(expr: &Expr, root_ident: &Ident, out: &mut HashSet<String>) {
        match expr {
            Expr::Member(m) => {
                if let Expr::Ident(obj_id) = m.obj.as_ref() {
                    if obj_id.sym == root_ident.sym {
                        if let MemberProp::Ident(p) = &m.prop { out.insert(p.sym.to_string()); }
                    }
                }
                // also traverse deeper
                collect_member_props_in_expr(m.obj.as_ref(), root_ident, out);
            }
            Expr::Call(c) => {
                if let Some(callee) = c.callee.as_expr() { collect_member_props_in_expr(callee, root_ident, out); }
                for a in &c.args { collect_member_props_in_expr(a.expr.as_ref(), root_ident, out); }
            }
            Expr::Unary(u) => collect_member_props_in_expr(u.arg.as_ref(), root_ident, out),
            Expr::Bin(b) => { collect_member_props_in_expr(b.left.as_ref(), root_ident, out); collect_member_props_in_expr(b.right.as_ref(), root_ident, out); }
            Expr::Cond(c) => { collect_member_props_in_expr(c.test.as_ref(), root_ident, out); collect_member_props_in_expr(c.cons.as_ref(), root_ident, out); collect_member_props_in_expr(c.alt.as_ref(), root_ident, out); }
            Expr::Array(a) => { for el in &a.elems { if let Some(e) = el { collect_member_props_in_expr(e.expr.as_ref(), root_ident, out); } } }
            Expr::Object(o) => { for p in &o.props { if let PropOrSpread::Prop(pb) = p { match pb.as_ref() { Prop::KeyValue(kv) => collect_member_props_in_expr(kv.value.as_ref(), root_ident, out), _ => {} } } } }
            Expr::Arrow(a) => {
                match a.body.as_ref() {
                    BlockStmtOrExpr::BlockStmt(b) => { for s in &b.stmts { if let Stmt::Expr(es) = s { collect_member_props_in_expr(es.expr.as_ref(), root_ident, out); } } }
                    BlockStmtOrExpr::Expr(e) => collect_member_props_in_expr(e.as_ref(), root_ident, out),
                }
            }
            Expr::Fn(f) => {
                if let Some(body) = &f.function.body { for s in &body.stmts { if let Stmt::Expr(es) = s { collect_member_props_in_expr(es.expr.as_ref(), root_ident, out); } } }
            }
            _ => {}
        }
    }

    fn rewrite_object_for_dynamic(
        obj: &ObjectLit,
        props_ident: &Ident,
        counter: &mut i32,
        out_vars: &mut Vec<(String, Expr, Option<String>, Option<String>)>,
        referenced_props: &mut HashSet<String>,
    ) -> ObjectLit {
        let mut new_props: Vec<PropOrSpread> = Vec::new();
        for p in &obj.props {
            if let PropOrSpread::Prop(pb) = p {
                if let Prop::KeyValue(kv) = pb.as_ref() {
                    let key_name = match &kv.key { PropName::Ident(i) => i.sym.to_string(), PropName::Str(s) => s.value.to_string(), _ => { new_props.push(p.clone()); continue; } };
                    match kv.value.as_ref() {
                        Expr::Object(inner) => {
                            let replaced = rewrite_object_for_dynamic(inner, props_ident, counter, out_vars, referenced_props);
                            new_props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: kv.key.clone(), value: Box::new(Expr::Object(replaced)) }))));
                        }
                        Expr::Arrow(a) => {
                            // Collect referenced props from function parameter and body
                            if let Some(param) = a.params.get(0) {
                                match param {
                                    Pat::Ident(bi) => {
                                        match a.body.as_ref() {
                                            BlockStmtOrExpr::BlockStmt(b) => {
                                                for s in &b.stmts {
                                                    if let Stmt::Expr(es) = s { collect_member_props_in_expr(es.expr.as_ref(), &bi.id, referenced_props); }
                                                }
                                            }
                                            BlockStmtOrExpr::Expr(e) => {
                                                collect_member_props_in_expr(e.as_ref(), &bi.id, referenced_props);
                                            }
                                        }
                                    }
                                    Pat::Object(op) => {
                                        for prop in &op.props {
                                            match prop {
                                                ObjectPatProp::KeyValue(k) => if let PropName::Ident(i) = &k.key { referenced_props.insert(i.sym.to_string()); },
                                                ObjectPatProp::Assign(a) => { referenced_props.insert(a.key.sym.to_string()); },
                                                _ => {}
                                            }
                                        }
                                    }
                                    _ => {}
                                }
                            }
                            *counter += 1;
                            let var_name = format!("_v{}", counter);
                            let css_var_ref = format!("var(--{})", var_name);
                            // Prepare function call with props: (<fn>)(props)
                            let fn_expr = kv.value.as_ref().clone();
                            let call_expr = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(fn_expr)), args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Ident(props_ident.clone())) }], type_args: None });
                            let mut suffix = if !is_unitless_property(&key_name) { Some("px".to_string()) } else { None };
                            let mut prefix: Option<String> = None;
                            if key_name == "content" { prefix = Some("\"".to_string()); suffix = Some("\"".to_string()); }
                            out_vars.push((var_name.clone(), call_expr, suffix, prefix));
                            new_props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: kv.key.clone(), value: Box::new(Expr::Lit(Lit::Str(Str { span: Default::default(), value: css_var_ref.into(), raw: None }))) }))));
                        }
                        Expr::Fn(f) => {
                            if let Some(param) = f.function.params.get(0) {
                                match &param.pat {
                                    Pat::Ident(bi) => {
                                        if let Some(body) = &f.function.body { for s in &body.stmts { if let Stmt::Expr(es) = s { collect_member_props_in_expr(es.expr.as_ref(), &bi.id, referenced_props); } } }
                                    }
                                    Pat::Object(op) => {
                                        for prop in &op.props {
                                            match prop {
                                                ObjectPatProp::KeyValue(k) => if let PropName::Ident(i) = &k.key { referenced_props.insert(i.sym.to_string()); },
                                                ObjectPatProp::Assign(a) => { referenced_props.insert(a.key.sym.to_string()); },
                                                _ => {}
                                            }
                                        }
                                    }
                                    _ => {}
                                }
                            }
                            *counter += 1;
                            let var_name = format!("_v{}", counter);
                            let css_var_ref = format!("var(--{})", var_name);
                            // Prepare function call with props: (<fn>)(props)
                            let fn_expr = kv.value.as_ref().clone();
                            let call_expr = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(fn_expr)), args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Ident(props_ident.clone())) }], type_args: None });
                            let mut suffix = if !is_unitless_property(&key_name) { Some("px".to_string()) } else { None };
                            let mut prefix: Option<String> = None;
                            if key_name == "content" { prefix = Some("\"".to_string()); suffix = Some("\"".to_string()); }
                            out_vars.push((var_name.clone(), call_expr, suffix, prefix));
                            new_props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: kv.key.clone(), value: Box::new(Expr::Lit(Lit::Str(Str { span: Default::default(), value: css_var_ref.into(), raw: None }))) }))));
                        }
                        _ => {
                            new_props.push(p.clone());
                        }
                    }
                } else {
                    new_props.push(p.clone());
                }
            } else {
                new_props.push(p.clone());
            }
        }
        ObjectLit { span: obj.span, props: new_props }
    }

    let props_ident = Ident::new("__cmplp".into(), Default::default());
    let mut counter = 0;
    let mut dynamic_vars: Vec<(String, Expr, Option<String>, Option<String>)> = Vec::new();
    let mut referenced_props: HashSet<String> = HashSet::new();
    let rewritten_obj = rewrite_object_for_dynamic(styles_obj, &props_ident, &mut counter, &mut dynamic_vars, &mut referenced_props);

    // Build atomic rules from rewritten object (includes var(--..) placeholders) and transform to sheets/classes
    let atomic_rules = crate::utils::css_builder::build_atomic_rules_from_object(&rewritten_obj);
    if atomic_rules.is_empty() { return (false, false); }
    let (sheets, class_names) = crate::utils::css_builder::transform_atomic_rules_to_sheets(&atomic_rules);
            let mut sheet_vars: Vec<String> = Vec::new();
            for sheet in sheets {
                if let Some(existing) = css_content_to_var.get(&sheet) {
                    sheet_vars.push(existing.clone());
                } else {
                    let index = collected_css_sheets.len();
                    let var_name = if index == 0 { "_".to_string() } else { format!("_{}", index + 1) };
                    css_content_to_var.insert(sheet.clone(), var_name.clone());
                    collected_css_sheets.push((var_name.clone(), sheet));
                    sheet_vars.push(var_name);
                }
            }

            // Build className={ax(["..."])}
            let class_strs: Vec<Option<ExprOrSpread>> = class_names
                .iter()
        .map(|cn| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(Str { span: Default::default(), value: cn.clone().into(), raw: None }))) }))
                .collect();
            let ax_call = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Ident(Ident::new("ax".into(), Default::default())))), args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: class_strs })) }], type_args: None });

    // Build style object with CSS variable assignments using ix() and merge __cmpls
    let mut style_props: Vec<PropOrSpread> = Vec::new();
    // Include spread of existing style: {...__cmpls}
    style_props.push(PropOrSpread::Spread(SpreadElement { dot3_token: Default::default(), expr: Box::new(Expr::Ident(Ident::new("__cmpls".into(), Default::default()))) }));
    for (var_name, value_expr, maybe_suffix, maybe_prefix) in &dynamic_vars {
        // key is the CSS var name: "--<var>"
        let key_str = Str { span: Default::default(), value: format!("--{}", var_name).into(), raw: None };
        let mut ix_args: Vec<ExprOrSpread> = vec![ExprOrSpread { spread: None, expr: Box::new(value_expr.clone()) }];
        if let Some(suf) = maybe_suffix { ix_args.push(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(Str { span: Default::default(), value: suf.clone().into(), raw: None }))) }); }
        if let Some(pre) = maybe_prefix { ix_args.push(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(Str { span: Default::default(), value: pre.clone().into(), raw: None }))) }); }
        let ix_call = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Ident(Ident::new("ix".into(), Default::default())))), args: ix_args, type_args: None });
        style_props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp { key: PropName::Str(key_str), value: Box::new(ix_call) }))));
    }
    // className={ax([classes..., __cmplp.className])}
    let mut class_array_elems: Vec<Option<ExprOrSpread>> = class_names
        .iter()
        .map(|cn| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(Str { span: Default::default(), value: cn.clone().into(), raw: None }))) }))
        .collect();
    // append __cmplp.className
    class_array_elems.push(Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Member(MemberExpr { span: Default::default(), obj: Box::new(Expr::Ident(Ident::new("__cmplp".into(), Default::default()))), prop: MemberProp::Ident(Ident::new("className".into(), Default::default())), })) }));
    let ax_call_full = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Ident(Ident::new("ax".into(), Default::default())))), args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: class_array_elems })) }], type_args: None });
    let mut opening_attrs: Vec<JSXAttrOrSpread> = vec![JSXAttrOrSpread::JSXAttr(JSXAttr { span: Default::default(), name: JSXAttrName::Ident(Ident::new("className".into(), Default::default())), value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(ax_call_full)) })) })];
    if !style_props.is_empty() {
        let style_obj = Expr::Object(ObjectLit { span: Default::default(), props: style_props });
        opening_attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr { span: Default::default(), name: JSXAttrName::Ident(Ident::new("style".into(), Default::default())), value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(style_obj)) })) }));
    }
    // Add ref and spread props
    opening_attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr { span: Default::default(), name: JSXAttrName::Ident(Ident::new("ref".into(), Default::default())), value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(Expr::Ident(Ident::new("__cmplr".into(), Default::default())))) })) }));
    opening_attrs.push(JSXAttrOrSpread::SpreadElement(SpreadElement { dot3_token: Default::default(), expr: Box::new(Expr::Ident(Ident::new("__cmplp".into(), Default::default()))) }));

    // JSX for element using the `as` prop alias C
    let opening = JSXOpeningElement { span: Default::default(), name: JSXElementName::Ident(Ident::new("C".into(), Default::default())), attrs: opening_attrs, self_closing: true, type_args: None };
    let comp_elem = JSXElement { span: Default::default(), opening, children: vec![], closing: None };

            let body_jsx: JSXElement = if extract {
                comp_elem
            } else {
        // CS + CC wrapping
                let cs_open = JSXOpeningElement { span: Default::default(), name: JSXElementName::Ident(Ident::new("CS".into(), Default::default())), attrs: vec![], self_closing: false, type_args: None };
                let cs_close = JSXClosingElement { span: Default::default(), name: JSXElementName::Ident(Ident::new("CS".into(), Default::default())) };
                let cs_array_elems: Vec<Option<ExprOrSpread>> = sheet_vars.iter().map(|v| Some(ExprOrSpread { spread: None, expr: Box::new(Expr::Ident(Ident::new(v.clone().into(), Default::default()))) })).collect();
                let cs_expr = JSXExprContainer { span: Default::default(), expr: JSXExpr::Expr(Box::new(Expr::Array(ArrayLit { span: Default::default(), elems: cs_array_elems }))) };
                let cs_elem = JSXElement { span: Default::default(), opening: cs_open, children: vec![JSXElementChild::JSXExprContainer(cs_expr)], closing: Some(cs_close) };

                let cc_open = JSXOpeningElement { span: Default::default(), name: JSXElementName::Ident(Ident::new("CC".into(), Default::default())), attrs: vec![], self_closing: false, type_args: None };
                let cc_close = JSXClosingElement { span: Default::default(), name: JSXElementName::Ident(Ident::new("CC".into(), Default::default())) };
                let cc_children = vec![JSXElementChild::JSXElement(Box::new(cs_elem)), JSXElementChild::JSXElement(Box::new(comp_elem))];
                JSXElement { span: Default::default(), opening: cc_open, children: cc_children, closing: Some(cc_close) }
            };

    // Build param pattern: ({ as: C = "tag", style: __cmpls, ...__cmplp }, __cmplr)
    let c_ident = Ident::new("C".into(), Default::default());
    let default_tag = if let Some(ident) = &default_component_ident { Expr::Ident(ident.clone()) } else {
        match &tag_component { Some(JSXElementName::Ident(id)) => Expr::Lit(Lit::Str(Str { span: Default::default(), value: id.sym.clone().into(), raw: None })), _ => Expr::Lit(Lit::Str(Str { span: Default::default(), value: "div".into(), raw: None })) }
    };
    let as_value_pat = Pat::Assign(AssignPat { span: Default::default(), left: Box::new(Pat::Ident(BindingIdent { id: c_ident.clone(), type_ann: None })), right: Box::new(default_tag) });
    let as_kv = ObjectPatProp::KeyValue(KeyValuePatProp { key: PropName::Ident(Ident::new("as".into(), Default::default())), value: Box::new(as_value_pat) });
    let style_kv = ObjectPatProp::KeyValue(KeyValuePatProp { key: PropName::Ident(Ident::new("style".into(), Default::default())), value: Box::new(Pat::Ident(BindingIdent { id: Ident::new("__cmpls".into(), Default::default()), type_ann: None })) });
    let rest = ObjectPatProp::Rest(RestPat { span: Default::default(), dot3_token: Default::default(), arg: Box::new(Pat::Ident(BindingIdent { id: Ident::new("__cmplp".into(), Default::default()), type_ann: None })), type_ann: None });
    let obj_pat = Pat::Object(ObjectPat { span: Default::default(), props: vec![as_kv, style_kv, rest], optional: false, type_ann: None });
    // Insert innerRef guard and build dynamic prop filtering for intrinsic elements
    let throw_error_expr = Expr::New(NewExpr {
        span: Default::default(),
        callee: Box::new(Expr::Ident(Ident::new("Error".into(), Default::default()))),
        args: Some(vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Lit(Lit::Str(Str { span: Default::default(), value: "Please use 'ref' instead of 'innerRef'.".into(), raw: None })) ) }]),
        type_args: None,
    });
    let throw_stmt = Stmt::Throw(ThrowStmt { span: Default::default(), arg: Box::new(throw_error_expr) });
    let guard = Stmt::If(IfStmt {
        span: Default::default(),
        test: Box::new(Expr::Member(MemberExpr { span: Default::default(), obj: Box::new(Expr::Ident(Ident::new("__cmplp".into(), Default::default()))), prop: MemberProp::Ident(Ident::new("innerRef".into(), Default::default())) })),
        cons: Box::new(Stmt::Block(BlockStmt { span: Default::default(), stmts: vec![throw_stmt] })),
        alt: None,
    });
    // Determine if target is intrinsic (lowercase tag and not a component ident)
    let is_intrinsic = match &tag_component { Some(JSXElementName::Ident(id)) => id.sym.chars().next().map(|c| c.is_ascii_lowercase()).unwrap_or(false), _ => false } && default_component_ident.is_none();
    // Build allowlist similar to Emotion is-prop-valid used by Babel
    fn is_allowed_dom(name: &str) -> bool {
        if name == "children" { return true; }
        if name.starts_with("data-") || name.starts_with("aria-") { return true; }
        if name.starts_with("on") && name.len() > 2 && name.as_bytes()[2].is_ascii_uppercase() { return true; }
        matches!(name,
            // Core HTML/global
            "accept" | "acceptCharset" | "accessKey" | "action" | "allow" | "allowFullScreen" |
            "alt" | "async" | "autoComplete" | "autoFocus" | "autoPlay" | "capture" |
            "cellPadding" | "cellSpacing" | "charSet" | "challenge" | "checked" | "cite" |
            "classID" | "className" | "colSpan" | "cols" | "content" | "contentEditable" |
            "contextMenu" | "controls" | "controlsList" | "coords" | "crossOrigin" |
            "dangerouslySetInnerHTML" | "data" | "dateTime" | "default" | "defer" | "dir" |
            "disabled" | "download" | "draggable" | "encType" | "enterKeyHint" | "form" |
            "formAction" | "formEncType" | "formMethod" | "formNoValidate" | "formTarget" |
            "frameBorder" | "headers" | "height" | "hidden" | "high" | "href" | "hrefLang" |
            "htmlFor" | "httpEquiv" | "id" | "inputMode" | "integrity" | "is" | "kind" |
            "label" | "lang" | "list" | "loop" | "low" | "max" | "maxLength" | "media" |
            "method" | "min" | "minLength" | "multiple" | "muted" | "name" | "nonce" |
            "noValidate" | "open" | "optimum" | "pattern" | "placeholder" | "playsInline" |
            "poster" | "preload" | "readOnly" | "referrerPolicy" | "rel" | "required" |
            "reversed" | "role" | "rows" | "rowSpan" | "sandbox" | "scope" | "selected" |
            "shape" | "size" | "sizes" | "span" | "spellCheck" | "src" | "srcDoc" | "srcLang" |
            "srcSet" | "start" | "step" | "style" | "tabIndex" | "target" | "title" |
            "translate" | "type" | "useMap" | "value" | "width" | "wrap" |
            // A few common SVG/ARIA-compatible React DOM props
            "viewBox" | "preserveAspectRatio" | "focusable" | "xmlLang" | "xmlBase" | "xmlSpace" |
            "x" | "y" | "dx" | "dy" | "r" | "rx" | "ry" | "cx" | "cy"
        )
    }
    let mut props_to_strip: Vec<String> = Vec::new();
    if is_intrinsic { for p in referenced_props { if !is_allowed_dom(&p) { props_to_strip.push(p); } } }
    // const { <props_to_strip>, ...__cmpldp } = __cmplp; __cmplp = __cmpldp;
    let destruct = if !props_to_strip.is_empty() {
        Stmt::Decl(Decl::Var(Box::new(VarDecl {
            span: Default::default(),
            kind: VarDeclKind::Const,
            declare: false,
            decls: vec![VarDeclarator {
                span: Default::default(),
                name: Pat::Object(ObjectPat {
                    span: Default::default(),
                    props: {
                        let mut v: Vec<ObjectPatProp> = Vec::new();
                        for p in &props_to_strip { v.push(ObjectPatProp::KeyValue(KeyValuePatProp { key: PropName::Ident(Ident::new(p.clone().into(), Default::default())), value: Box::new(Pat::Ident(BindingIdent { id: Ident::new("__cmplx".into(), Default::default()), type_ann: None })) })); }
                        v.push(ObjectPatProp::Rest(RestPat { span: Default::default(), dot3_token: Default::default(), arg: Box::new(Pat::Ident(BindingIdent { id: Ident::new("__cmpldp".into(), Default::default()), type_ann: None })), type_ann: None }));
                        v
                    },
                    optional: false,
                    type_ann: None,
                }),
                init: Some(Box::new(Expr::Ident(Ident::new("__cmplp".into(), Default::default())))),
                definite: false,
            }],
        })))
    } else { Stmt::Empty(EmptyStmt { span: Default::default() }) };
    let reassign_left = AssignTarget::Simple(SimpleAssignTarget::Ident(BindingIdent { id: Ident::new("__cmplp".into(), Default::default()), type_ann: None }));
    let reassign = Stmt::Expr(ExprStmt { span: Default::default(), expr: Box::new(Expr::Assign(AssignExpr { span: Default::default(), op: AssignOp::Assign, left: reassign_left, right: Box::new(Expr::Ident(Ident::new("__cmpldp".into(), Default::default()))) })) });
    let mut stmts_vec: Vec<Stmt> = vec![guard];
    if !props_to_strip.is_empty() { stmts_vec.push(destruct); stmts_vec.push(reassign); }
    stmts_vec.push(Stmt::Return(ReturnStmt { span: Default::default(), arg: Some(Box::new(Expr::JSXElement(Box::new(body_jsx)))) }));
    let body_block = BlockStmt { span: Default::default(), stmts: stmts_vec };
    let arrow = ArrowExpr { span: Default::default(), params: vec![obj_pat, Pat::Ident(BindingIdent { id: Ident::new("__cmplr".into(), Default::default()), type_ann: None })], body: Box::new(BlockStmtOrExpr::BlockStmt(body_block)), is_async: false, is_generator: false, type_params: None, return_type: None };
            let forward_ref_call = Expr::Call(CallExpr { span: Default::default(), callee: Callee::Expr(Box::new(Expr::Ident(Ident::new("forwardRef".into(), Default::default())))), args: vec![ExprOrSpread { spread: None, expr: Box::new(Expr::Arrow(arrow)) }], type_args: None });
            *n = forward_ref_call;
    (true, true)
}
