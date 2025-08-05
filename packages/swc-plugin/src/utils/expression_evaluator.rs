use swc_core::ecma::ast::*;
use crate::utils::variable_context::VariableContext;

/// Attempts to statically evaluate an expression to a literal value
/// Returns Some(Expr) if evaluation was successful, None otherwise
pub fn evaluate_expression(expr: &Expr) -> Option<Expr> {
    evaluate_expression_with_context(expr, &VariableContext::new())
}

/// Attempts to statically evaluate an expression with a variable context
/// Returns Some(Expr) if evaluation was successful, None otherwise
pub fn evaluate_expression_with_context(expr: &Expr, context: &VariableContext) -> Option<Expr> {
    match expr {
        // Already literal values - return as-is
        Expr::Lit(_lit) => Some(expr.clone()),
        
        // Logical expressions like show && color (handle before general binary expressions)
        Expr::Bin(bin_expr) if matches!(bin_expr.op, BinaryOp::LogicalAnd | BinaryOp::LogicalOr) => {
            evaluate_logical_expression(bin_expr, context)
        }
        
        // Binary expressions like 8 * 2, 10 + 5, etc.
        Expr::Bin(bin_expr) => evaluate_binary_expression(bin_expr, context),
        
        // Identifiers referencing constants
        Expr::Ident(ident) => {
            // Try to resolve the identifier from the context
            if let Some(resolved) = context.get_binding(&ident.sym.to_string()) {
                // For arrays and objects, return them directly without re-evaluation
                // This prevents infinite recursion and preserves the structure
                match resolved {
                    Expr::Array(_) | Expr::Object(_) => Some(resolved.clone()),
                    _ => evaluate_expression_with_context(resolved, context),
                }
            } else {
                None
            }
        }
        
        // Template literals with static values
        Expr::Tpl(tpl) => evaluate_template_literal(tpl, context),
        
        // Conditional expressions like isLarge ? '16px' : '12px'
        Expr::Cond(cond_expr) => evaluate_conditional_expression(cond_expr, context),
        
        // Unary expressions like -5, +10
        Expr::Unary(unary_expr) => evaluate_unary_expression(unary_expr, context),
        
        // Member expressions like theme.colors.primary
        Expr::Member(member_expr) => evaluate_member_expression(member_expr, context),
        
        // Call expressions - most should fall back to CSS variables
        Expr::Call(_call_expr) => {
            // TODO: Could implement evaluation for pure functions
            None
        }
        
        _ => None,
    }
}

/// Evaluates binary expressions like 8 * 2, 10 + 5, etc.
fn evaluate_binary_expression(bin_expr: &BinExpr, context: &VariableContext) -> Option<Expr> {
    // Skip logical operators - they're handled separately
    if matches!(bin_expr.op, BinaryOp::LogicalAnd | BinaryOp::LogicalOr) {
        return None;
    }
    
    // First try to evaluate both sides
    let left = evaluate_expression_with_context(&bin_expr.left, context)?;
    let right = evaluate_expression_with_context(&bin_expr.right, context)?;
    
    // Extract numeric values
    let left_num = match &left {
        Expr::Lit(Lit::Num(n)) => n.value,
        _ => return None,
    };
    
    let right_num = match &right {
        Expr::Lit(Lit::Num(n)) => n.value,
        _ => return None,
    };
    
    // Perform the operation
    let result = match bin_expr.op {
        BinaryOp::Add => left_num + right_num,
        BinaryOp::Sub => left_num - right_num,
        BinaryOp::Mul => left_num * right_num,
        BinaryOp::Div => {
            if right_num == 0.0 {
                return None; // Avoid division by zero
            }
            left_num / right_num
        }
        BinaryOp::Mod => left_num % right_num,
        _ => return None, // Other operators not supported for now
    };
    
    Some(Expr::Lit(Lit::Num(Number {
        span: bin_expr.span,
        value: result,
        raw: None,
    })))
}

/// Evaluates template literals with static values and expressions
fn evaluate_template_literal(tpl: &Tpl, context: &VariableContext) -> Option<Expr> {
    let mut result = String::new();
    
    // Process template literal parts
    for (i, quasi) in tpl.quasis.iter().enumerate() {
        // Add the static string part
        result.push_str(&quasi.raw);
        
        // If there's a corresponding expression, try to evaluate it
        if i < tpl.exprs.len() {
            if let Some(evaluated) = evaluate_expression_with_context(&tpl.exprs[i], context) {
                match &evaluated {
                    Expr::Lit(Lit::Str(s)) => {
                        result.push_str(&s.value);
                    }
                    Expr::Lit(Lit::Num(n)) => {
                        // Convert number to string (similar to JavaScript behavior)
                        result.push_str(&n.value.to_string());
                    }
                    Expr::Lit(Lit::Bool(b)) => {
                        result.push_str(&b.value.to_string());
                    }
                    _ => {
                        // Can't evaluate this expression statically
                        return None;
                    }
                }
            } else {
                // Can't evaluate this expression statically
                return None;
            }
        }
    }
    
    Some(Expr::Lit(Lit::Str(Str {
        span: tpl.span,
        value: result.into(),
        raw: None,
    })))
}

