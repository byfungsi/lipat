//! Native JSON CLI for parity tests and command-line hosts. Input/output use the WASM protocol.
use std::io::{self, Read};
fn main() {
    let mut input = String::new();
    let result = match io::stdin().read_to_string(&mut input) {
        Ok(_) => serde_json::from_str(&input)
            .map_err(|e| lipat_model::LipatError::new("invalidInput", e.to_string()))
            .and_then(lipat_wasm::execute),
        Err(e) => Err(lipat_model::LipatError::new("invalidInput", e.to_string())),
    };
    let output = match result {
        Ok(value) => serde_json::json!({"ok":true,"value":value}),
        Err(error) => serde_json::json!({"ok":false,"error":error}),
    };
    println!("{}", serde_json::to_string(&output).unwrap());
}
