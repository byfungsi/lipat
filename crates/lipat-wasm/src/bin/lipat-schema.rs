fn main() {
    let schemas = serde_json::json!({"document":schemars::schema_for!(lipat_model::DeckDocument),"operation":schemars::schema_for!(lipat_author::Operation),"compileOptions":schemars::schema_for!(lipat_model::CompileOptions)});
    println!("{}", serde_json::to_string_pretty(&schemas).unwrap());
}