/// Evaluates conditional expressions with static conditions
fn evaluate_conditional_expression(cond_expr: &CondExpr, context: &VariableContext) -> Option<Expr> {
    // Evaluate the test condition
    let test_result = evaluate_expression_with_context(&cond_expr.test, context)?;
    
    // Check if the test evaluates to a boolean literal
    let is_truthy = match &test_result {
        Expr::Lit(Lit::Bool(b)) => b.value,
        Expr::Lit(Lit::Num(n)) => n.value != 0.0,
        Expr::Lit(Lit::Str(s)) => !s.value.is_empty(),
        Expr::Lit(Lit::Null(_)) => false,
        _ => return None, // Can't statically determine truthiness
    };
    
    // Return the appropriate branch
    if is_truthy {
        evaluate_expression_with_context(&cond_expr.cons, context)
    } else {
        evaluate_expression_with_context(&cond_expr.alt, context)
    }
}

/// Evaluates unary expressions like -5, +10, !true
fn evaluate_unary_expression(unary_expr: &UnaryExpr, context: &VariableContext) -> Option<Expr> {
    let arg = evaluate_expression_with_context(&unary_expr.arg, context)?;
    
    match unary_expr.op {
        UnaryOp::Minus => {
            if let Expr::Lit(Lit::Num(n)) = &arg {
                Some(Expr::Lit(Lit::Num(Number {
                    span: unary_expr.span,
                    value: -n.value,
                    raw: None,
                })))
            } else {
                None
            }
        }
        UnaryOp::Plus => {
            if let Expr::Lit(Lit::Num(_)) = &arg {
                Some(arg) // +num is just num
            } else {
                None
            }
        }
        UnaryOp::Bang => {
            match &arg {
                Expr::Lit(Lit::Bool(b)) => Some(Expr::Lit(Lit::Bool(Bool {
                    span: unary_expr.span,
                    value: !b.value,
                }))),
                Expr::Lit(Lit::Num(n)) => Some(Expr::Lit(Lit::Bool(Bool {
                    span: unary_expr.span,
                    value: n.value == 0.0,
                }))),
                Expr::Lit(Lit::Str(s)) => Some(Expr::Lit(Lit::Bool(Bool {
                    span: unary_expr.span,
                    value: s.value.is_empty(),
                }))),
                Expr::Lit(Lit::Null(_)) => Some(Expr::Lit(Lit::Bool(Bool {
                    span: unary_expr.span,
                    value: true,
                }))),
                _ => None,
            }
        }
        _ => None, // Other unary operators not supported
    }
}

/// Evaluates member expressions like theme.colors.primary
fn evaluate_member_expression(member_expr: &MemberExpr, context: &VariableContext) -> Option<Expr> {
    // First try to evaluate the object
    let obj = evaluate_expression_with_context(&member_expr.obj, context)?;
    
    match &obj {
        Expr::Object(obj_lit) => {
            // Handle different property access types
            match &member_expr.prop {
                MemberProp::Ident(ident) => {
                    let prop_name = ident.sym.as_ref();
                    // Find the property in the object
                    for prop in &obj_lit.props {
                        if let PropOrSpread::Prop(prop) = prop {
                            if let Prop::KeyValue(kv) = &**prop {
                                let key_matches = match &kv.key {
                                    PropName::Ident(ident) => ident.sym.as_ref() == prop_name,
                                    PropName::Str(s) => s.value.as_ref() == prop_name,
                                    _ => false,
                                };
                                
                                if key_matches {
                                    // For objects and arrays, return them directly to preserve structure
                                    // For other expressions, evaluate them
                                    match &*kv.value {
                                        Expr::Array(_) | Expr::Object(_) => return Some((*kv.value).clone()),
                                        _ => return evaluate_expression_with_context(&kv.value, context),
                                    }
                                }
                            }
                        }
                    }
                    None
                }
                MemberProp::Computed(computed) => {
                    // Handle computed property access like obj[0] or obj["key"]
                    if let Some(prop_expr) = evaluate_expression_with_context(&computed.expr, context) {
                        match prop_expr {
                            Expr::Lit(Lit::Str(s)) => {
                                let prop_name = s.value.as_ref();
                                // Find the property in the object
                                for prop in &obj_lit.props {
                                    if let PropOrSpread::Prop(prop) = prop {
                                        if let Prop::KeyValue(kv) = &**prop {
                                            let key_matches = match &kv.key {
                                                PropName::Ident(ident) => ident.sym.as_ref() == prop_name,
                                                PropName::Str(s2) => s2.value.as_ref() == prop_name,
                                                _ => false,
                                            };
                                            
                                            if key_matches {
                                                // For objects and arrays, return them directly to preserve structure
                                                // For other expressions, evaluate them
                                                match &*kv.value {
                                                    Expr::Array(_) | Expr::Object(_) => return Some((*kv.value).clone()),
                                                    _ => return evaluate_expression_with_context(&kv.value, context),
                                                }
                                            }
                                        }
                                    }
                                }
                                None
                            }
                            Expr::Lit(Lit::Num(n)) => {
                                // Convert number to string for array-like access
                                evaluate_array_like_access(&obj, n.value as usize)
                            }
                            _ => None,
                        }
                    } else {
                        None
                    }
                }
                _ => None,
            }
        }
        Expr::Array(arr) => {
            // Handle array access like colors[0]
            if let MemberProp::Computed(computed) = &member_expr.prop {
                // Evaluate the index expression
                if let Some(index_expr) = evaluate_expression_with_context(&computed.expr, context) {
                    if let Expr::Lit(Lit::Num(n)) = &index_expr {
                        let index = n.value as usize;
                        // Get the element at the specified index
                        if let Some(Some(elem)) = arr.elems.get(index) {
                            return Some((*elem.expr).clone());
                        }
                    }
                }
            }
            None
        }
        _ => None,
    }
}

