#!/usr/bin/env python3
"""Execute PsychoPy's production JS generator methods with a minimal buffer."""

import ast
import sys
from copy import copy
from pathlib import Path


class Param:
    def __init__(self, value):
        self.val = value

    def copy(self):
        return Param(self.val)

    def __str__(self):
        return str(self.val)


class Buffer:
    def __init__(self):
        self.indentLevel = 0
        self.lines = []

    def setIndentLevel(self, value, relative=False):
        self.indentLevel = self.indentLevel + value if relative else value

    def writeIndentedLines(self, value):
        for line in value.splitlines():
            self.lines.append("    " * self.indentLevel + line)

    def text(self):
        return "\n".join(self.lines)


def load_method(path, class_name, method_name):
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    cls = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == class_name)
    method = copy(next(
        node for node in cls.body
        if isinstance(node, ast.FunctionDef) and node.name == method_name
    ))
    method.decorator_list = []
    module = ast.fix_missing_locations(ast.Module(body=[method], type_ignores=[]))
    namespace = {"getInitVals": lambda params: params.copy(), "CodeGenerationException": RuntimeError}
    exec(compile(module, str(path), "exec"), namespace)
    return namespace[method_name]


def generate(source):
    base = source / "psychopy/experiment/components/_base.py"
    microphone = source / "psychopy/experiment/components/microphone/__init__.py"

    class Component:
        parentName = "trial"
        params = {
            "name": Param("mic"),
            "startType": Param("time (s)"),
            "startVal": Param(0),
            "stopType": Param("duration (s)"),
            "stopVal": Param(2),
            "saveStartStop": Param(False),
        }

        def checkNeedToUpdate(self, _update_type):
            return False

        def writeParamUpdatesJS(self, *_args):
            raise AssertionError("No frame updates are configured in this probe")

    Component.writeStartTestCodeJS = load_method(base, "BaseComponent", "writeStartTestCodeJS")
    Component.writeStopTestCodeJS = load_method(base, "BaseComponent", "writeStopTestCodeJS")
    Component.writeFrameCodeJS = load_method(microphone, "MicrophoneComponent", "writeFrameCodeJS")

    buff = Buffer()
    Component().writeFrameCodeJS(buff)
    return buff.text()


source = Path(sys.argv[1]).resolve()
script = generate(source)
pause = script.find("mic.pause();")
finished = script.find("mic.status = PsychoJS.Status.FINISHED;")

if pause < 0 or finished < 0:
    print("MICROPHONE_STOP_MISSING: generated pause or finished statement is absent", file=sys.stderr)
    raise SystemExit(1)
if finished < pause:
    print("MICROPHONE_STOP_ORDER: generated code marks the microphone FINISHED before pause()", file=sys.stderr)
    raise SystemExit(1)
if script.count("mic.status = PsychoJS.Status.FINISHED;") != 1:
    print("MICROPHONE_STOP_DUPLICATE: expected one generated FINISHED transition", file=sys.stderr)
    raise SystemExit(1)

print("PASS: generated PsychoJS pauses the active microphone before marking it FINISHED")
print("Ran 1 test")
