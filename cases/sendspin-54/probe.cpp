#include "sink_recovery.h"
#include <cstdint>
#include <iostream>
#include <limits>
int main() {
    sendspin_cli::SinkRecovery recovery;
    recovery.discard_frames(14U * 48000U);
    if (recovery.take_discarded_frames() != 672000U) return 1;
    if (recovery.take_discarded_frames() != 0U) return 2;
    recovery.discard_frames(std::numeric_limits<uint32_t>::max() - 10U);
    recovery.discard_frames(100U);
    if (recovery.take_discarded_frames() != std::numeric_limits<uint32_t>::max()) return 3;
    std::cout << "discarded playback gap accounted once without overflow\n";
}
