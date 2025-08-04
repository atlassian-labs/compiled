use crate::types::TransformState;

/// Inject a debug comment into the JavaScript output for debugging
pub fn inject_debug_comment(state: &mut TransformState, message: &str) {
    // Add the debug message to a list that will be injected as comments
    state.debug_messages.push(message.to_string());
}

/// Inject a console.log statement into the JavaScript output for debugging  
pub fn inject_debug_log(state: &mut TransformState, message: &str) {
    // Add a console.log statement to be injected
    state.debug_messages.push(format!("console.log('[SWC DEBUG] {}');", message));
}