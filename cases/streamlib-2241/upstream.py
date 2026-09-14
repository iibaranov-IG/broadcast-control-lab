import inspect
import os
import sys
import types
import unittest


class FakeArray:
    def __init__(self, size):
        self.size = size


numpy = types.ModuleType("numpy")
numpy.ndarray = FakeArray
numpy.float32 = float
numpy.zeros = lambda size, dtype=None: FakeArray(size)
numpy.arange = lambda size: FakeArray(size)
sys.modules["numpy"] = numpy

streamlib = types.ModuleType("streamlib")


class Window:
    def __init__(self, sample_rate, channels, dtype, window_size):
        self.sample_rate = sample_rate
        self.channels = channels
        self.dtype = dtype
        self.window_size = window_size


def processor(**unused):
    def decorate(cls):
        parameters = list(inspect.signature(cls.__init__).parameters.values())[1:]
        if len(parameters) != 1 or parameters[0].name != "config":
            raise TypeError("a processor's config is one class, not a parameter list")
        if parameters[0].annotation is inspect.Parameter.empty:
            raise TypeError("config must be annotated with its settings class")
        return cls
    return decorate


def port(**unused):
    return lambda function: function


streamlib.AudioBlock = type("AudioBlock", (), {})
streamlib.AudioWindowContract = Window
streamlib.RuntimeContextLimitedAccess = type("RuntimeContextLimitedAccess", (), {})
streamlib.input = port
streamlib.output = port
streamlib.processor = processor
sys.modules["streamlib"] = streamlib

example = "examples/microphone-reverb-speaker"
os.chdir(example)
sys.path.insert(0, os.getcwd())
suite = unittest.defaultTestLoader.discover("tests")
result = unittest.TextTestRunner(verbosity=2).run(suite)
if not result.wasSuccessful():
    print("BUG_REVERB_PROCESSOR_CONFIG_SIGNATURE")
    raise SystemExit(1)
print("Ran 2 tests")
