# ESP-OSC strict-aliasing build failure

ESP-IDF 6.1 promotes GCC's strict-aliasing diagnostic to an error when tinyosc
serializes `float` and `double` arguments by reading them through integer
pointers. The repair copies the bit representation into same-sized integer
objects before applying network byte order.

The unchanged regression compiles the pinned source with GCC, optimization and
strict aliasing enabled. It fails at both reported casts on the baseline. With
the repair applied it also checks the exact OSC wire bytes and parses the values
back, proving the serialization remains unchanged.
