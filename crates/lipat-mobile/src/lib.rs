//! Native mobile JSON ABI. Uses pointer-sized lengths; the WASM packed 32-bit pointer ABI is never used by a native host.
use serde_json::json;
use std::ffi::{c_char, CString};

/// Execute the same Rust protocol as WASM; hard byte admission happens before JSON decoding.
pub fn execute_json(bytes: &[u8]) -> String {
    let result = if bytes.len() > 96 * 1024 * 1024 {
        Err(lipat_model_error("resourceLimit", "Request exceeds 96 MiB"))
    } else {
        serde_json::from_slice(bytes)
            .map_err(|_| lipat_model_error("invalidInput", "Invalid request JSON"))
            .and_then(lipat_wasm::execute)
    };
    match result {
        Ok(value) => json!({"ok":true,"value":value}).to_string(),
        Err(error) => json!({"ok":false,"error":error}).to_string(),
    }
}
// The dispatch crate reuses the model's error contract; keep this owner explicit in Cargo dependencies.
fn lipat_model_error(reason: &str, message: &str) -> lipat_model::LipatError {
    lipat_model::LipatError::new(reason, message)
}
/// Native ABI version for the JavaScript bridge to check before accepting a module.
#[no_mangle]
pub extern "C" fn lipat_native_abi_version() -> u32 {
    1
}
/// Return a UTF-8 JSON C string. The caller owns it and must free it exactly once with lipat_native_free.
/// # Safety
/// Input must describe a readable buffer for len bytes, or be null with length zero.
#[no_mangle]
pub unsafe extern "C" fn lipat_native_execute(input: *const u8, len: usize) -> *mut c_char {
    let response = if input.is_null() && len != 0 {
        json!({"ok":false,"error":{"reason":"invalidInput","message":"Native request buffer is null"}}).to_string()
    } else if len > 96 * 1024 * 1024 {
        json!({"ok":false,"error":{"reason":"resourceLimit","message":"Request exceeds 96 MiB"}})
            .to_string()
    } else {
        let bytes = if len == 0 {
            &[]
        } else {
            std::slice::from_raw_parts(input, len)
        };
        execute_json(bytes)
    };
    // JSON strings escape NUL characters, so the serialized envelope cannot contain an interior NUL.
    CString::new(response)
        .expect("Native JSON invariant failed: interior NUL")
        .into_raw()
}
/// Release one response allocated by lipat_native_execute; null is accepted.
/// # Safety
/// A non-null pointer must be a live response returned by this library and must not be freed twice.
#[no_mangle]
pub unsafe extern "C" fn lipat_native_free(response: *mut c_char) {
    if !response.is_null() {
        drop(CString::from_raw(response));
    }
}

#[cfg(target_os = "android")]
mod android {
    use jni::{
        objects::{JObject, JString},
        sys::{jint, jstring},
        JNIEnv,
    };
    #[no_mangle]
    pub extern "system" fn Java_expo_modules_lipat_LipatModule_getAbiVersionNative(
        _env: JNIEnv,
        _object: JObject,
    ) -> jint {
        super::lipat_native_abi_version() as jint
    }
    #[no_mangle]
    pub extern "system" fn Java_expo_modules_lipat_LipatModule_executeNative(
        mut env: JNIEnv,
        _object: JObject,
        request: JString,
    ) -> jstring {
        let result = (|| {
            let input: String = env.get_string(&request)?.into();
            let output = super::execute_json(input.as_bytes());
            env.new_string(output).map(|value| value.into_raw())
        })();
        match result {
            Ok(value) => value,
            Err(_) => {
                let _ = env.throw_new(
                    "java/lang/IllegalStateException",
                    "Lipat native JSON bridge failed",
                );
                std::ptr::null_mut()
            }
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn native_response_uses_owned_pointer_sized_buffers() {
        let input=br#"{"operation":"parseDocument","document":{"id":"mobile","slides":[{"id":"s","content":{"id":"t","type":"heading","text":"Native Lipat"}}]}}"#;
        unsafe {
            let pointer = lipat_native_execute(input.as_ptr(), input.len());
            let value: serde_json::Value =
                serde_json::from_slice(std::ffi::CStr::from_ptr(pointer).to_bytes()).unwrap();
            assert_eq!(value["ok"], true);
            assert_eq!(
                value["value"]["slides"][0]["content"]["text"],
                "Native Lipat"
            );
            lipat_native_free(pointer);
            let empty = lipat_native_execute(std::ptr::null(), 0);
            assert!(std::ffi::CStr::from_ptr(empty)
                .to_str()
                .unwrap()
                .contains("invalidInput"));
            lipat_native_free(empty);
        }
    }
}
