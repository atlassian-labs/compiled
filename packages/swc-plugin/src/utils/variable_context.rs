use swc_core::ecma::ast::*;
use std::collections::HashMap;

/// Context for tracking variable declarations and their values
#[derive(Debug, Clone)]
pub struct VariableContext {
    /// Maps variable names to their constant values
    bindings: HashMap<String, Expr>,
}

impl VariableContext {
    pub fn new() -> Self {
        Self {
            bindings: HashMap::new(),
        }
    }

    /// Add a constant binding to the context
    pub fn add_binding(&mut self, name: String, value: Expr) {
        self.bindings.insert(name, value);
    }

    /// Get a binding by name
    pub fn get_binding(&self, name: &str) -> Option<&Expr> {
        self.bindings.get(name)
    }

    /// Check if a variable is bound
    pub fn has_binding(&self, name: &str) -> bool {
        self.bindings.contains_key(name)
    }
}

/// Extract variable declarations from a module and build a context
pub fn build_variable_context_from_module(module: &Module) -> VariableContext {
    let mut context = VariableContext::new();
    
    for stmt in &module.body {
        extract_variable_declarations_from_stmt(stmt, &mut context);
    }
    
    context
}

/// Extract variable declarations from a statement
fn extract_variable_declarations_from_stmt(stmt: &ModuleItem, context: &mut VariableContext) {
    match stmt {
        ModuleItem::Stmt(stmt) => {
            extract_variable_declarations_from_stmt_inner(stmt, context);
        }
        _ => {} // Skip imports, exports, etc. for now
    }
}

/// Extract variable declarations from a statement (inner)
fn extract_variable_declarations_from_stmt_inner(stmt: &Stmt, context: &mut VariableContext) {
    match stmt {
        Stmt::Decl(Decl::Var(var_decl)) => {
            // Only process const declarations for now
            if matches!(var_decl.kind, VarDeclKind::Const) {
                for decl in &var_decl.decls {
                    if let Pat::Ident(ident) = &decl.name {
                        if let Some(init) = &decl.init {
                            context.add_binding(ident.id.sym.to_string(), (**init).clone());
                        }
                    }
                }
            }
        }
        Stmt::Block(block) => {
            // Process nested statements
            for stmt in &block.stmts {
                extract_variable_declarations_from_stmt_inner(stmt, context);
            }
        }
        _ => {} // Other statement types don't contain variable declarations we care about
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use swc_core::ecma::ast::*;
    use swc_core::common::DUMMY_SP;

    #[test]
    fn test_variable_context() {
        let mut context = VariableContext::new();
        
        // Add a numeric binding
        context.add_binding("size".to_string(), Expr::Lit(Lit::Num(Number {
            span: DUMMY_SP,
            value: 12.0,
            raw: None,
        })));
        
        // Test retrieval
        assert!(context.has_binding("size"));
        assert!(!context.has_binding("unknown"));
        
        let binding = context.get_binding("size").unwrap();
        if let Expr::Lit(Lit::Num(n)) = binding {
            assert_eq!(n.value, 12.0);
        } else {
            panic!("Expected numeric literal");
        }
    }
}