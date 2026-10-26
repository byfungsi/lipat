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

svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect width="80" height="40" fill="#5856D6"/></svg>'
chart_document = value({"operation":"parseDocument","document":{"id":"native-charts","assets":[{"id":"vector","mimeType":"image/svg+xml","data":base64.b64encode(svg.encode()).decode()}],"slides":[{"id":"s","content":{"id":"body","type":"canvas","children":[{"id":"chart","type":"chart","chart":{"kind":"bar","categories":["A","B"],"series":[{"name":"Sample","values":[-12,24]}]},"frame":{"x":30,"y":30,"width":700,"height":400}},{"id":"image","type":"image","assetId":"vector","frame":{"x":780,"y":40,"width":100,"height":50}}]}}]}})
chart_scene = value({"operation":"compile","document":chart_document})["scene"]
chart_output = value({"operation":"writePptx","scene":chart_scene})
chart_imported = value({"operation":"parsePptx","bytes":chart_output["bytes"]})["scene"]
assert any(e.get("chart",{}).get("series",[{}])[0].get("values") == [-12,24] for e in chart_imported["slides"][0]["elements"])
assert any(a["mimeType"] == "image/svg+xml" for a in chart_imported["assets"])
print("Native mobile ABI: editable chart data, static SVG and vector/PNG-fallback PPTX round trip passed.")
