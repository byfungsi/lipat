"""Exercise the real native mobile ABI, including 64-bit pointers and owned responses."""
import base64
import ctypes
import json
import sys

library = ctypes.CDLL(sys.argv[1])
library.lipat_native_execute.argtypes = [ctypes.c_char_p, ctypes.c_size_t]
library.lipat_native_execute.restype = ctypes.c_void_p
library.lipat_native_free.argtypes = [ctypes.c_void_p]
library.lipat_native_free.restype = None
assert library.lipat_native_abi_version() == 1

def execute(request):
    data = json.dumps(request, ensure_ascii=False).encode()
    pointer = library.lipat_native_execute(data, len(data))
    assert pointer
    try:
        result = json.loads(ctypes.string_at(pointer))
    finally:
        library.lipat_native_free(pointer)
    return result

def value(request):
    result = execute(request)
    assert result["ok"], result
    return result["value"]

document = value({"operation": "parseDocument", "document": {"id": "native", "slides": [{"id": "s", "content": {"id": "text", "type": "heading", "text": "Native Lipat 日本語 🦀", "animation": {"effect": "zoom"}, "step": 1}}]}})
scene = value({"operation": "compile", "document": document})["scene"]
output = value({"operation": "writePptx", "scene": scene})
assert base64.b64decode(output["bytes"]).startswith(b"PK")
parsed = value({"operation": "parsePptx", "bytes": output["bytes"]})
assert any("Native Lipat" in element.get("text", "") and element.get("animation", {}).get("effect") == "zoom" for element in parsed["scene"]["slides"][0]["elements"])
for _ in range(100):
    denied = execute({"operation": "parseDocument", "document": document, "limits": {"maxTextBytes": 3}})
    assert denied["error"]["reason"] == "resourceLimit", denied
assert value({"operation": "resourceLimits"})["maxDepth"] == 64
print("Native mobile ABI: real pointer ownership, Unicode, compile, animated PPTX export/import and independent limits passed.")
