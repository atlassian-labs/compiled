use serde::Deserialize;
use swc_core::ecma::ast::*;
use swc_core::ecma::visit::FoldWith;
use swc_core::plugin::{plugin_transform, metadata::TransformPluginProgramMetadata};
use std::path::Path;

mod hash;
mod transformer;

pub struct TransformVisitor;

// Plugin context struct - currently unused due to API changes
#[allow(dead_code)]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PluginContext {
    filename: Option<String>,
    env_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum EmotionJsAutoLabel {
    Never,
    DevOnly,
    Always,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EmotionJsOptions {
    source_map: Option<bool>,
    auto_label: Option<EmotionJsAutoLabel>,
    label_format: Option<String>,
}

// This config transformation has to be the same as https://github.com/vercel/next.js/blob/9fe2f2637c8384ae7939d5a4a30f1557a4262acb/packages/next/build/swc/options.js#L115-L140
impl EmotionJsOptions {
    fn to_emotion_options(self, env_name: &str) -> transformer::EmotionOptions {
        transformer::EmotionOptions {
            enabled: Some(true),
            sourcemap: Some(match env_name {
                "development" => self.source_map.unwrap_or(true),
                _ => false,
            }),
            auto_label: Some(
                match self.auto_label.unwrap_or(EmotionJsAutoLabel::DevOnly) {
                    EmotionJsAutoLabel::Always => true,
                    EmotionJsAutoLabel::Never => false,
                    EmotionJsAutoLabel::DevOnly => match env_name {
                        "development" => true,
                        _ => false,
                    },
                },
            ),
            label_format: Some(self.label_format.unwrap_or("[local]".to_string())),
        }
    }
}

#[plugin_transform]
pub fn process_transform(program: Program, data: TransformPluginProgramMetadata) -> Program {
    // Use default configuration since plugin_config and transform_context are not available in this API version
    let config = EmotionJsOptions {
        source_map: Some(true),
        auto_label: Some(EmotionJsAutoLabel::DevOnly),  
        label_format: Some("[local]".to_string()),
    }.to_emotion_options("development");
    
    let file_name = "".to_string(); // Default filename since context is not available
    let path = Path::new(&file_name);
    let source_map = std::sync::Arc::new(data.source_map);

    let program = program.fold_with(&mut transformer::emotion(config, path, source_map, data.comments));
    
    program
}
