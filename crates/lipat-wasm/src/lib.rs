//! Small explicit ABI: UTF-8 JSON requests and results, owned buffers, no host imports.
use base64::{engine::general_purpose::STANDARD, Engine};
use lipat_model::*;
use serde_json::{json, Value};
fn decode<T: serde::de::DeserializeOwned>(value: Value) -> Result<T> {
    serde_json::from_value(value)
        .map_err(|e| LipatError::new("invalidInput", format!("Invalid request: {e}")))
}
fn encode<T: serde::Serialize>(value: T) -> Result<Value> {
    serde_json::to_value(value).map_err(|_| {
        LipatError::new(
            "serializationFailed",
            "Could not serialize operation output",
        )
    })
}
/// Dispatch the exact same operations from native tests and WASM bindings.
pub fn execute(request: Value) -> Result<Value> {
    let op = request
        .get("operation")
        .and_then(Value::as_str)
        .ok_or_else(|| LipatError::new("invalidInput", "Missing operation"))?;
    match op {
        "parseDocument" => {
            let doc: DeckDocument = decode(request["document"].clone())?;
            check_document(&doc)?;
            encode(doc)
        }
        "apply" => {
            let doc = decode(request["document"].clone())?;
            let operations: Vec<lipat_author::Operation> = decode(request["operations"].clone())?;
            encode(lipat_author::apply_operations(&doc, &operations)?)
        }
        "compile" => {
            let doc = decode(request["document"].clone())?;
            let options = decode(request.get("options").cloned().unwrap_or_else(|| json!({})))?;
            encode(lipat_layout::compile_document(&doc, &options)?)
        }
        "parsePptx" => {
            let bytes =
                STANDARD
                    .decode(request["bytes"].as_str().ok_or_else(|| {
                        LipatError::new("invalidInput", "Expected base64 PPTX bytes")
                    })?)
                    .map_err(|_| LipatError::new("invalidInput", "Invalid base64 PPTX bytes"))?;
            encode(lipat_pptx::parse_pptx(&bytes)?)
        }
        "writePptx" => {
            let scene = decode(request["scene"].clone())?;
            let output = lipat_pptx::write_pptx(&scene)?;
            Ok(json!({"bytes":STANDARD.encode(output.bytes),"diagnostics":output.diagnostics}))
        }
        "importPptx" => {
            let scene = decode(request["scene"].clone())?;
            check_scene(&scene)?;
            let doc = scene_to_document(&scene);
            check_document(&doc)?;
            encode(doc)
        }
        _ => Err(LipatError::new(
            "invalidInput",
            format!("Unknown operation: {op}"),
        )),
    }
}
/// Allocate a zeroed owned request buffer. The host must eventually call lipat_free.
#[no_mangle]
pub extern "C" fn lipat_alloc(len: usize) -> *mut u8 {
    let boxed = vec![0u8; len].into_boxed_slice();
    Box::into_raw(boxed) as *mut u8
}
/// Free a buffer previously returned by lipat_alloc or lipat_execute.
/// # Safety
/// ptr and len must describe one live allocation from this module, exactly once.
#[no_mangle]
pub unsafe extern "C" fn lipat_free(ptr: *mut u8, len: usize) {
    if !ptr.is_null() {
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len)));
    }
}
/// Return a packed (length << 32 | pointer) owned response buffer.
/// # Safety
/// ptr and len must describe a live request buffer owned by this module.
#[no_mangle]
pub unsafe extern "C" fn lipat_execute(ptr: *const u8, len: usize) -> u64 {
    let result = if len > 96 * 1024 * 1024 {
        Err(LipatError::new("resourceLimit", "Request exceeds 96 MiB"))
    } else {
        serde_json::from_slice(std::slice::from_raw_parts(ptr, len))
            .map_err(|_| LipatError::new("invalidInput", "Invalid request JSON"))
            .and_then(execute)
    };
    let value = match result {
        Ok(value) => json!({"ok":true,"value":value}),
        Err(error) => json!({"ok":false,"error":error}),
    };
    let response=serde_json::to_vec(&value).unwrap_or_else(|_|br#"{"ok":false,"error":{"reason":"serializationFailed","message":"Response serialization failed"}}"#.to_vec()).into_boxed_slice();
    let len = response.len();
    let ptr = Box::into_raw(response) as *mut u8;
    ((len as u64) << 32) | (ptr as u64)
}
