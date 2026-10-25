"""Verify the real Expo/Hermes/JNI application on an Android emulator."""
import pathlib
import re
import subprocess
import time
import xml.etree.ElementTree as ET

output = pathlib.Path("artifacts/android-app")
output.mkdir(parents=True, exist_ok=True)


def adb(*args):
    return subprocess.check_output(["adb", *args], text=True)


def snapshot():
    adb("shell", "uiautomator", "dump", "/sdcard/lipat-ui.xml")
    xml = adb("shell", "cat", "/sdcard/lipat-ui.xml")
    (output / "ui.xml").write_text(xml)
    return ET.fromstring(xml)


def wait_for(predicate, description):
    deadline = time.monotonic() + 90
    while time.monotonic() < deadline:
        tree = snapshot()
        if predicate(tree):
            return tree
        time.sleep(1)
    raise AssertionError(description)


def labels(tree):
    return " ".join(node.get("text", "") + " " + node.get("content-desc", "") for node in tree.iter())


def tap(label):
    tree = snapshot()
    node = next((node for node in tree.iter() if node.get("content-desc") == label or node.get("text") == label), None)
    assert node is not None, f"Missing native control: {label}"
    x1, y1, x2, y2 = map(int, re.findall(r"\d+", node.get("bounds", "")))
    adb("shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2))


try:
    adb("install", "-r", "examples/native-demo/android/app/build/outputs/apk/release/app-release.apk")
    adb("shell", "am", "start", "-n", "dev.byfungsi.lipatdemo/.MainActivity")
    tree = wait_for(lambda tree: "Native Rust verified" in labels(tree), "Native engine initialization/PPTX round trip failed")
    assert "Save" in labels(tree), "Native editor did not mount"
    tap("Save")
    wait_for(lambda tree: "Host saved" in labels(tree), "Host save callback failed")
    tap("present")
    tree = wait_for(lambda tree: "step 0" in labels(tree), "Native player did not mount")
    tap("Next")
    wait_for(lambda tree: "step 1" in labels(tree), "Native reveal navigation failed")
    tap("Previous")
    wait_for(lambda tree: "step 0" in labels(tree), "Native previous navigation failed")
    with (output / "native-player.png").open("wb") as image:
        subprocess.run(["adb", "exec-out", "screencap", "-p"], stdout=image, check=True)
    print("Android Expo/Hermes: real JNI engine, PPTX round trip, native editor, host save and animated reveal navigation passed.")
finally:
    (output / "logcat.txt").write_text(adb("logcat", "-d", "-t", "2000"))