/// Helper function for array-like access on objects
fn evaluate_array_like_access(obj: &Expr, index: usize) -> Option<Expr> {
    if let Expr::Array(arr) = obj {
        if index < arr.elems.len() {
            if let Some(Some(elem)) = arr.elems.get(index) {
                return Some((*elem.expr).clone());
            }
        }
    }
    None
}

/// Evaluates logical expressions like show && color
fn evaluate_logical_expression(bin_expr: &BinExpr, context: &VariableContext) -> Option<Expr> {
    match bin_expr.op {
        BinaryOp::LogicalAnd => {
            // Evaluate left side first
            let left = evaluate_expression_with_context(&bin_expr.left, context)?;
            
            // Check if left is truthy
            let left_truthy = match &left {
                Expr::Lit(Lit::Bool(b)) => b.value,
                Expr::Lit(Lit::Num(n)) => n.value != 0.0,
                Expr::Lit(Lit::Str(s)) => !s.value.is_empty(),
                Expr::Lit(Lit::Null(_)) => false,
                _ => return None, // Can't determine truthiness
            };
            
            if left_truthy {
                // Return right side if left is truthy
                evaluate_expression_with_context(&bin_expr.right, context)
            } else {
                // Return left side if it's falsy
                Some(left)
            }
        }
        BinaryOp::LogicalOr => {
            // Evaluate left side first
            let left = evaluate_expression_with_context(&bin_expr.left, context)?;
            
            // Check if left is truthy
            let left_truthy = match &left {
                Expr::Lit(Lit::Bool(b)) => b.value,
                Expr::Lit(Lit::Num(n)) => n.value != 0.0,
                Expr::Lit(Lit::Str(s)) => !s.value.is_empty(),
                Expr::Lit(Lit::Null(_)) => false,
                _ => return None, // Can't determine truthiness
            };
            
            if left_truthy {
                // Return left side if it's truthy
                Some(left)
            } else {
                // Return right side if left is falsy
                evaluate_expression_with_context(&bin_expr.right, context)
            }
        }
        _ => None, // Not a logical operator
    }
}

#[cfg(test)]
mod tests {
    use super::*;


    #[test]
    fn test_evaluate_binary_expression() {
        // Test 8 * 2
        let expr = Expr::Bin(BinExpr {
            span: swc_core::common::DUMMY_SP,
            op: BinaryOp::Mul,
            left: Box::new(Expr::Lit(Lit::Num(Number {
                span: swc_core::common::DUMMY_SP,
                value: 8.0,
                raw: None,
            }))),
            right: Box::new(Expr::Lit(Lit::Num(Number {
                span: swc_core::common::DUMMY_SP,
                value: 2.0,
                raw: None,
            }))),
        });
        
        let result = evaluate_expression(&expr);
        assert!(result.is_some());
        
        if let Some(Expr::Lit(Lit::Num(n))) = result {
            assert_eq!(n.value, 16.0);
        } else {
            panic!("Expected numeric result");
        }
    }
    
    #[test]
    fn test_evaluate_template_literal_static() {
        // Test `static` (no expressions)
        let expr = Expr::Tpl(Tpl {
            span: swc_core::common::DUMMY_SP,
            exprs: vec![],
            quasis: vec![TplElement {
                span: swc_core::common::DUMMY_SP,
                tail: true,
                cooked: Some("static".into()),
                raw: "static".into(),
            }],
        });
        
        let result = evaluate_expression(&expr);
        assert!(result.is_some());
        
        if let Some(Expr::Lit(Lit::Str(s))) = result {
            assert_eq!(s.value.as_ref(), "static");
        } else {
            panic!("Expected string result");
        }
    }
}