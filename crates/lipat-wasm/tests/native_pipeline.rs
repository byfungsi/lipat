use lipat_wasm::execute;
use serde_json::{json, Value};
fn source() -> Value {
    json!({"id":"native","slides":[{"id":"s","notes":"Native notes","content":{"id":"root","type":"stack","children":[{"id":"heading","type":"heading","text":"Native → WASM"},{"id":"grid","type":"grid","columns":2,"children":[{"id":"a","type":"text","text":"One"},{"id":"b","type":"text","text":"Two"}]}]}}]})
}
#[test]
fn complete_native_pipeline() {
    let doc = execute(json!({"operation":"parseDocument","document":source()})).unwrap();
    let edited=execute(json!({"operation":"apply","document":doc,"operations":[{"type":"updateText","nodeId":"heading","text":"Updated natively"}]})).unwrap();
    let compiled = execute(json!({"operation":"compile","document":edited})).unwrap();
    assert_eq!(
        compiled["scene"]["slides"][0]["elements"][0]["text"],
        "Updated natively"
    );
    let exported = execute(json!({"operation":"writePptx","scene":compiled["scene"]})).unwrap();
    let imported = execute(json!({"operation":"parsePptx","bytes":exported["bytes"]})).unwrap();
    assert_eq!(imported["scene"]["slides"][0]["notes"], "Native notes");
    assert_eq!(
        imported["scene"]["slides"][0]["elements"][0]["text"],
        "Updated natively"
    );
    let lifted = execute(json!({"operation":"importPptx","scene":imported["scene"]})).unwrap();
    assert_eq!(lifted["slides"][0]["content"]["type"], "canvas");
}
#[test]
fn failed_transaction_preserves_source() {
    let doc = execute(json!({"operation":"parseDocument","document":source()})).unwrap();
    let before = doc.clone();
    let result = execute(
        json!({"operation":"apply","document":doc,"operations":[{"type":"updateText","nodeId":"heading","text":"Changed"},{"type":"deleteNode","nodeId":"missing"}]}),
    );
    assert!(result.is_err());
    assert_eq!(doc, before);
}
#[test]
fn rejects_duplicate_ids_and_invalid_fonts() {
    let mut doc = source();
    doc["slides"][0]["content"]["children"][0]["id"] = json!("root");
    assert!(execute(json!({"operation":"parseDocument","document":doc})).is_err());
    let doc = execute(json!({"operation":"parseDocument","document":source()})).unwrap();
    assert!(execute(json!({"operation":"compile","document":doc,"options":{"fonts":[{"family":"Arial","averageWidth":-1,"lineHeight":1}]}})).is_err());
}
