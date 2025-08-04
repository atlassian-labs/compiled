// Hash compatibility tests to ensure Rust implementation matches JavaScript exactly

use compiled_swc::utils::css_builder::{hash, atomic_class_name};

#[test]
fn test_basic_hash_compatibility() {
    // These expected values come from the original JavaScript implementation
    let test_cases = vec![
        ("color", "1ylxx6h"),
        ("red", "5scuol"),
        ("background-color", "1k61bqq"),
        ("#ff0000", "atby82"),
        ("margin", "1py5azy"),
        ("10px", "19bvopo"),
        ("font-size", "14w90va"),
        ("16px", "exct8b"),
        ("display", "1t0san0"),
        ("flex", "1txwivl"),
        ("colorred", "18ffsfk"),
        ("!important", "pjhvf0"),
        ("", "0"),
        ("a", "14mfbry"),
        ("abc", "5d76aj"),
        ("abcd", "aougpt"),
        ("abcde", "qdaztq"),
        ("abcdef", "l0zreh"),
        ("abcdefgh", "15avom"),
        ("🚀", "ndpmcl"),
        ("café", "1ns33vx"),
    ];

    for (input, expected) in test_cases {
        let result = hash(input);
        assert_eq!(result, expected, "Hash mismatch for input: '{}'", input);
    }
}

#[test]
fn test_atomic_class_name_compatibility() {
    // These expected values come from the original JavaScript atomicClassName implementation
    let test_cases = vec![
        // Basic cases
        ("color", "red", None, None, None, false, "_1ylx5scu"),
        ("background-color", "#ff0000", None, None, None, false, "_1k61atby"),
        ("margin", "10px", None, None, None, false, "_1py519bv"),
        ("font-size", "16px", None, None, None, false, "_14w9exct"),
        ("display", "flex", None, None, None, false, "_1t0s1txw"),
        
        // With important flag
        ("color", "red", None, None, None, true, "_1ylx191l"),
        ("margin", "10px", None, None, None, true, "_1py5kelz"),
        
        // With at-rule (media queries)
        ("color", "red", Some("@media (min-width: 768px)"), None, None, false, "_sivo5scu"),
        ("font-size", "18px", Some("@media (max-width: 480px)"), None, None, false, "_187af6fq"),
        
        // With selectors (pseudo classes)
        ("color", "blue", None, Some(":hover"), None, false, "_1n5a13q2"),
        ("background", "yellow", None, Some(":focus:active"), None, false, "_cu6i1gy6"),
        
        // With class hash prefix
        ("color", "green", None, None, Some("my-prefix-"), false, "_rarhbf54"),
        
        // Complex case with all options
        ("color", "purple", Some("@media (min-width: 768px)"), Some(":hover"), Some("comp-"), true, "_9w9h1bxr"),
    ];

    for (property, value, at_rule, selectors, prefix, important, expected) in test_cases {
        let result = atomic_class_name(property, value, at_rule, selectors, prefix, important);
        assert_eq!(result, expected, 
                   "Atomic class name mismatch for: property={}, value={}, at_rule={:?}, selectors={:?}, prefix={:?}, important={}", 
                   property, value, at_rule, selectors, prefix, important);
    }
}

#[test]
fn test_edge_cases() {
    // Test empty strings
    assert_eq!(hash(""), "0");
    
    // Test single character
    assert_eq!(hash("a"), "14mfbry");
    
    // Test Unicode characters
    assert_eq!(hash("🚀"), "ndpmcl");
    assert_eq!(hash("café"), "1ns33vx");
    
    // Test atomic class name with empty values
    let result = atomic_class_name("", "", None, None, None, false);
    assert!(result.starts_with("_"));
    assert_eq!(result.len(), 9); // Format: _{4chars}{4chars}
}

#[test]
fn test_hash_deterministic() {
    // Hash function should be deterministic - same input should always produce same output
    let input = "test-deterministic";
    let result1 = hash(input);
    let result2 = hash(input);
    assert_eq!(result1, result2);
    
    // Same for atomic class names
    let atomic1 = atomic_class_name("color", "red", None, None, None, false);
    let atomic2 = atomic_class_name("color", "red", None, None, None, false);
    assert_eq!(atomic1, atomic2);
}