# StreamLib #2241

The current `@processor` decorator requires one annotated config object, while
the microphone reverb example still declares four constructor keyword
parameters. Importing the example therefore fails before its audio graph starts.

The repair introduces a dataclass with the same defaults and reads every dial
from that object. BCL exercises the decorator contract and focused construction
tests before and after the patch. The candidate was also imported against the
published StreamLib 0.22.6 x86_64 wheel.
